import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event: any) => {
  const roteiroId = parseInt(event.context.params?.id as string)
  const itemId = parseInt(event.context.params?.itemId as string)

  if (isNaN(roteiroId) || isNaN(itemId)) {
    throw createError({ statusCode: 400, message: 'Parâmetros inválidos' })
  }

  try {
    const body = await readBody(event)
    const valorUnitario = parseFloat(body.valorUnitario)

    if (isNaN(valorUnitario) || valorUnitario < 0) {
      throw createError({ statusCode: 400, message: 'Valor unitário inválido' })
    }

    // Busca o item para saber a quantidade
    const roteiroItem = await prisma.roteiroItem.findUnique({
      where: { id: itemId }
    })

    if (!roteiroItem) {
      throw createError({ statusCode: 404, message: 'Item não encontrado' })
    }

    // Calcula o valor total do item
    const valorTotalItem = valorUnitario * roteiroItem.quantidade

    // Atualiza o item
    const updatedItem = await prisma.roteiroItem.update({
      where: { id: itemId },
      data: {
        valorUnitario: valorUnitario,
        valorTotal: valorTotalItem
      }
    })

    // Atualiza o custoTratamento na Peça (reflete o valor unitário digitado)
    const peca = await prisma.peca.findUnique({ where: { id: roteiroItem.pecaId } })
    if (peca) {
      const custoAntigo = peca.custoTratamento || 0
      const diferenca = valorUnitario - custoAntigo
      const novoCustoTotal = (peca.custoTotal || 0) + (diferenca * peca.quantidade)

      await prisma.peca.update({
        where: { id: peca.id },
        data: {
          custoTratamento: valorUnitario,
          custoTotal: novoCustoTotal
        }
      })
    }

    // Recalcula o valor total do roteiro somando todos os itens
    const todosItens = await prisma.roteiroItem.findMany({
      where: { roteiroId }
    })
    
    const valorTotalRoteiro = todosItens.reduce((sum, item) => sum + (item.valorTotal || 0), 0)

    await prisma.roteiro.update({
      where: { id: roteiroId },
      data: { valorTotal: valorTotalRoteiro }
    })

    return { message: 'Preço atualizado com sucesso', item: updatedItem, valorTotalRoteiro }
  } catch (error: any) {
    console.error('Erro ao salvar preço do item:', error)
    throw createError({ statusCode: 500, message: 'Erro interno' })
  }
})
