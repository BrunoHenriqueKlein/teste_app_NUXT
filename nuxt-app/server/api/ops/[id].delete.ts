import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    const user = event.context.user
    if (!user || (user as any).role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Apenas administradores podem excluir Ordens de Produção'
      })
    }

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da OP não informado'
      })
    }

    // Verificar se OP existe
    const existingOP = await prisma.oP.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingOP) {
      throw createError({
        statusCode: 404,
        statusMessage: 'OP não encontrada'
      })
    }

    // Deletar OP (em produção, considerar soft delete)
    await prisma.oP.delete({
      where: { id: parseInt(id) }
    })

    // Histórico de exclusão não pode ser criado pois a OP deixa de existir
    // e o delete cascade limparia o registro de qualquer forma.

    return { success: true, message: 'OP excluída com sucesso' }
  } catch (error: any) {
    console.error('Erro ao excluir OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro ao excluir ordem de produção'
    })
  }
})