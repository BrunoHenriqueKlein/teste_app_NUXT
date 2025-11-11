import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    // Verificar senha (em produção, use bcrypt!)
    if (user.password !== body.password) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    // Em produção, gere um JWT token aqui
    const token = 'fake-jwt-token-' + Date.now()

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao fazer login'
    })
  }
})