import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário já existe'
      })
    }

    // Criar usuário (em produção, hash a senha com bcrypt!)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password // Em produção: await bcrypt.hash(body.password, 10)
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar usuário'
    })
  }
})