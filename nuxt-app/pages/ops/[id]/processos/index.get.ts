import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    
    if (!opId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da OP não informado'
      })
    }

    const processos = await prisma.oPProcesso.findMany({
      where: {
        opId: parseInt(opId)
      },
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        sequencia: 'asc'
      }
    })

    return processos
  } catch (error) {
    console.error('Erro ao carregar processos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})