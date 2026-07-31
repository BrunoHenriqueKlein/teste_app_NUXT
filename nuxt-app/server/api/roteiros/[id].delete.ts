import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError } from 'h3'

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
    await prisma.roteiro.delete({
      where: { id: roteiroId }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Erro ao excluir roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao excluir roteiro'
    })
  }
})
