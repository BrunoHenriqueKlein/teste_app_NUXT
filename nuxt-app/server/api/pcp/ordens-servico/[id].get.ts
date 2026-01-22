import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const osId = getRouterParam(event, 'id')
    if (!osId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OS não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        const os = await prisma.ordemServico.findUnique({
            where: { id: parseInt(osId) },
            include: {
                op: true,
                itens: {
                    include: {
                        peca: true,
                        fornecedorRef: true
                    },
                    orderBy: { sequencia: 'asc' }
                }
            }
        })

        if (!os) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Ordem de Serviço não encontrada'
            })
        }

        return os
    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao buscar detalhes da OS:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao buscar detalhes da OS: ' + error.message
        })
    }
})
