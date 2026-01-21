import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        try {
            const compras = await prisma.compra.findMany({
                include: {
                    op: {
                        select: { numeroOP: true, cliente: true }
                    },
                    _count: {
                        select: { itens: true }
                    }
                },
                orderBy: { dataSolicitacao: 'desc' }
            })
            return compras
        } catch (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao buscar compras'
            })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        try {
            // Criar um número de compra sequencial simples
            const count = await prisma.compra.count()
            const numero = `OC-${(count + 1).toString().padStart(4, '0')}`

            const compra = await prisma.compra.create({
                data: {
                    numero,
                    opId: body.opId,
                    fornecedor: body.fornecedor,
                    status: 'SOLICITADA',
                    itens: {
                        create: body.itens.map((item: any) => ({
                            descricao: item.descricao,
                            quantidade: item.quantidade,
                            pecaId: item.pecaId
                        }))
                    }
                }
            })
            return compra
        } catch (error: any) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao criar solicitação de compra: ' + error.message
            })
        }
    }
})
