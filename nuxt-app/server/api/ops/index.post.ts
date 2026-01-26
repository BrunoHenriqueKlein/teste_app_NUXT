import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const body = await readBody(event)

    // Validar dados obrigatórios
    if (!body.numeroOP || !body.descricaoMaquina || !body.cliente) {
      throw createError({
        statusCode: 400,
        message: 'Número da OP, descrição e cliente são obrigatórios'
      })
    }

    // Verificar se número da OP já existe
    const existingOP = await prisma.oP.findFirst({
      where: {
        numeroOP: body.numeroOP
      }
    })

    if (existingOP) {
      throw createError({
        statusCode: 400,
        message: 'Já existe uma OP com este número'
      })
    }

    // 🔥 SOLUÇÃO TEMPORÁRIA - Pegar o primeiro usuário do banco
    const primeiroUsuario = await prisma.user.findFirst({
      select: { id: true }
    })

    if (!primeiroUsuario) {
      throw createError({
        statusCode: 400,
        message: 'Nenhum usuário encontrado no sistema'
      })
    }

    // Criar OP com usuário válido e processos do template se houver
    const op = await prisma.$transaction(async (tx: any) => {
      const newOp = await tx.oP.create({
        data: {
          numeroOP: body.numeroOP,
          codigoMaquina: body.codigoMaquina,
          descricaoMaquina: body.descricaoMaquina,
          dataPedido: body.dataPedido ? new Date(body.dataPedido) : new Date(),
          dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : new Date(),
          cliente: body.cliente,
          cnpjCliente: body.cnpjCliente,
          enderecoCliente: body.enderecoCliente,
          observacoes: body.observacoes,
          status: body.status || 'AGUARDANDO',
          progresso: (body.progresso ? parseInt(body.progresso) : 0) as number,
          criadoPorId: primeiroUsuario.id
        },
        include: {
          criadoPor: { select: { id: true, name: true, email: true } }
        }
      })

      // Se houver template, carregar processos e criar na OP com cálculo de datas base
      if (body.templateId) {
        const template = await tx.configTemplateOP.findUnique({
          where: { id: parseInt(body.templateId) },
          include: { processos: { include: { processo: true }, orderBy: { sequencia: 'asc' } } }
        })

        if (template && template.processos.length > 0) {
          let dataInicioAtual = new Date(newOp.dataPedido)
          dataInicioAtual.setHours(0, 0, 0, 0)

          for (const [index, tp] of template.processos.entries()) {
            const pData = tp.processo
            const prazo = pData.prazoEstimadoPadrao || 1

            const dataInicioPrevista = new Date(dataInicioAtual)
            const dataTerminoPrevista = new Date(dataInicioPrevista)
            dataTerminoPrevista.setDate(dataTerminoPrevista.getDate() + prazo - 1)
            dataTerminoPrevista.setHours(0, 0, 0, 0)

            await tx.oPProcesso.create({
              data: {
                opId: newOp.id,
                nome: pData.nome,
                descricao: pData.descricao,
                sequencia: index + 1,
                status: 'NAO_INICIADO',
                progresso: 0,
                prazoEstimado: prazo,
                dataInicioPrevista: dataInicioPrevista,
                dataTerminoPrevista: dataTerminoPrevista,
                responsavelId: pData.responsavelId
              }
            })

            dataInicioAtual = new Date(dataTerminoPrevista)
            dataInicioAtual.setDate(dataInicioAtual.getDate() + 1)
            dataInicioAtual.setHours(0, 0, 0, 0)
          }
        }
      }

      return newOp
    })

    // Criar histórico
    await prisma.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: primeiroUsuario.id,
        acao: 'OP criada',
        detalhes: `OP ${body.numeroOP} criada no sistema`
      }
    })

    return { success: true, op }
  } catch (error: any) {
    console.error('Erro ao criar OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao criar OP'
    })
  }
})