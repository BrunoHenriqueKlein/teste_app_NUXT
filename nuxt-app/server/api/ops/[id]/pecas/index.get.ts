import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        const pecas = await prisma.peca.findMany({
            where: { opId: parseInt(opId) },
            include: {
                processos: true,
                _count: {
                    select: { processos: true }
                }
            },
            orderBy: { codigo: 'asc' }
        })

        return pecas
    } catch (error) {
        console.error('❌ Erro ao buscar peças:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar peças da OP'
        })
    }
})
