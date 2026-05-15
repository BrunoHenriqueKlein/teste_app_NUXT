import { defineEventHandler, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const id = Number(event.context.params?.id)

    if (!id || isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID de usuário inválido'
        })
    }

    try {
        // Primeiro deletamos os módulos do usuário (dependência)
        await prisma.userModule.deleteMany({
            where: { userId: id }
        })

        // Deletamos configurações de processos se existirem
        await prisma.configProcessoPadrao.deleteMany({
            where: { responsavelId: id }
        })

        // Tenta deletar o usuário
        await prisma.user.delete({
            where: { id }
        })

        return {
            success: true,
            message: 'Usuário excluído com sucesso.'
        }
    } catch (error: any) {
        // Se houver erro de foreign key constraint, significa que o usuário
        // já tem histórico, OPs ou peças associadas e não pode ser apagado
        if (error.code === 'P2003') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Este usuário não pode ser excluído pois já possui vínculos com operações (OPs, Históricos, etc). Tente apenas inativá-lo.'
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao excluir usuário: ${error.message}`
        })
    }
})
