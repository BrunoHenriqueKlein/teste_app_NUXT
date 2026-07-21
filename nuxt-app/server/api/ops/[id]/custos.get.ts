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
                        compras: {
                            include: {
                                compra: true
                            }
                        },
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
            let custoServicoDestaPeca = 0
            // 1. Custos de Serviços (via processos da peça)
            for (const processo of peca.processos) {
                if (processo.valorCusto) {
                    const ipiAbsoluto = processo.valorCusto * ((processo.valorIPI || 0) / 100)
                    const icmsAbsoluto = processo.valorCusto * ((processo.valorICMS || 0) / 100)
                    const subtotalServico = (processo.valorCusto + ipiAbsoluto + icmsAbsoluto) * peca.quantidade
                    
                    custoBrutoServicos += subtotalServico
                    totalIPIServicos += ipiAbsoluto * peca.quantidade
                    totalICMSServicos += icmsAbsoluto * peca.quantidade
                    
                    custoServicoDestaPeca += subtotalServico
                }
            }

            // 2. Custos de Materiais (via última compra vinculada ou estimado da engenharia)
            let ultimaCompraMaterial = null
            if (peca.compras && peca.compras.length > 0) {
                // Pegar apenas compras que não são de O.S e têm valor
                const comprasMaterial = peca.compras.filter((c: any) => !c.compra?.osId && c.valorUnitario > 0)
                if (comprasMaterial.length > 0) {
                    ultimaCompraMaterial = comprasMaterial[comprasMaterial.length - 1] // A mais recente
                }
            }

            if (ultimaCompraMaterial) {
                // Usa a peca.quantidade (BOM) e não a quantidade comprada (estoque)
                const ipiAbsoluto = ultimaCompraMaterial.valorUnitario * ((ultimaCompraMaterial.aliqIPI || 0) / 100)
                const icmsAbsoluto = ultimaCompraMaterial.valorUnitario * ((ultimaCompraMaterial.aliqICMS || 0) / 100)
                const subtotalMaterial = (ultimaCompraMaterial.valorUnitario + ipiAbsoluto + icmsAbsoluto) * peca.quantidade

                custoBrutoMateriais += subtotalMaterial
                totalIPIMateriais += ipiAbsoluto * peca.quantidade
                totalICMSMateriais += icmsAbsoluto * peca.quantidade
            } else if (peca.valorUnitario && peca.categoria === 'COMERCIAL') {
                const ipiAbsoluto = peca.valorUnitario * ((peca.valorIPI || 0) / 100)
                const icmsAbsoluto = peca.valorUnitario * ((peca.valorICMS || 0) / 100)
                const subtotal = (peca.valorUnitario + ipiAbsoluto + icmsAbsoluto) * peca.quantidade
                custoBrutoMateriais += subtotal
                totalIPIMateriais += ipiAbsoluto * peca.quantidade
                totalICMSMateriais += icmsAbsoluto * peca.quantidade
            } else if (peca.valorUnitario && peca.categoria === 'FABRICADO' && custoServicoDestaPeca === 0) {
                // Material de fabricação própria sem serviço terceirizado ainda
                const ipiAbsoluto = peca.valorUnitario * ((peca.valorIPI || 0) / 100)
                const icmsAbsoluto = peca.valorUnitario * ((peca.valorICMS || 0) / 100)
                const subtotal = (peca.valorUnitario + ipiAbsoluto + icmsAbsoluto) * peca.quantidade
                custoBrutoMateriais += subtotal
                totalIPIMateriais += ipiAbsoluto * peca.quantidade
                totalICMSMateriais += icmsAbsoluto * peca.quantidade
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
                codigoMaquina: op.codigoMaquina,
                descricaoMaquina: op.descricaoMaquina,
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
