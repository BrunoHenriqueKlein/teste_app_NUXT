export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      },
      orderBy: { name: 'asc' }
    })
    
    return users
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})