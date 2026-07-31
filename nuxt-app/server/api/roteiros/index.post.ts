import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validar tipo do roteiro (ZINCO, PINTURA, OUTROS)
    if (!body.tipo || !body.numero) {
      throw createError({
        statusCode: 400,
        message: 'Tipo e número do roteiro são obrigatórios.'
      })
    }

    const roteiro = await prisma.roteiro.create({
      data: {
        numero: body.numero,
        tipo: body.tipo,
        fornecedorId: body.fornecedorId || null,
        opId: body.opId || null,
        observacoes: body.observacoes || null
      }
    })

    return roteiro
  } catch (error: any) {
    console.error('Erro ao criar roteiro:', error)
    if (error.code === 'P2002') {
        throw createError({
            statusCode: 400,
            message: 'Já existe um roteiro com este número.'
        })
    }
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao criar roteiro'
    })
  }
})
