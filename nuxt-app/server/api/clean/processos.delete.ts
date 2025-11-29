import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const result = await prisma.oPProcesso.deleteMany({})
    return {
      success: true,
      message: `Foram excluídos ${result.count} processos`
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao limpar processos'
    })
  }
})