import { defineEventHandler, createError, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    const swSecret = getHeader(event, 'X-SW-Secret')

    // Permitir se for usuário logado OU se for a macro com o segredo correto
    if (!user && swSecret !== 'someh-sw-integration-2024') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const { numeroOP } = event.context.params as { numeroOP: string }
    const prisma = event.context.prisma

    if (!numeroOP) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Número da OP não informado.'
        })
    }

    try {
        const op = await prisma.oP.findUnique({
            where: { numeroOP: numeroOP },
            select: { id: true, numeroOP: true, status: true }
        })

        if (!op) {
            throw createError({
                statusCode: 404,
                statusMessage: `Ordem de Produção ${numeroOP} não encontrada.`
            })
        }

        return {
            valid: true,
            op: op
        }
    } catch (error) {
        console.error('Erro ao validar OP:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao validar OP.'
        })
    }
})
