import { defineEventHandler, createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const query = getQuery(event)

    try {
        const where: any = {}

        if (query.opId) where.opId = parseInt(query.opId as string)
        if (query.tipo) where.tipo = query.tipo as string
        if (query.status) where.status = query.status as string

        const ordensServico = await prisma.ordemServico.findMany({
            where,
            include: {
                op: {
                    select: {
                        numeroOP: true,
                        cliente: true,
                        descricaoMaquina: true
                    }
                },
                _count: {
                    select: { itens: true }
                }
            },
            orderBy: { dataEmissao: 'desc' }
        })

        return ordensServico
    } catch (error) {
        console.error('❌ Erro ao buscar ordens de serviço:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar ordens de serviço'
        })
    }
})
