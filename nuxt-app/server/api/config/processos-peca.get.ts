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

    const prisma = event.context.prisma

    try {
        const processos = await prisma.configProcessoPeca.findMany({
            orderBy: {
                nome: 'asc'
            }
        })

        return processos
    } catch (error) {
        console.error('Erro ao buscar processos de peças:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar processos de peças'
        })
    }
})
