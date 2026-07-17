export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const ops = await prisma.oP.findMany({
      take: 6,
      orderBy: { dataCriacao: 'desc' },
      include: {
        responsavel: {
          select: { name: true }
        }
      }
    })
    
    return ops
  } catch (error) {
    console.error('Erro ao carregar OPs recentes:', error)
    return []
  }
})