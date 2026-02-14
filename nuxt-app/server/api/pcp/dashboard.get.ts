import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma

    try {
        // Buscar todas as OPs ativas (não finalizadas e não canceladas)
        const ops = await prisma.oP.findMany({
            where: {
                status: {
                    notIn: ['FINALIZADA', 'CANCELADA']
                }
            },
            include: {
                pecas: {
                    include: {
                        anexos: true,
                        itensCompra: {
                            include: {
                                compra: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                dataEntrega: 'asc'
            }
        })

        // Processar os dados para o Dashboard
        const dashboardData = ops.map(op => {
            const totalPecas = op.pecas.length
            const pecasRecebidas = op.pecas.filter(p => p.statusSuprimento === 'RECEBIDO').length
            const pecasCompradas = op.pecas.filter(p => p.statusSuprimento === 'COMPRADO').length
            const pecasEmCotacao = op.pecas.filter(p => p.statusSuprimento === 'PARA_COTACAO').length

            // Verificar atrasos
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)

            const itensAtrasados = op.pecas.filter(p => {
                if (p.statusSuprimento === 'RECEBIDO') return false

                // Pegar a data de previsão da compra vinculada
                const compraItem = p.itensCompra[0]
                if (compraItem?.compra?.dataPrevisaoEntrega) {
                    const previsao = new Date(compraItem.compra.dataPrevisaoEntrega)
                    return previsao < hoje
                }
                return false
            }).map(p => ({
                id: p.id,
                codigo: p.codigo,
                descricao: p.descricao,
                status: p.statusSuprimento,
                previsao: p.itensCompra[0]?.compra?.dataPrevisaoEntrega
            }))

            return {
                id: op.id,
                numeroOP: op.numeroOP,
                cliente: op.cliente,
                dataEntregaOP: op.dataEntrega,
                progressoSuprimentos: totalPecas > 0 ? (pecasRecebidas / totalPecas) * 100 : 0,
                stats: {
                    total: totalPecas,
                    recebidas: pecasRecebidas,
                    compradas: pecasCompradas,
                    emCotacao: pecasEmCotacao,
                    pendentes: totalPecas - pecasRecebidas
                },
                atrasos: itensAtrasados
            }
        })

        return dashboardData
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao carregar dados do PCP: ' + error.message
        })
    }
})
