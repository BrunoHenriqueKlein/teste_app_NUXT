import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'ID do roteiro inválido'
    })
  }

  try {
    const roteiro = await prisma.roteiro.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        op: true,
        itens: {
          include: {
            peca: {
              include: {
                anexos: true,
                op: true
              }
            }
          }
        }
      }
    })

    if (!roteiro) {
      throw createError({
        statusCode: 404,
        message: 'Roteiro não encontrado'
      })
    }

    return roteiro
  } catch (error) {
    console.error('Erro ao buscar detalhes do roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao buscar roteiro'
    })
  }
})
