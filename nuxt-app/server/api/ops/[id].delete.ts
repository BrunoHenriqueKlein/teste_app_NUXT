import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
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
    
    // Criar histórico
    await prisma.oPHistorico.create({
      data: {
        opId: parseInt(id),
        usuarioId: 1, // Em produção, pegar do usuário logado
        acao: 'OP excluída',
        detalhes: `Ordem de produção ${existingOP.numeroOP} excluída`
      }
    })
    
    return { success: true, message: 'OP excluída com sucesso' }
  } catch (error: any) {
    console.error('Erro ao excluir OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro ao excluir ordem de produção'
    })
  }
})