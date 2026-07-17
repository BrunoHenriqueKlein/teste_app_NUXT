import { defineEventHandler, createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const query = getQuery(event)

    try {
        const where: any = {
            categoria: 'COMERCIAL',
            statusSuprimento: { not: 'NAO_SOLICITADO' }
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
                },
                compras: {
                    include: { compra: true },
                    orderBy: { id: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                op: {
                    numeroOP: 'desc'
                }
            }
        })
        return demandas.map(d => ({
            ...d,
            numeroCompra: d.compras?.[0]?.compra?.numero || '-'
        }))
    } catch (error: any) {
        console.error('❌ Erro ao buscar demandas de compra:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao buscar demandas de compra: ' + error.message
        })
    }
})
