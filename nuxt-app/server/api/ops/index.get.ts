import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { status, search, atrasada, dataInicio, dataFim } = query

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (atrasada === 'true') {
      where.dataEntrega = { lt: new Date() }
      where.status = { not: 'ENTREGUE' }
    }

    // Filtro por intervalo de data de entrega
    if (dataInicio || dataFim) {
      where.dataEntrega = where.dataEntrega || {}
      if (dataInicio) {
        where.dataEntrega.gte = new Date(String(dataInicio))
      }
      if (dataFim) {
        // Ajustar para o final do dia
        const end = new Date(String(dataFim))
        end.setHours(23, 59, 59, 999)
        where.dataEntrega.lte = end
      }
    }

    if (search) {
      where.OR = [
        { numeroOP: { contains: String(search), mode: 'insensitive' } },
        { cliente: { contains: String(search), mode: 'insensitive' } },
        { descricaoMaquina: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    const ops = await prisma.oP.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    })

    return ops
  } catch (error) {
    console.error('Erro ao carregar OPs:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})