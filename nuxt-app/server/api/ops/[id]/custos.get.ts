import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const opId = getRouterParam(event, 'id')

    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não fornecido'
        })
    }

    try {
        const op = await prisma.oP.findUnique({
            where: { id: parseInt(opId) },
            include: {
                pecas: {
                    include: {
                        compras: true,
                        processos: true
                    }
                }
            }
        })

        if (!op) {
            throw createError({
                statusCode: 404,
                statusMessage: 'OP não encontrada'
            })
        }

        let custoBrutoMateriais = 0
        let totalIPIMateriais = 0
        let totalICMSMateriais = 0

        let custoBrutoServicos = 0
        let totalIPIServicos = 0
        let totalICMSServicos = 0

        for (const peca of op.pecas) {
            // 1. Custos de Materiais (via itens de compra vinculados ou estimado da engenharia)
            let custoCompraDaPeca = 0
            let ipiCompraDaPeca = 0
            let icmsCompraDaPeca = 0
            let temCompraValida = false

            if (peca.compras && peca.compras.length > 0) {
                for (const itemCompra of peca.compras) {
                    if (itemCompra.valorUnitario > 0) {
                        temCompraValida = true
                        const ipiAbsoluto = itemCompra.valorIPI || 0
                        const icmsAbsoluto = itemCompra.valorICMS || 0
                        custoCompraDaPeca += (itemCompra.valorUnitario * itemCompra.quantidade) + ipiAbsoluto + icmsAbsoluto
                        ipiCompraDaPeca += ipiAbsoluto
                        icmsCompraDaPeca += icmsAbsoluto
                    }
                }
            }

            if (temCompraValida) {
                custoBrutoMateriais += custoCompraDaPeca
                totalIPIMateriais += ipiCompraDaPeca
                totalICMSMateriais += icmsCompraDaPeca
            } else if (peca.categoria === 'COMPRADO' && peca.valorUnitario) {
                const ipiAbsoluto = peca.valorUnitario * ((peca.valorIPI || 0) / 100)
                const icmsAbsoluto = peca.valorUnitario * ((peca.valorICMS || 0) / 100)
                const subtotal = (peca.valorUnitario + ipiAbsoluto + icmsAbsoluto) * peca.quantidade
                custoBrutoMateriais += subtotal
                totalIPIMateriais += ipiAbsoluto * peca.quantidade
                totalICMSMateriais += icmsAbsoluto * peca.quantidade
            }

            // 2. Custos de Serviços (via processos da peça)
            for (const processo of peca.processos) {
                if (processo.valorCusto) {
                    const ipiAbsoluto = processo.valorCusto * ((processo.valorIPI || 0) / 100)
                    const icmsAbsoluto = processo.valorCusto * ((processo.valorICMS || 0) / 100)
                    const subtotalServico = (processo.valorCusto + ipiAbsoluto + icmsAbsoluto) * peca.quantidade
                    
                    custoBrutoServicos += subtotalServico
                    totalIPIServicos += ipiAbsoluto * peca.quantidade
                    totalICMSServicos += icmsAbsoluto * peca.quantidade
                }
            }
        }

        const totalCreditos = totalIPIMateriais + totalICMSMateriais + totalIPIServicos + totalICMSServicos
        const custoTotalBruto = custoBrutoMateriais + custoBrutoServicos
        const custoLiquidoTotal = custoTotalBruto - totalCreditos

        const lucroPrejuizo = (op.orcamentoPrevisto || 0) - custoLiquidoTotal
        const margem = op.orcamentoPrevisto ? (lucroPrejuizo / op.orcamentoPrevisto) * 100 : 0

        const lucroPrejuizoGlobal = (op.valorVenda || 0) - custoLiquidoTotal
        const margemGlobal = op.valorVenda ? (lucroPrejuizoGlobal / op.valorVenda) * 100 : 0

        return {
            op: {
                numeroOP: op.numeroOP,
                cliente: op.cliente,
                orcamentoPrevisto: op.orcamentoPrevisto,
                valorVenda: op.valorVenda
            },
            resumo: {
                materiais: {
                    bruto: custoBrutoMateriais,
                    ipi: totalIPIMateriais,
                    icms: totalICMSMateriais,
                    liquido: custoBrutoMateriais - (totalIPIMateriais + totalICMSMateriais)
                },
                servicos: {
                    bruto: custoBrutoServicos,
                    ipi: totalIPIServicos,
                    icms: totalICMSServicos,
                    liquido: custoBrutoServicos - (totalIPIServicos + totalICMSServicos)
                },
                totais: {
                    bruto: custoTotalBruto,
                    creditosImpostos: totalCreditos,
                    liquido: custoLiquidoTotal
                },
                financeiro: {
                    lucroPrejuizo,
                    margemPercentual: margem,
                    lucroPrejuizoGlobal,
                    margemGlobalPercentual: margemGlobal,
                    statusOrcamento: op.orcamentoPrevisto ? (custoLiquidoTotal <= op.orcamentoPrevisto ? 'DENTRO' : 'EXCEDIDO') : 'N/A'
                }
            }
        }
    } catch (error: any) {
        console.error('Erro ao calcular custos da OP:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao consolidar custos: ' + error.message
        })
    }
})
