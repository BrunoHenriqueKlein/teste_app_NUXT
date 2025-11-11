import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const itens = await prisma.item.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Garantir que sempre retorne um array, mesmo se for null/undefined
    return itens || []
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    // Retornar array vazio em caso de erro
    return []
  }
})