import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP não informado'
      })
    }

    const op = await prisma.oP.findUnique({
      where: {
        id: parseInt(opId)
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!op) {
      throw createError({
        statusCode: 404,
        message: 'OP não encontrada'
      })
    }

    return op
  } catch (error) {
    console.error('Erro ao carregar OP:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})