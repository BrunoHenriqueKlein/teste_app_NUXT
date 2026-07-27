import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID é obrigatório' })
  }

  try {
    await prisma.rNC.delete({
      where: { id: Number(id) }
    })
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir RNC:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao excluir RNC'
    })
  }
})
