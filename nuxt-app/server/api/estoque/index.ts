import { defineEventHandler, createError, getQuery, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        try {
            const items = await prisma.estoque.findMany({
                orderBy: { codigo: 'asc' }
            })
            return items
        } catch (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao buscar itens de estoque'
            })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        console.log('📦 Salvando item de estoque:', body)

        try {
            const item = await prisma.estoque.upsert({
                where: { codigo: body.codigo },
                update: {
                    descricao: body.descricao,
                    quantidade: parseInt(body.quantidade) || 0,
                    minEstoque: parseInt(body.minEstoque) || 0,
                    unidade: body.unidade || 'UN',
                    categoria: body.categoria,
                    localizacao: body.localizacao
                },
                create: {
                    codigo: body.codigo,
                    descricao: body.descricao,
                    quantidade: parseInt(body.quantidade) || 0,
                    minEstoque: parseInt(body.minEstoque) || 0,
                    unidade: body.unidade || 'UN',
                    categoria: body.categoria,
                    localizacao: body.localizacao
                }
            })
            return item
        } catch (error: any) {
            console.error('❌ Erro detalhado ao salvar estoque:', error)
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao salvar item de estoque: ' + error.message
            })
        }
    }
})
