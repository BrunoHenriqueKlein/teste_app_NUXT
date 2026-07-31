import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event: any) => {
  const itemId = parseInt(event.context.params?.id as string)
  
  if (isNaN(itemId)) {
    throw createError({
      statusCode: 400,
      message: 'ID do item inválido'
    })
  }

  try {
    const body = await readBody(event)
    const { quantidadeEnviada, quantidadeRecebida } = body

    const updateData: any = {}
    if (quantidadeEnviada !== undefined) updateData.quantidadeEnviada = parseInt(quantidadeEnviada)
    if (quantidadeRecebida !== undefined) updateData.quantidadeRecebida = parseInt(quantidadeRecebida)

    const itemAtualizado = await prisma.roteiroItem.update({
      where: { id: itemId },
      data: updateData
    })

    return itemAtualizado
  } catch (error: any) {
    console.error('Erro ao atualizar item do roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao atualizar item'
    })
  }
})
