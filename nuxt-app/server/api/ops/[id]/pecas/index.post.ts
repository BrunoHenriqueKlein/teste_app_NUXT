import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
        })
    }

    const prisma = event.context.prisma
    const body = await readBody(event)

    try {
        // Verificar se o código já existe no estoque para marcar temNoEstoque
        const estoqueItem = await prisma.estoque.findUnique({
            where: { codigo: body.codigo }
        })

        const peca = await prisma.peca.create({
            data: {
                opId: parseInt(opId),
                codigo: body.codigo,
                descricao: body.descricao,
                quantidade: body.quantidade || 1,
                material: body.material,
                status: estoqueItem ? 'EM_ESTOQUE' : 'NAO_INICIADA'
            }
        })

        return peca
    } catch (error: any) {
        console.error('❌ Erro ao inserir peça manualmente:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao inserir peça: ' + error.message
        })
    }
})
