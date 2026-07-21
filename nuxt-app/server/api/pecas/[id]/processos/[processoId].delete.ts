import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  const pecaId = getRouterParam(event, 'id')
  const processoId = getRouterParam(event, 'processoId')
  
  if (!pecaId || !processoId) {
    throw createError({ statusCode: 400, message: 'Parâmetros incompletos' })
  }

  try {
    await prisma.processoPeca.delete({
      where: { id: parseInt(processoId) }
    })
    
    // Reordenar os restantes
    const processos = await prisma.processoPeca.findMany({
      where: { pecaId: parseInt(pecaId) },
      orderBy: { sequencia: 'asc' }
    })
    
    for (let i = 0; i < processos.length; i++) {
      await prisma.processoPeca.update({
        where: { id: processos[i].id },
        data: { sequencia: i + 1 }
      })
    }

    return { success: true, message: 'Processo excluído com sucesso' }
  } catch (error) {
    console.error('API: Erro ao excluir processo da peça:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro ao excluir processo'
    })
  }
})
