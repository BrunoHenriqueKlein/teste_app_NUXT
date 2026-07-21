import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const pecaId = getRouterParam(event, 'id')
    
    if (!pecaId) {
      throw createError({
        statusCode: 400,
        message: 'ID da Peça não informado'
      })
    }

    const processos = await prisma.processoPeca.findMany({
      where: {
        pecaId: parseInt(pecaId)
      },
      include: {
        fornecedorRef: {
          select: { id: true, nome: true }
        },
        ordemServico: {
          select: { id: true, numero: true }
        }
      },
      orderBy: {
        sequencia: 'asc'
      }
    })

    return processos
    
  } catch (error) {
    console.error('API: Erro ao carregar processos da peça:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})
