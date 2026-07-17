export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const result = await prisma.oPProcesso.deleteMany({})
    return {
      success: true,
      message: `Foram excluídos ${result.count} processos`
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao limpar processos'
    })
  }
})