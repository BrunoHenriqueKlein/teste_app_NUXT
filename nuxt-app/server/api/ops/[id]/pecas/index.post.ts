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
        // 1. Verificar se a peça já existe nesta OP (Evitar erro de unique constraint)
        const existePeca = await prisma.peca.findUnique({
            where: {
                opId_codigo: {
                    opId: parseInt(opId),
                    codigo: body.codigo
                }
            }
        })

        if (existePeca) {
            throw createError({
                statusCode: 409,
                message: `Já existe uma peça cadastrada com o código "${body.codigo}" nesta lista (BOM).`
            })
        }

        // 2. Verificar se o código já existe no estoque para marcar temNoEstoque
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
                categoria: body.categoria || 'FABRICADO',
                statusSuprimento: body.statusSuprimento || 'NAO_SOLICITADO',
                valorUnitario: body.valorUnitario ? parseFloat(body.valorUnitario) : null,
                fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : null,
                status: estoqueItem ? 'EM_ESTOQUE' : 'NAO_INICIADA'
            }
        })

        return peca
    } catch (error: any) {
        // Se já for um erro do H3 (como o 409 acima), apenas repassa
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao inserir peça manualmente:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao inserir peça: ' + error.message
        })
    }
})
