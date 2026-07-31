import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const roteiros = await prisma.roteiro.findMany({
      include: {
        fornecedor: true,
        op: true,
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    })
    return roteiros
  } catch (error) {
    console.error('Erro ao buscar roteiros:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao buscar roteiros'
    })
  }
})
