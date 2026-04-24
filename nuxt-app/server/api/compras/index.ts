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
                    anexos: true,
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
            // Se já vier com número (ex: de uma REQ), mantém. Se não, gera um REQ temporário.
            const numero = body.numero || `REQ-${(count + 1).toString().padStart(4, '0')}`

            const compra = await prisma.compra.create({
                data: {
                    numero,
                    opId: body.opId,
                    osId: body.osId,
                    fornecedor: body.fornecedor,
                    status: body.status || 'SOLICITADA',
                    valorTotal: body.valorTotal || 0,
                    valorFrete: body.valorFrete || 0,
                    valorDesconto: body.valorDesconto || 0,
                    observacoes: body.observacoes,
                    dataCompra: body.dataCompra ? new Date(body.dataCompra) : null,
                    dataPrevisaoEntrega: body.dataPrevisaoEntrega ? new Date(body.dataPrevisaoEntrega) : null,
                    itens: {
                        create: body.itens.map((item: any) => ({
                            descricao: item.descricao,
                            quantidade: item.quantidade,
                            pecaId: item.pecaId,
                            valorUnitario: item.valorUnitario || 0,
                            aliqIPI: item.aliqIPI || 0,
                            aliqICMS: item.aliqICMS || 0,
                            valorIPI: item.valorIPI || 0,
                            valorICMS: item.valorICMS || 0,
                            custoLiquido: item.custoLiquido || 0
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
            const currentCompra = await prisma.compra.findUnique({ where: { id: Number(id) } })
            let finalNumero = currentCompra?.numero

            // Se o status mudar para PEDIDO_EMITIDO e ainda for uma REQ, gera o número da OC
            if (data.status === 'PEDIDO_EMITIDO' && (finalNumero?.startsWith('REQ') || !finalNumero)) {
                // Busca a última OC para seguir a sequência
                const lastOC = await prisma.compra.findFirst({
                    where: { numero: { startsWith: 'OC-' } },
                    orderBy: { numero: 'desc' }
                })

                let nextNum = 1
                if (lastOC) {
                    const parts = lastOC.numero.split('-')
                    const lastNum = parseInt(parts[parts.length - 1])
                    if (!isNaN(lastNum)) nextNum = lastNum + 1
                }

                const year = new Date().getFullYear()
                finalNumero = `OC-${year}-${nextNum.toString().padStart(4, '0')}`
            }

            if (data.itens && Array.isArray(data.itens)) {
                for (const item of data.itens) {
                    if (item.id) {
                        await prisma.compraItem.update({
                            where: { id: Number(item.id) },
                            data: {
                                valorUnitario: Number(item.valorUnitario) || 0,
                                aliqIPI: Number(item.aliqIPI) || 0,
                                aliqICMS: Number(item.aliqICMS) || 0,
                                valorIPI: Number(item.valorIPI) || 0,
                                valorICMS: Number(item.valorICMS) || 0,
                                custoLiquido: Number(item.custoLiquido) || 0
                            }
                        })
                    }
                }
            }

            const updatedCompra = await prisma.compra.update({
                where: { id: Number(id) },
                data: {
                    numero: finalNumero,
                    status: data.status,
                    valorTotal: data.valorTotal,
                    valorFrete: data.valorFrete,
                    valorDesconto: data.valorDesconto,
                    observacoes: data.observacoes,
                    dataCompra: data.status === 'PEDIDO_EMITIDO' && !currentCompra?.dataCompra ? new Date() : (data.dataCompra ? new Date(data.dataCompra) : undefined),
                    dataPrevisaoEntrega: data.dataPrevisaoEntrega ? new Date(data.dataPrevisaoEntrega) : undefined,
                    dataEntregaReal: data.dataEntregaReal ? new Date(data.dataEntregaReal) : undefined,
                    numeroNF: data.numeroNF,
                },
                include: { itens: true }
            })

            // Atualização de status em massa para as peças e OS vinculada
            if (data.status === 'PEDIDO_EMITIDO' || data.status === 'APROVADA') {
                if (updatedCompra.osId) {
                    await prisma.ordemServico.update({
                        where: { id: updatedCompra.osId },
                        data: { status: 'EM_ANDAMENTO' }
                    })

                    // Tratar Ordem de Serviço (Retroalimentação do PCP)
                    for (const item of updatedCompra.itens) {
                        if (item.pecaId) {
                            const processo = await prisma.processoPeca.findFirst({
                                where: { osId: updatedCompra.osId, pecaId: item.pecaId }
                            })
                            if (processo && item.valorUnitario > 0) {
                                await prisma.processoPeca.update({
                                    where: { id: processo.id },
                                    data: { valorCusto: item.valorUnitario }
                                })
                                
                                // Recalcula Peca (BOM)
                                const pecaAtual = await prisma.peca.findUnique({
                                    where: { id: item.pecaId },
                                    include: { processos: true }
                                })
                                if (pecaAtual) {
                                    const custoTotalProc = pecaAtual.processos.reduce((sum, p) => sum + (p.valorCusto || 0), 0)
                                    await prisma.peca.update({
                                        where: { id: pecaAtual.id },
                                        data: {
                                            valorUnitario: custoTotalProc,
                                            custoTotal: custoTotalProc * pecaAtual.quantidade,
                                            statusSuprimento: 'COMPRADO'
                                        }
                                    })
                                }
                            } else {
                                // Peca está em OS mas sem vínculo claro com Processo, só atualiza status
                                await prisma.peca.update({
                                    where: { id: item.pecaId },
                                    data: { statusSuprimento: 'COMPRADO' }
                                })
                            }
                        }
                    }
                } else {
                    // Sem O.S (Trata-se de Componente/Matéria-Prima comprada individualmente)
                    for (const item of updatedCompra.itens) {
                        if (item.pecaId) {
                            const pecaAtual = await prisma.peca.findUnique({
                                where: { id: item.pecaId }
                            })
                            if (pecaAtual) {
                                await prisma.peca.update({
                                    where: { id: item.pecaId },
                                    data: { 
                                        statusSuprimento: 'COMPRADO',
                                        valorUnitario: item.valorUnitario,
                                        custoTotal: item.valorUnitario * pecaAtual.quantidade
                                    }
                                })
                            }
                        }
                    }
                }
            }

            // Se foi recebido -> RECEBIDO
            if (data.status === 'RECEBIDA_TOTAL' || data.dataEntregaReal) {
                // Se houver OS vinculada, marcar como CONCLUIDA (ou aguardando proximo passo)
                if (updatedCompra.osId) {
                    await prisma.ordemServico.update({
                        where: { id: updatedCompra.osId },
                        data: { status: 'CONCLUIDA' }
                    })
                }

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
