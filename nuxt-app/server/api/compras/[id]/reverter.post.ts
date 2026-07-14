import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const compraId = Number(event.context.params?.id)

    if (isNaN(compraId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID de compra inválido'
        })
    }

    try {
        const compra = await prisma.compra.findUnique({
            where: { id: compraId },
            include: { itens: true }
        })

        if (!compra) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Ordem de compra não encontrada'
            })
        }

        // 1. Reverter a Ordem de Compra para Requisição
        const compraRevertida = await prisma.compra.update({
            where: { id: compraId },
            data: {
                status: 'SOLICITADA',
                fornecedor: 'Desconhecido',
                fornecedorId: null,
                valorFrete: 0,
                valorDesconto: 0,
                formaPagamento: null,
                tipoFrete: null,
                transportadora: null,
                cnpjTransportadora: null,
                numeroNF: null,
                dataCompra: null,
                dataPrevisaoEntrega: null,
                dataEntregaReal: null,
            }
        })

        // 2. Reverter os status das Peças atreladas
        for (const item of compra.itens) {
            if (item.pecaId) {
                await prisma.peca.update({
                    where: { id: item.pecaId },
                    data: {
                        statusSuprimento: 'EM_ORCAMENTO',
                        status: 'EM_COTACAO',
                        fornecedorId: null
                    }
                })
            }
        }

        // 3. Reverter OS e Processos se for serviço
        if (compra.osId) {
            await prisma.ordemServico.update({
                where: { id: compra.osId },
                data: { 
                    status: 'AGUARDANDO',
                    fornecedorId: null
                }
            })

            await prisma.processoPeca.updateMany({
                where: { osId: compra.osId },
                data: { 
                    status: 'AGUARDANDO',
                    fornecedorId: null
                }
            })
        }

        return { success: true, message: 'Ordem de compra revertida para requisição com sucesso.' }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao reverter ordem de compra: ' + error.message
        })
    }
})
