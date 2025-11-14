import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId')
    
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs não informados'
      })
    }

    // Verificar se processo existe
    const existingProcesso = await prisma.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    })

    if (!existingProcesso) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Processo não encontrado'
      })
    }

    // Deletar histórico primeiro
    await prisma.processoHistorico.deleteMany({
      where: {
        processoId: parseInt(processoId)
      }
    })

    // Deletar processo
    await prisma.oPProcesso.delete({
      where: {
        id: parseInt(processoId)
      }
    })

    return { success: true, message: 'Processo excluído com sucesso' }
  } catch (error: any) {
    console.error('Erro ao excluir processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro ao excluir processo'
    })
  }
})