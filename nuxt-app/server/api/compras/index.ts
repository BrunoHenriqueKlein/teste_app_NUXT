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
                    fornecedorId: Number(body.fornecedorId) || null,
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

            // Se a compra for "EMITIDA" ou "APROVADA", atualizar status das peças e OS vinculadas
            if (body.status === 'PEDIDO_EMITIDO' || body.status === 'APROVADA') {
                const fornecedorId = Number(body.fornecedorId) || null

                if (compra.osId) {
                    await prisma.ordemServico.update({
                        where: { id: compra.osId },
                        data: { status: 'EM_ANDAMENTO', fornecedorId }
                    })
                    await prisma.processoPeca.updateMany({
                        where: { osId: compra.osId },
                        data: { status: 'EM_ANDAMENTO', fornecedorId }
                    })
                }

                for (const item of body.itens) {
                    if (item.pecaId) {
                        await prisma.peca.update({
                            where: { id: item.pecaId },
                            data: {
                                statusSuprimento: 'COMPRADO',
                                status: 'AGUARDANDO_RECEBIMENTO',
                                valorUnitario: item.valorUnitario,
                                fornecedorId
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
        const { id, split, ...data } = body

        try {
            const currentCompra = await prisma.compra.findUnique({
                where: { id: Number(id) },
                include: { itens: true }
            })

            if (split && data.splitItemIds && Array.isArray(data.splitItemIds)) {
                // --- LÓGICA DE SPLIT (Dividir Pedido) ---

                // 1. Gerar novo número de OC
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
                const newOCNumero = `OC-${year}-${nextNum.toString().padStart(4, '0')}`

                // 2. Criar a nova compra (OC)
                const newOC = await prisma.compra.create({
                    data: {
                        numero: newOCNumero,
                        fornecedor: data.fornecedor || 'Desconhecido',
                        fornecedorId: Number(data.fornecedorId) || null,
                        opId: currentCompra!.opId,
                        osId: currentCompra!.osId,
                        status: 'PEDIDO_EMITIDO',
                        dataCompra: new Date(),
                        dataPrevisaoEntrega: data.dataPrevisaoEntrega ? new Date(data.dataPrevisaoEntrega) : null,
                        observacoes: `Desmembrado da REQ ${currentCompra!.numero}. ${data.observacoes || ''}`
                    }
                })

                // 3. Transferir os itens selecionados para a nova OC
                for (const itemId of data.splitItemIds) {
                    const item = await prisma.compraItem.update({
                        where: { id: Number(itemId) },
                        data: { compraId: newOC.id },
                        include: { peca: true }
                    })

                    // Sincroniza Status da Peça e Processo para cada item transferido
                    if (item.pecaId) {
                        await prisma.peca.update({
                            where: { id: item.pecaId },
                            data: {
                                statusSuprimento: 'COMPRADO',
                                status: 'AGUARDANDO_RECEBIMENTO',
                                fornecedorId: newOC.fornecedorId
                            }
                        })

                        if (newOC.osId) {
                            await prisma.processoPeca.updateMany({
                                where: { osId: newOC.osId, pecaId: item.pecaId },
                                data: {
                                    status: 'EM_ANDAMENTO',
                                    fornecedorId: newOC.fornecedorId,
                                    valorCusto: item.valorUnitario
                                }
                            })
                        }
                    }
                }

                // Se houver OS, garantir que ela esteja "EM_ANDAMENTO"
                if (newOC.osId) {
                    await prisma.ordemServico.update({
                        where: { id: newOC.osId },
                        data: { status: 'EM_ANDAMENTO' }
                    })
                }

                // 4. Se a REQ original ficou sem itens, podemos marcá-la como concluída ou deletar
                const remainingItens = await prisma.compraItem.count({
                    where: { compraId: Number(id) }
                })

                if (remainingItens === 0) {
                    await prisma.compra.update({
                        where: { id: Number(id) },
                        data: { status: 'PEDIDO_EMITIDO' } // Marca como emitida pois todos os itens saíram
                    })
                }

                return { success: true, newOCId: newOC.id, message: 'Fatiamento de pedido realizado com sucesso!' }
            }

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

            // 1. Sincronização ao Emitir Pedido (PEDIDO_EMITIDO ou APROVADA)
            if (data.status === 'PEDIDO_EMITIDO' || data.status === 'APROVADA') {
                const fornecedorId = Number(data.fornecedorId) || updatedCompra.fornecedorId

                // Se houver OS vinculada, sincroniza OS e seus Processos
                if (updatedCompra.osId) {
                    await prisma.ordemServico.update({
                        where: { id: updatedCompra.osId },
                        data: {
                            status: 'EM_ANDAMENTO',
                            fornecedorId: fornecedorId
                        }
                    })

                    // Atualizar Processos da OS
                    await prisma.processoPeca.updateMany({
                        where: { osId: updatedCompra.osId },
                        data: {
                            status: 'EM_ANDAMENTO',
                            fornecedorId: fornecedorId
                        }
                    })

                    // Tratar Retroalimentação de Custos e Status de Peças
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
                                    const custoTotalProc = pecaAtual.processos.reduce((sum: number, p: any) => sum + (p.valorCusto || 0), 0)
                                    await prisma.peca.update({
                                        where: { id: pecaAtual.id },
                                        data: {
                                            valorUnitario: custoTotalProc,
                                            custoTotal: custoTotalProc * pecaAtual.quantidade,
                                            statusSuprimento: 'COMPRADO',
                                            status: 'AGUARDANDO_RECEBIMENTO'
                                        }
                                    })
                                }
                            } else {
                                await prisma.peca.update({
                                    where: { id: item.pecaId },
                                    data: {
                                        statusSuprimento: 'COMPRADO',
                                        status: 'AGUARDANDO_RECEBIMENTO'
                                    }
                                })
                            }
                        }
                    }
                } else {
                    // Sem O.S (Componente Direto)
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
                                        status: 'AGUARDANDO_RECEBIMENTO',
                                        valorUnitario: item.valorUnitario,
                                        custoTotal: item.valorUnitario * pecaAtual.quantidade,
                                        fornecedorId: fornecedorId // Tenta vincular o fornecedor na peça também
                                    }
                                })
                            }
                        }
                    }
                }
            }

            // 2. Sincronização ao Receber Pedido
            if (data.status === 'RECEBIDA_TOTAL' || data.status === 'RECEBIDA_PARCIAL' || data.itensRecebidos) {
                const itensParaProcessar = data.itensRecebidos || updatedCompra.itens.map(i => ({ id: i.id, qtdEntregue: i.quantidade - i.qtdRecebida }))

                let totalItensPendentes = 0

                for (const rec of itensParaProcessar) {
                    if (rec.qtdEntregue > 0) {
                        const itemAtualizado = await prisma.compraItem.update({
                            where: { id: Number(rec.id) },
                            data: { qtdRecebida: { increment: Number(rec.qtdEntregue) } },
                            include: { peca: true }
                        })

                        if (itemAtualizado.pecaId && itemAtualizado.peca) {
                            // Buscar TODOS os itens de compra para esta peça (considerando splits entre fornecedores)
                            const todosItensPeca = await prisma.compraItem.findMany({
                                where: { pecaId: itemAtualizado.pecaId }
                            })

                            const totalRecebidoGlobal = todosItensPeca.reduce((sum: number, item: any) => sum + item.qtdRecebida, 0)
                            const totalNecessarioGlobal = itemAtualizado.peca.quantidade

                            const globalmenteCompleta = totalRecebidoGlobal >= totalNecessarioGlobal
                            const algumRecebido = totalRecebidoGlobal > 0
                            const itemEspecificoCompleto = itemAtualizado.qtdRecebida >= itemAtualizado.quantidade

                            // Marcar o PROCESSO da OS atual como concluído (apenas se o item desta OC foi finalizado)
                            if (itemEspecificoCompleto && updatedCompra.osId) {
                                await prisma.processoPeca.updateMany({
                                    where: { osId: updatedCompra.osId, pecaId: itemAtualizado.pecaId },
                                    data: { status: 'CONCLUIDO' }
                                })
                            }

                            // --- NOVA VALIDAÇÃO GLOBAL (Processos + Compras) ---
                            const todosOsProcessosDaPeca = await prisma.processoPeca.findMany({
                                where: { pecaId: itemAtualizado.pecaId }
                            })

                            const todosProcessosConcluidos = todosOsProcessosDaPeca.length === 0 ||
                                todosOsProcessosDaPeca.every((p: any) => p.status === 'CONCLUIDO')

                            const prontaParaEstoque = globalmenteCompleta && todosProcessosConcluidos

                            await prisma.peca.update({
                                where: { id: itemAtualizado.pecaId },
                                data: {
                                    statusSuprimento: globalmenteCompleta ? 'RECEBIDO' : (algumRecebido ? 'RECEBIDO_PARCIAL' : 'NAO_SOLICITADO'),
                                    status: prontaParaEstoque ? 'EM_ESTOQUE' : (algumRecebido ? 'AGUARDANDO_RECEBIMENTO' : undefined)
                                }
                            })

                            if (!prontaParaEstoque) totalItensPendentes++
                        }
                    }
                }

                // Se houver OS vinculada e tudo foi recebido, finaliza a OS
                if (updatedCompra.osId && totalItensPendentes === 0 && data.status === 'RECEBIDA_TOTAL') {
                    await prisma.ordemServico.update({
                        where: { id: updatedCompra.osId },
                        data: { status: 'CONCLUIDO' }
                    })
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
