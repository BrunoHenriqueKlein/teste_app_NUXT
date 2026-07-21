import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  const pecaId = getRouterParam(event, 'id')
  
  if (!pecaId) {
    throw createError({ statusCode: 400, message: 'ID da Peça não informado' })
  }

  const body = await readBody(event)
  
  try {
    let processosFinais = []

    if (body.processos && Array.isArray(body.processos)) {
      const existing = await prisma.processoPeca.findMany({ where: { pecaId: parseInt(pecaId) } })
      
      const payloadIds = body.processos.map((p: any) => p.id).filter((id: any) => id)

      // 1. Apaga apenas os antigos que foram removidos da lista
      if (payloadIds.length > 0) {
        await prisma.processoPeca.deleteMany({
          where: { 
            pecaId: parseInt(pecaId),
            id: { notIn: payloadIds.map(Number) }
          }
        })
      } else {
        await prisma.processoPeca.deleteMany({
          where: { pecaId: parseInt(pecaId) }
        })
      }

      // 2. Atualiza existentes ou cria novos
      const upsertPromises = body.processos.map((p: any, index: number) => {
        const dataToSave = {
          nome: p.nome,
          sequencia: index + 1,
          status: p.status || 'NAO_INICIADO',
          tempoEstimado: p.tempoEstimado ? parseInt(p.tempoEstimado) : null,
          fornecedorId: p.fornecedorId ? parseInt(p.fornecedorId) : null,
          valorCusto: p.valorCusto ? parseFloat(p.valorCusto) : null,
        }
        
        if (p.id) {
          return prisma.processoPeca.update({
            where: { id: parseInt(p.id) },
            data: dataToSave
          })
        } else {
          return prisma.processoPeca.create({
            data: { ...dataToSave, pecaId: parseInt(pecaId) }
          })
        }
      })

      await Promise.all(upsertPromises)
      
      processosFinais = await prisma.processoPeca.findMany({
        where: { pecaId: parseInt(pecaId) },
        orderBy: { sequencia: 'asc' }
      })
    } else {
      // Criação unitária
      const novoProcesso = await prisma.processoPeca.create({
        data: {
          pecaId: parseInt(pecaId),
          nome: body.nome,
          sequencia: body.sequencia,
          status: body.status || 'NAO_INICIADO',
          tempoEstimado: body.tempoEstimado ? parseInt(body.tempoEstimado) : null,
          fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : null,
          valorCusto: body.valorCusto ? parseFloat(body.valorCusto) : null,
        }
      })
      processosFinais = await prisma.processoPeca.findMany({ where: { pecaId: parseInt(pecaId) }, orderBy: { sequencia: 'asc' } })
    }

    // 3. Automação de Status da Peça (Lógica de Vai e Vem do PCP)
    if (processosFinais.length > 0) {
      let novoStatusPeca = 'NAO_INICIADA'
      
      const todosConcluidos = processosFinais.every((p: any) => p.status === 'CONCLUIDO')
      const algumEmAndamento = processosFinais.some((p: any) => p.status === 'EM_ANDAMENTO')
      
      if (todosConcluidos) {
        novoStatusPeca = 'EM_ESTOQUE' // Tudo finalizado, pronta para uso
      } else if (algumEmAndamento) {
        novoStatusPeca = 'EM_FABRICACAO' // Está fisicamente no fornecedor/processo
      } else {
        // Tem processos, não estão todos concluídos, e nenhum em andamento.
        // Significa que terminou uma etapa e está aguardando a próxima!
        const temConcluido = processosFinais.some((p: any) => p.status === 'CONCLUIDO')
        if (temConcluido) {
          novoStatusPeca = 'AGUARDANDO_RECEBIMENTO' // Ou poderíamos usar um status como "Aguardando Envio"
        } else {
          novoStatusPeca = 'NAO_INICIADA' // Nenhum processo foi iniciado ainda
        }
      }

      await prisma.peca.update({
        where: { id: parseInt(pecaId) },
        data: { status: novoStatusPeca }
      })
    }

    return { success: true, message: 'Processos salvos com sucesso e status atualizado' }
  } catch (error) {
    console.error('API: Erro ao salvar processos da peça:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao salvar processos'
    })
  }
})
