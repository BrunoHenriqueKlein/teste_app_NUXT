import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // Em uma aplicação real, você validaria o token JWT aqui
    const userData = await readBody(event).catch(() => null)

    const prisma = event.context.prisma
    const modules = await prisma.module.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return modules
  } catch (error) {
    console.error('Erro ao carregar módulos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})