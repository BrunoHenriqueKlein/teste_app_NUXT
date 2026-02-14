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
            // 1. Custos de Materiais (via itens de compra vinculados)
            for (const itemCompra of peca.compras) {
                const subtotal = itemCompra.valorUnitario * itemCompra.quantidade
                custoBrutoMateriais += subtotal
                totalIPIMateriais += (itemCompra.valorIPI || 0)
                totalICMSMateriais += (itemCompra.valorICMS || 0)
            }

            // 2. Custos de Serviços (via processos da peça)
            for (const processo of peca.processos) {
                if (processo.valorCusto) {
                    const subtotalServico = processo.valorCusto * peca.quantidade
                    custoBrutoServicos += subtotalServico
                    totalIPIServicos += (processo.valorIPI || 0) * peca.quantidade
                    totalICMSServicos += (processo.valorICMS || 0) * peca.quantidade
                }
            }
        }

        const totalCreditos = totalIPIMateriais + totalICMSMateriais + totalIPIServicos + totalICMSServicos
        const custoTotalBruto = custoBrutoMateriais + custoBrutoServicos
        const custoLiquidoTotal = custoTotalBruto - totalCreditos

        const lucroPrejuizo = (op.valorVenda || 0) - custoLiquidoTotal
        const margem = op.valorVenda ? (lucroPrejuizo / op.valorVenda) * 100 : 0

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
