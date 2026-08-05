import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { pecaIds, fornecedorId, tipoFornecimento, valorFornecimento } = body

        if (!pecaIds || !Array.isArray(pecaIds) || pecaIds.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'Nenhuma peça selecionada' })
        }
        if (!tipoFornecimento || !valorFornecimento) {
            throw createError({ statusCode: 400, statusMessage: 'Dados de fornecimento incompletos' })
        }

        // Buscar as peças para calcular o rateio
        const pecas = await prisma.peca.findMany({
            where: { id: { in: pecaIds } }
        })

        if (pecas.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Peças não encontradas' })
        }

        // Rateio do custo
        let valorUnitarioPorMm = 0

        if (tipoFornecimento === 'BARRA_INTEIRA') {
            // Valor fornecido é o preço de 1 barra de 6000mm
            valorUnitarioPorMm = parseFloat(valorFornecimento) / 6000
        } else if (tipoFornecimento === 'FRACIONADO') {
            // Valor fornecido é o preço total do pedaço.
            // Para ratear de forma justa, dividimos o valor total pelo somatório do comprimento * qtd de todas as peças
            let totalMm = 0
            for (const p of pecas) {
                totalMm += (p.comprimentoMaterial || 0) * (p.quantidade || 1)
            }
            if (totalMm > 0) {
                valorUnitarioPorMm = parseFloat(valorFornecimento) / totalMm
            }
        }

        // Atualizar cada peça
        for (const peca of pecas) {
            let custoDaPeca = 0
            if (tipoFornecimento === 'MEDIDA_INDIVIDUAL') {
                // Valor fornecido é o custo exato para cada peça individual (unitário)
                custoDaPeca = parseFloat(valorFornecimento)
            } else {
                custoDaPeca = valorUnitarioPorMm * (peca.comprimentoMaterial || 0)
            }

            await prisma.peca.update({
                where: { id: peca.id },
                data: {
                    valorUnitario: custoDaPeca,
                    custoTotal: custoDaPeca * (peca.quantidade || 1),
                    fornecedorId: fornecedorId ? parseInt(fornecedorId) : null,
                    statusSuprimento: 'COMPRADO'
                }
            })
        }

        return { success: true }

    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao lançar compra: ' + error.message
        })
    }
})
