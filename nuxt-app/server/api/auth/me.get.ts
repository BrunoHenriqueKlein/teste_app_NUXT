import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const userContext = event.context.user

    if (!userContext || !userContext.id) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userContext.id },
            include: {
                userModules: {
                    include: {
                        module: true
                    }
                }
            }
        })

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Usuário não encontrado'
            })
        }

        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                userModules: user.userModules
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao obter perfil: ${error.message}`
        })
    }
})
