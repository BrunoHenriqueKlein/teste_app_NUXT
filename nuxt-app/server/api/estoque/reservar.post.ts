import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { pecaId, estoqueId } = body

        if (!pecaId || !estoqueId) {
            throw createError({ statusCode: 400, statusMessage: 'Dados incompletos (pecaId ou estoqueId faltando)' })
        }

        const peca = await prisma.peca.findUnique({
            where: { id: parseInt(pecaId) },
            include: { op: true }
        })

        if (!peca) {
            throw createError({ statusCode: 404, statusMessage: 'Peça não encontrada' })
        }

        const estoque = await prisma.estoque.findUnique({
            where: { id: parseInt(estoqueId) }
        })

        if (!estoque) {
            throw createError({ statusCode: 404, statusMessage: 'Item de estoque não encontrado' })
        }

        // Calcular a quantidade de material que será baixada do estoque
        const quantidadeGasta = (peca.comprimentoMaterial || 0) * (peca.quantidade || 1)
        
        if (quantidadeGasta <= 0) {
             throw createError({ statusCode: 400, statusMessage: 'A peça não possui comprimentoMaterial ou quantidade configurados corretamente.' })
        }

        if (estoque.quantidade < quantidadeGasta) {
            throw createError({ statusCode: 400, statusMessage: 'Saldo insuficiente no estoque para atender esta peça.' })
        }

        // Calcula o custo que será herdado
        // A lógica do plano: (comprimento consumido por 1 peca / 6000) * valor unitário do estoque
        // Assumindo que a peça será precificada unitariamente com esse valor herdado.
        const valorBarra = estoque.valorUnitario || 0
        const comprimentoUnitario = peca.comprimentoMaterial || 0
        const valorHerdadoUnitario = (comprimentoUnitario / 6000) * valorBarra

        const valorIPI = peca.valorIPI || 0
        const valorICMS = peca.valorICMS || 0
        const custoTratamento = peca.custoTratamento || 0

        const valorComImposto = valorHerdadoUnitario + (valorHerdadoUnitario * valorIPI / 100) + (valorHerdadoUnitario * valorICMS / 100)
        const custoTotalNovo = (valorComImposto + custoTratamento) * peca.quantidade

        // Realiza as transações em lote (Transaction) para garantir consistência
        await prisma.$transaction(async (tx) => {
            // 1. Atualizar saldo do estoque
            await tx.estoque.update({
                where: { id: estoque.id },
                data: {
                    quantidade: { decrement: quantidadeGasta }
                }
            })

            // 2. Criar a movimentação
            await tx.estoqueMovimentacao.create({
                data: {
                    estoqueId: estoque.id,
                    tipo: 'SAIDA',
                    quantidade: quantidadeGasta,
                    motivo: `Reserva automática para a Peça ${peca.codigo} (OP ${peca.op?.numeroOP || 'N/A'})`,
                    usuarioId: 1 // TODO: Pegar do token logado
                }
            })

            // 3. Atualizar a peça
            await tx.peca.update({
                where: { id: peca.id },
                data: {
                    statusSuprimento: 'ATENDIDO_ESTOQUE',
                    valorUnitario: valorHerdadoUnitario,
                    custoTotal: custoTotalNovo
                }
            })
        })

        // Log da ação
        try {
            const { logAction } = await import('../../utils/logger')
            await logAction(
                'Reserva de Estoque',
                `Peça ${peca.codigo} reservada no estoque. Gasto: ${quantidadeGasta} mm, Valor Herdado: R$ ${valorHerdadoUnitario.toFixed(2)}`,
                event.context.user?.id
            )
        } catch (e) {
            console.error('Erro ao registrar log de reserva', e)
        }

        return { success: true, message: 'Material reservado com sucesso.' }

    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao reservar estoque:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao processar a reserva de estoque.'
        })
    }
})
