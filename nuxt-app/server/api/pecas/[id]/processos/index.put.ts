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

    if (Array.isArray(body)) {
      const updates = body.map(async (processo) => {
        return prisma.processoPeca.update({
          where: { id: parseInt(processo.id) },
          data: {
            nome: processo.nome,
            sequencia: processo.sequencia,
            status: processo.status,
            tempoEstimado: processo.tempoEstimado ? parseInt(processo.tempoEstimado) : null,
            fornecedorId: processo.fornecedorId ? parseInt(processo.fornecedorId) : null,
            valorCusto: processo.valorCusto ? parseFloat(processo.valorCusto) : null,
          }
        })
      })
      await Promise.all(updates)
      processosFinais = await prisma.processoPeca.findMany({ where: { pecaId: parseInt(pecaId) }, orderBy: { sequencia: 'asc' } })
    } else {
      if (!body.id) {
        throw createError({ statusCode: 400, message: 'ID do processo não informado' })
      }
      await prisma.processoPeca.update({
        where: { id: parseInt(body.id) },
        data: {
          nome: body.nome,
          sequencia: body.sequencia,
          status: body.status,
          tempoEstimado: body.tempoEstimado ? parseInt(body.tempoEstimado) : null,
          fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : null,
          valorCusto: body.valorCusto ? parseFloat(body.valorCusto) : null,
        }
      })
      processosFinais = await prisma.processoPeca.findMany({ where: { pecaId: parseInt(pecaId) }, orderBy: { sequencia: 'asc' } })
    }

    // Automação de Status da Peça
    if (processosFinais.length > 0) {
      let novoStatusPeca = 'NAO_INICIADA'
      const todosConcluidos = processosFinais.every((p: any) => p.status === 'CONCLUIDO')
      const algumEmAndamento = processosFinais.some((p: any) => p.status === 'EM_ANDAMENTO')
      
      if (todosConcluidos) {
        novoStatusPeca = 'EM_ESTOQUE'
      } else if (algumEmAndamento) {
        novoStatusPeca = 'EM_FABRICACAO'
      } else {
        const temConcluido = processosFinais.some((p: any) => p.status === 'CONCLUIDO')
        if (temConcluido) {
          novoStatusPeca = 'AGUARDANDO_RECEBIMENTO'
        } else {
          novoStatusPeca = 'NAO_INICIADA'
        }
      }

      await prisma.peca.update({
        where: { id: parseInt(pecaId) },
        data: { status: novoStatusPeca }
      })
    }

    return { success: true, message: 'Processos atualizados com sucesso' }
  } catch (error) {
    console.error('API: Erro ao atualizar processos da peça:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao atualizar processo'
    })
  }
})
