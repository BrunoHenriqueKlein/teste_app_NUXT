import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { userId, permissions } = body // permissions: Array<{ moduleId, canView, canEdit, canDelete }>

    if (!userId || !Array.isArray(permissions)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dados inválidos'
        })
    }

    try {
        // Usar transação para garantir que todas as permissões sejam atualizadas
        const operations = permissions.map(p => {
            return prisma.userModule.upsert({
                where: {
                    userId_moduleId: {
                        userId,
                        moduleId: p.moduleId
                    }
                },
                update: {
                    canView: !!p.canView,
                    canEdit: !!p.canEdit,
                    canDelete: !!p.canDelete
                },
                create: {
                    userId,
                    moduleId: p.moduleId,
                    canView: !!p.canView,
                    canEdit: !!p.canEdit,
                    canDelete: !!p.canDelete
                }
            })
        })

        await prisma.$transaction(operations)

        return {
            success: true,
            message: 'Permissões atualizadas com sucesso'
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao atualizar permissões: ${error.message}`
        })
    }
})
