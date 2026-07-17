import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { compraId, numeroNF, itens, dataEntregaReal } = body

    if (!compraId || !itens || !Array.isArray(itens)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dados de recebimento inválidos.'
        })
    }

    try {
        // 1. Atualizar a Compra com a NF e data de entrega
        const updatedCompra = await prisma.compra.update({
            where: { id: Number(compraId) },
            data: {
                numeroNF: numeroNF,
                dataEntregaReal: dataEntregaReal ? new Date(dataEntregaReal) : new Date(),
                status: 'RECEBIDA_TOTAL'
            },
            include: { itens: true }
        })

        // 2. Se houver OS vinculada, fazer a baixa em cascata
        if (updatedCompra.osId) {
            await prisma.ordemServico.update({
                where: { id: updatedCompra.osId },
                data: { status: 'CONCLUIDO' }
            })

            // Marcar todos os processos de peças daquela OS como CONCLUIDO
            await prisma.processoPeca.updateMany({
                where: { osId: updatedCompra.osId },
                data: { status: 'CONCLUIDO' }
            })
        }

        // 3. Atualizar o status de cada peça vinculada aos itens recebidos
        for (const item of itens) {
            let currentPecaId = item.pecaId
            let currentEstoqueId = item.estoqueId

            if (!currentPecaId && !currentEstoqueId && item.id) {
                const dbItem = await prisma.compraItem.findUnique({
                    where: { id: item.id },
                    select: { pecaId: true, estoqueId: true }
                })
                currentPecaId = dbItem?.pecaId
                currentEstoqueId = dbItem?.estoqueId
            }

            if (currentPecaId) {
                // Se a peça for COMPRADA pura, o statusSuprimento vai para RECEBIDO
                // Se for um serviço de FABRICADO, o status da peça na BOM também pode avançar
                await prisma.peca.update({
                    where: { id: currentPecaId },
                    data: {
                        statusSuprimento: 'RECEBIDO'
                    }
                })
            } else if (currentEstoqueId) {
                const estoqueExistente = await prisma.estoque.findUnique({ where: { id: currentEstoqueId } })
                if (estoqueExistente) {
                    const novaQuantidade = estoqueExistente.quantidade + (item.quantidade || 0)
                    const novoValorUnitario = item.valorUnitario || estoqueExistente.valorUnitario || 0
                    const novoImpostoIPI = item.aliqIPI || estoqueExistente.impostoIPI || 0
                    const novoValorTotal = novaQuantidade * novoValorUnitario * (1 + novoImpostoIPI / 100)

                    await prisma.estoque.update({
                        where: { id: currentEstoqueId },
                        data: {
                            quantidade: novaQuantidade,
                            valorUnitario: novoValorUnitario,
                            impostoIPI: novoImpostoIPI,
                            valorTotal: novoValorTotal
                        }
                    })
                }
            }
        }

        try {
            const { logAction } = await import('../../utils/logger')
            await logAction(
                'Recebimento de Materiais',
                `Recebida NF ${numeroNF} referente ao Pedido de Compra #${updatedCompra.numero}. Total de itens: ${itens.length}.`,
                event.context.user?.id
            )
        } catch (e) {
            console.error('Erro ao registrar log de recebimento:', e)
        }

        return { success: true, message: 'Recebimento processado com sucesso!' }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar recebimento: ' + error.message
        })
    }
})
