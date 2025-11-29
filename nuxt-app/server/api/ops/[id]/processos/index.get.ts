import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    
    console.log('🔍 API: Buscando processos para OP:', opId)
    
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP não informado'
      })
    }

    // Buscar processos da OP
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

    console.log('✅ API: Processos encontrados:', processos.length)
    return processos
    
  } catch (error) {
    console.error('❌ API: Erro ao carregar processos:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})