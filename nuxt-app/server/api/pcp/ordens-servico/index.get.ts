import { defineEventHandler, createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const query = getQuery(event)

    try {
        const where: any = {}

        if (query.opId) {
            const parsedOpId = parseInt(query.opId as string)
            if (isNaN(parsedOpId)) {
                throw createError({
                    statusCode: 400,
                    message: `ID da OP inválido: ${query.opId}`
                })
            }
            where.opId = parsedOpId
        }

        if (query.tipo) where.tipo = query.tipo as string
        if (query.status) where.status = query.status as string

        console.log('🔍 Buscando ordens de serviço com filtro:', where)
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
    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao buscar ordens de serviço:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao buscar ordens de serviço: ' + error.message
        })
    }
})
