import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'
const prisma = new PrismaClient()

export default defineEventHandler(async (event: any) => {
  const roteiroId = parseInt(event.context.params?.id as string)
  
  if (isNaN(roteiroId)) {
    throw createError({
      statusCode: 400,
      message: 'ID do roteiro inválido'
    })
  }

  try {
    const body = await readBody(event)
    const { precosTratamento } = body

    if (!precosTratamento || typeof precosTratamento !== 'object') {
       throw createError({ statusCode: 400, message: 'Preços por tratamento não informados' })
    }

    const roteiro = await prisma.roteiro.findUnique({
      where: { id: roteiroId },
      include: { 
        itens: {
          include: { peca: true }
        }
      }
    })

    if (!roteiro) throw createError({ statusCode: 404, message: 'Roteiro não encontrado' })

    let totalRoteiro = 0

    // Atualiza o valor de cada item baseado no peso e no tratamento
    for (const item of roteiro.itens) {
      if (item.pesoIndividual) {
        let nomeTrat = item.tratamento || 'Zinco'
        if (item.peca?.detalheTratamento) {
          nomeTrat = `${nomeTrat} - ${item.peca.detalheTratamento}`
        }
        const precoKg = precosTratamento[nomeTrat] || 0
        
        const totalPesoItem = item.pesoIndividual * item.quantidade
        const valorTotalItem = totalPesoItem * precoKg
        const valorUn = item.pesoIndividual * precoKg

        totalRoteiro += valorTotalItem

        await prisma.roteiroItem.update({
          where: { id: item.id },
          data: {
            valorUnitario: valorUn,
            valorTotal: valorTotalItem
          }
        })
        
        // Atualiza o custoTratamento na Peça e reflete no custoTotal
        const peca = await prisma.peca.findUnique({ where: { id: item.pecaId } })
        if (peca) {
          const custoAntigo = peca.custoTratamento || 0
          const diferenca = valorUn - custoAntigo
          const novoCustoTotal = (peca.custoTotal || 0) + (diferenca * peca.quantidade)

          await prisma.peca.update({
            where: { id: peca.id },
            data: {
              custoTratamento: valorUn,
              custoTotal: novoCustoTotal
            }
          })
        }
      }
    }

    // Atualiza o total do roteiro
    await prisma.roteiro.update({
      where: { id: roteiroId },
      data: { 
        valorTotal: totalRoteiro
      }
    })

    return { message: 'Valores atualizados com sucesso', valorTotal: totalRoteiro }
  } catch (error: any) {
    console.error('Erro ao atualizar preços do zinco:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao atualizar preços'
    })
  }
})
