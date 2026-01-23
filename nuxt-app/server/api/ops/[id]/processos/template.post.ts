import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const body = await readBody(event)
    const prisma = event.context.prisma

    console.log('🎯 Aplicando template - OP ID:', opId)
    console.log('🎯 Template ID:', body.templateId)

    if (!opId || !body.templateId) {
      throw createError({ statusCode: 400, message: 'Dados incompletos' })
    }

    const opExistente = await prisma.oP.findUnique({ where: { id: parseInt(opId) } })
    if (!opExistente) {
      throw createError({ statusCode: 404, message: 'OP não encontrada' })
    }

    // Buscar template real do banco
    const template = await prisma.configTemplateOP.findUnique({
      where: { id: parseInt(body.templateId) },
      include: {
        processos: {
          include: { processo: true },
          orderBy: { sequencia: 'asc' }
        }
      }
    })

    if (!template) {
      throw createError({ statusCode: 404, message: 'Template não encontrado' })
    }

    const processosExistentes = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { sequencia: true }
    })

    const maiorSequencia = processosExistentes.length > 0 ? Math.max(...processosExistentes.map((p: any) => p.sequencia)) : 0

    // Pegar data de início (Prioridade: dataInicio -> dataPedido -> hoje)
    let dataInicioAtual = new Date(opExistente.dataInicio || opExistente.dataPedido || new Date())
    dataInicioAtual.setHours(0, 0, 0, 0)

    const processosCriados = []

    for (const [index, item] of template.processos.entries()) {
      const pData = item.processo
      const prazo = pData.prazoEstimadoPadrao || 1

      const dataInicioPrevista = new Date(dataInicioAtual)
      const dataTerminoPrevista = new Date(dataInicioPrevista)
      dataTerminoPrevista.setDate(dataTerminoPrevista.getDate() + prazo - 1)
      dataTerminoPrevista.setHours(0, 0, 0, 0)

      const novoProcesso = await prisma.oPProcesso.create({
        data: {
          opId: parseInt(opId),
          nome: pData.nome,
          descricao: pData.descricao,
          sequencia: maiorSequencia + index + 1,
          status: 'PENDENTE',
          progresso: 0,
          prazoEstimado: prazo,
          dataInicioPrevista: dataInicioPrevista,
          dataTerminoPrevista: dataTerminoPrevista
        }
      })
      processosCriados.push(novoProcesso)

      dataInicioAtual = new Date(dataTerminoPrevista)
      dataInicioAtual.setDate(dataInicioAtual.getDate() + 1)
      dataInicioAtual.setHours(0, 0, 0, 0)
    }

    // Atualizar progresso da OP
    const todosProcessos = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    })

    const progressoMedio = todosProcessos.length > 0
      ? Math.round(todosProcessos.reduce((sum: number, p: any) => sum + p.progresso, 0) / todosProcessos.length)
      : 0

    await prisma.oP.update({
      where: { id: parseInt(opId) },
      data: { progresso: progressoMedio }
    })

    return { success: true, processos: processosCriados }

  } catch (error: any) {
    console.error('❌ Erro ao aplicar template:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao aplicar template'
    })
  }
})