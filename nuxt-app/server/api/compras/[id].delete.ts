import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da requisição não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        const compra = await prisma.compra.findUnique({
            where: { id: Number(id) }
        })

        if (!compra) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Requisição não encontrada'
            })
        }

        // Deletar os itens vinculados primeiro
        await prisma.compraItem.deleteMany({
            where: { compraId: Number(id) }
        })

        // Deletar a compra
        await prisma.compra.delete({
            where: { id: Number(id) }
        })

        try {
            const { logAction } = await import('../../utils/logger')
            await logAction(
                'Exclusão de Requisição',
                `Requisição ${compra.numero} excluída permanentemente do sistema.`,
                event.context.user?.id
            )
        } catch (e) {
            console.error('Erro ao registrar log:', e)
        }

        return { success: true, message: 'Requisição excluída com sucesso.' }
    } catch (error: any) {
        console.error('❌ Erro ao excluir requisição:', error)
        if (error.code === 'P2003') {
            throw createError({
                statusCode: 400,
                statusMessage: 'Não é possível excluir a requisição pois existem registros vinculados a ela.'
            })
        }
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao excluir a requisição'
        })
    }
})
