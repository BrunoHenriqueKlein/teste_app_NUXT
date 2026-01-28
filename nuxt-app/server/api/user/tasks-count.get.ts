import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const prisma = event.context.prisma

    try {
        const count = await prisma.oPProcesso.count({
            where: {
                responsavelId: user.id,
                status: {
                    notIn: ['CONCLUIDO', 'CANCELADO']
                }
            }
        })

        return { count }
    } catch (error) {
        console.error('Erro ao contar tarefas do usuário:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao contar tarefas'
        })
    }
})
