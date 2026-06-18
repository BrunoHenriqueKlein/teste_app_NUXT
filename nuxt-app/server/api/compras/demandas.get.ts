import { defineEventHandler, createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const query = getQuery(event)

    try {
        const where: any = {
            categoria: 'COMPRADO'
        }

        if (query.status) {
            const statuses = (query.status as string).split(',')
            where.statusSuprimento = { in: statuses }
        }

        if (query.opId) {
            where.opId = parseInt(query.opId as string)
        }

        const demandas = await prisma.peca.findMany({
            where,
            include: {
                op: {
                    select: {
                        numeroOP: true,
                        cliente: true
                    }
                },
                fornecedor: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: {
                op: {
                    numeroOP: 'desc'
                }
            }
        })

        return demandas
    } catch (error: any) {
        console.error('❌ Erro ao buscar demandas de compra:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao buscar demandas de compra: ' + error.message
        })
    }
})
