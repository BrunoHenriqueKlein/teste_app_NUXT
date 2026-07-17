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
                    material: body.material || '',
                    quantidade: parseInt(body.quantidade) || 0,
                    minEstoque: parseInt(body.minEstoque) || 0,
                    unidade: body.unidade || 'UN',
                    categoria: body.categoria,
                    subcategoria: body.subcategoria,
                    localizacao: body.localizacao,
                    valorUnitario: parseFloat(body.valorUnitario) || 0,
                    impostoIPI: parseFloat(body.impostoIPI) || 0,
                    valorTotal: (parseFloat(body.valorUnitario) || 0) * (parseInt(body.quantidade) || 0) * (1 + (parseFloat(body.impostoIPI) || 0) / 100)
                },
                create: {
                    codigo: body.codigo,
                    descricao: body.descricao,
                    material: body.material || '',
                    quantidade: parseInt(body.quantidade) || 0,
                    minEstoque: parseInt(body.minEstoque) || 0,
                    unidade: body.unidade || 'UN',
                    categoria: body.categoria,
                    subcategoria: body.subcategoria,
                    localizacao: body.localizacao,
                    valorUnitario: parseFloat(body.valorUnitario) || 0,
                    impostoIPI: parseFloat(body.impostoIPI) || 0,
                    valorTotal: (parseFloat(body.valorUnitario) || 0) * (parseInt(body.quantidade) || 0) * (1 + (parseFloat(body.impostoIPI) || 0) / 100)
                }
            })
            try {
                const { logAction } = await import('../../utils/logger')
                await logAction(
                    'Atualização de Estoque',
                    `Item ${item.codigo} (${item.descricao}) salvo/atualizado no estoque. Nova Quantidade: ${item.quantidade} ${item.unidade}.`,
                    event.context.user?.id
                )
            } catch (e) {
                console.error('Erro ao registrar log de estoque:', e)
            }

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
