import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const roteiroId = parseInt(event.context.params?.id as string)
  
  if (isNaN(roteiroId)) {
    throw createError({
      statusCode: 400,
      message: 'ID do roteiro inválido'
    })
  }

  try {
    const body = await readBody(event)
    const processosIds = body.processosIds || []

    if (!Array.isArray(processosIds) || processosIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Nenhum processo fornecido'
      })
    }

    // Busca os processos completos
    const processos = await prisma.processoPeca.findMany({
      where: {
        id: { in: processosIds }
      },
      include: {
        peca: {
          include: {
            anexos: true
          }
        }
      }
    })

    const novosItens = []

    // Insere os itens
    for (const proc of processos) {
      // Pega a imagem se houver
      let imagemUrl = proc.peca.imagem || null
      if (!imagemUrl && proc.peca.anexos && proc.peca.anexos.length > 0) {
        imagemUrl = proc.peca.anexos[0].url
      }

      let tratamentoFinal = proc.nome
      if (proc.peca.detalheTratamento && (proc.nome.toLowerCase().includes('pintura') || proc.nome.toLowerCase().includes('zinco') || (proc.peca.tratamentoSuperficial && proc.peca.tratamentoSuperficial.toLowerCase() === proc.nome.toLowerCase()))) {
        tratamentoFinal += ' - ' + proc.peca.detalheTratamento
      }

      const newItem = await prisma.roteiroItem.create({
        data: {
          roteiroId,
          pecaId: proc.pecaId,
          quantidade: proc.peca.quantidade,
          tratamento: tratamentoFinal,
          imagemUrl: imagemUrl,
          pesoIndividual: proc.peca.peso,
          areaSuperficial: proc.peca.areaSuperficial,
          dimensoesExternas: proc.peca.dimensoesExternas
        }
      })
      novosItens.push(newItem)

    }

    return { message: 'Itens importados com sucesso', count: novosItens.length }
  } catch (error: any) {
    console.error('Erro ao importar itens pro roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao importar itens'
    })
  }
})
