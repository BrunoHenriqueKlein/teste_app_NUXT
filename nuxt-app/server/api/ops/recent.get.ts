import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const ops = await prisma.oP.findMany({
      take: 6,
      orderBy: { dataCriacao: 'desc' },
      include: {
        responsavel: {
          select: { name: true }
        }
      }
    })
    
    return ops
  } catch (error) {
    console.error('Erro ao carregar OPs recentes:', error)
    return []
  }
})