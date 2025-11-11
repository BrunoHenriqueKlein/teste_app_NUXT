import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    const item = await prisma.item.create({
      data: {
        valor: body.valor
      }
    })
    
    return { success: true, item }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao salvar no banco de dados'
    })
  }
})