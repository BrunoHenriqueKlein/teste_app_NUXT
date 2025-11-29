import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId')
    
    console.log('🗑️ DEBUG - Excluindo processo:', { opId, processoId })
    
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP ou ID do processo não informado'
      })
    }

    // Verificar se o processo existe e pertence à OP
    const processoExistente = await prisma.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      },
      include: {
        historico: true
      }
    })

    if (!processoExistente) {
      throw createError({
        statusCode: 404,
        message: 'Processo não encontrado nesta OP'
      })
    }

    // Excluir histórico do processo primeiro (se houver)
    if (processoExistente.historico.length > 0) {
      await prisma.processoHistorico.deleteMany({
        where: {
          processoId: parseInt(processoId)
        }
      })
    }

    // Excluir processo
    await prisma.oPProcesso.delete({
      where: {
        id: parseInt(processoId)
      }
    })

    console.log('✅ Processo excluído com sucesso')
    return { success: true, message: 'Processo excluído com sucesso' }
  } catch (error: any) {
    console.error('Erro ao excluir processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao excluir processo'
    })
  }
})