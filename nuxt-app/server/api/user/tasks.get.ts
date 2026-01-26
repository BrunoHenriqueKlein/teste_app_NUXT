import { defineEventHandler, createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const prisma = event.context.prisma
    const query = getQuery(event)
    const isGlobal = query.global === 'true' && user.role === 'ADMIN'

    try {
        const where: any = {
            status: {
                not: 'CANCELADO'
            }
        }

        if (!isGlobal) {
            where.responsavelId = user.id
        }

        const tasks = await prisma.oPProcesso.findMany({
            where,
            include: {
                op: {
                    select: {
                        id: true,
                        numeroOP: true,
                        cliente: true,
                        codigoMaquina: true,
                        descricaoMaquina: true
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
            orderBy: [
                { status: 'asc' },
                { dataTerminoPrevista: 'asc' }
            ]
        })

        return tasks
    } catch (error) {
        console.error('Erro ao buscar tarefas do usuário:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar tarefas'
        })
    }
})
