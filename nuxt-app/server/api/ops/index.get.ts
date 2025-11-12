import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    const where: any = {}
    
    // Filtro por status
    if (query.status) {
      where.status = query.status
    }
    
    // Filtro por busca
    if (query.search) {
      where.OR = [
        { numeroOP: { contains: query.search, mode: 'insensitive' } },
        { codigoMaquina: { contains: query.search, mode: 'insensitive' } },
        { descricaoMaquina: { contains: query.search, mode: 'insensitive' } },
        { cliente: { contains: query.search, mode: 'insensitive' } }
      ]
    }
    
    const ops = await prisma.oP.findMany({
      where,
      include: {
        criadoPor: {
          select: { name: true }
        },
        responsavel: {
          select: { name: true }
        }
      },
      orderBy: { dataCriacao: 'desc' }
    })
    
    return ops
  } catch (error) {
    console.error('Erro ao carregar OPs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno do servidor'
    })
  }
})