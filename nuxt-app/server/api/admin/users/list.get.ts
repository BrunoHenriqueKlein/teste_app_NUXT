import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    // Verificação de Admin (simplificada)
    // TODO: Injetar usuário do middleware e verificar isAdmin
    // Por enquanto, vamos retornar a lista completa

    try {
        const users = await prisma.user.findMany({
            include: {
                userModules: {
                    include: {
                        module: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        return users
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao listar usuários: ${error.message}`
        })
    }
})
