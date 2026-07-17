import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma

    try {
        const rascunhos = await prisma.compra.findMany({
            where: {
                isEstoque: true,
                status: { in: ['RASCUNHO', 'COTACAO'] }
            },
            include: {
                itens: {
                    include: {
                        estoque: true
                    }
                },
                fornecedorRef: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: {
                dataSolicitacao: 'desc'
            }
        })

        const itensFlatted = []
        for (const rascunho of rascunhos) {
            for (const item of rascunho.itens) {
                itensFlatted.push({
                    id: item.id,
                    compraId: rascunho.id,
                    numeroCompra: rascunho.numero,
                    codigo: item.estoque?.codigo || '-',
                    descricao: item.descricao,
                    material: item.estoque?.material || '-',
                    quantidade: item.quantidade,
                    categoria: item.estoque?.categoria || '-',
                    subcategoria: item.estoque?.subcategoria || '-',
                    status: rascunho.status === 'RASCUNHO' ? 'NÃO COTADO' : 'EM COTAÇÃO',
                    statusCor: rascunho.status === 'RASCUNHO' ? 'grey' : 'warning'
                })
            }
        }

        return itensFlatted
    } catch (error: any) {
        console.error('❌ Erro ao buscar rascunhos de estoque:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao buscar rascunhos de estoque: ' + error.message
        })
    }
})
