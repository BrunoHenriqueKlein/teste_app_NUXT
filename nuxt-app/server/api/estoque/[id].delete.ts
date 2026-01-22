import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const prisma = event.context.prisma

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do item não informado'
        })
    }

    try {
        // Deletar item do estoque (Prisma cuidará das movimentações se houver cascade, 
        // mas aqui vamos apenas deletar o item principal conforme solicitado)
        await prisma.estoque.delete({
            where: { id: parseInt(id) }
        })

        return { success: true }
    } catch (error: any) {
        console.error('❌ Erro ao excluir item de estoque:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao excluir item de estoque: ' + error.message
        })
    }
})
