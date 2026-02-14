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
                    itens: {
                        include: {
                            peca: {
                                include: {
                                    anexos: true
                                }
                            }
                        }
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
            const count = await prisma.compra.count()
            const numero = `OC-${(count + 1).toString().padStart(4, '0')}`

            const compra = await prisma.compra.create({
                data: {
                    numero,
                    opId: body.opId,
                    fornecedor: body.fornecedor,
                    status: body.status || 'SOLICITADA',
                    valorTotal: body.valorTotal,
                    dataCompra: body.dataCompra ? new Date(body.dataCompra) : null,
                    dataPrevisaoEntrega: body.dataPrevisaoEntrega ? new Date(body.dataPrevisaoEntrega) : null,
                    numeroNF: body.numeroNF,
                    itens: {
                        create: body.itens.map((item: any) => ({
                            descricao: item.descricao,
                            quantidade: item.quantidade,
                            pecaId: item.pecaId,
                            valorUnitario: item.valorUnitario || 0,
                            valorIPI: item.valorIPI || 0,
                            valorICMS: item.valorICMS || 0,
                            custoLiquido: item.custoLiquido || item.valorUnitario || 0
                        }))
                    }
                },
                include: { itens: true }
            })

            // Se a compra for "EMITIDA" ou "APROVADA", atualizar status das peças vinculadas
            if (body.status === 'PEDIDO_EMITIDO' || body.status === 'APROVADA') {
                for (const item of body.itens) {
                    if (item.pecaId) {
                        await prisma.peca.update({
                            where: { id: item.pecaId },
                            data: {
                                statusSuprimento: 'COMPRADO',
                                valorUnitario: item.valorUnitario
                            }
                        })
                    }
                }
            }

            return compra
        } catch (error: any) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao criar solicitação de compra: ' + error.message
            })
        }
    }

    if (method === 'PUT') {
        const body = await readBody(event)
        const { id, ...data } = body

        try {
            const updatedCompra = await prisma.compra.update({
                where: { id: Number(id) },
                data: {
                    numero: data.numero,
                    status: data.status,
                    valorTotal: data.valorTotal,
                    dataCompra: data.dataCompra ? new Date(data.dataCompra) : undefined,
                    dataPrevisaoEntrega: data.dataPrevisaoEntrega ? new Date(data.dataPrevisaoEntrega) : undefined,
                    dataEntregaReal: data.dataEntregaReal ? new Date(data.dataEntregaReal) : undefined,
                    numeroNF: data.numeroNF,
                },
                include: { itens: true }
            })

            // Atualização de status em massa para as peças
            // Se foi emitido pedido -> COMPRADO
            if (data.status === 'PEDIDO_EMITIDO' || data.status === 'APROVADA') {
                for (const item of updatedCompra.itens) {
                    if (item.pecaId) {
                        await prisma.peca.update({
                            where: { id: item.pecaId },
                            data: { statusSuprimento: 'COMPRADO' }
                        })
                    }
                }
            }

            // Se foi recebido -> RECEBIDO
            if (data.status === 'RECEBIDA_TOTAL' || data.dataEntregaReal) {
                for (const item of updatedCompra.itens) {
                    if (item.pecaId) {
                        await prisma.peca.update({
                            where: { id: item.pecaId },
                            data: { statusSuprimento: 'RECEBIDO' }
                        })
                    }
                }
            }

            return updatedCompra
        } catch (error: any) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao atualizar compra: ' + error.message
            })
        }
    }
})
