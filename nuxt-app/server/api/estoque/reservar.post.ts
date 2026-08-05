import { PrismaClient } from '@prisma/client'
import { defineEventHandler, createError, readBody } from 'h3'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { pecaId, pecaIds, estoqueId } = body

        // Normaliza para array (suporta chamada antiga com pecaId único e chamada nova com pecaIds)
        const ids = pecaIds || (pecaId ? [pecaId] : [])

        if (ids.length === 0 || !estoqueId) {
            throw createError({ statusCode: 400, statusMessage: 'Dados incompletos (pecaIds ou estoqueId faltando)' })
        }

        const pecas = await prisma.peca.findMany({
            where: { id: { in: ids.map((id: any) => parseInt(id)) } },
            include: { op: true }
        })

        if (pecas.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Peças não encontradas' })
        }

        const estoque = await prisma.estoque.findUnique({
            where: { id: parseInt(estoqueId) }
        })

        if (!estoque) {
            throw createError({ statusCode: 404, statusMessage: 'Item de estoque não encontrado' })
        }

        // Calcular a quantidade de material que será baixada do estoque para o lote
        const quantidadeGasta = pecas.reduce((acc, peca) => acc + (peca.comprimentoMaterial || 0) * (peca.quantidade || 1), 0)
        
        if (quantidadeGasta <= 0) {
             throw createError({ statusCode: 400, statusMessage: 'As peças não possuem comprimentoMaterial ou quantidade configurados corretamente.' })
        }

        if (estoque.quantidade < quantidadeGasta) {
            throw createError({ statusCode: 400, statusMessage: `Saldo insuficiente. Necessário: ${quantidadeGasta} mm | Saldo: ${estoque.quantidade} mm` })
        }

        const valorBarra = estoque.valorUnitario || 0

        // Realiza as transações em lote (Transaction) para garantir consistência
        await prisma.$transaction(async (tx) => {
            // 1. Atualizar saldo do estoque
            await tx.estoque.update({
                where: { id: estoque.id },
                data: {
                    quantidade: { decrement: quantidadeGasta }
                }
            })

            // 2. Criar a movimentação resumida
            const opNumeros = [...new Set(pecas.map(p => p.op?.numeroOP || 'N/A'))].join(', ')
            const pecaCodigos = pecas.map(p => p.codigo).join(', ')
            let motivoMov = `Reserva automática em lote para ${pecas.length} peças (OPs: ${opNumeros}).`
            if (motivoMov.length > 255) motivoMov = motivoMov.substring(0, 250) + '...'

            await tx.estoqueMovimentacao.create({
                data: {
                    estoqueId: estoque.id,
                    tipo: 'SAIDA',
                    quantidade: quantidadeGasta,
                    motivo: motivoMov,
                    usuarioId: 1 // TODO: Pegar do token logado
                }
            })

            // 3. Atualizar cada peça individualmente
            for (const peca of pecas) {
                const comprimentoUnitario = peca.comprimentoMaterial || 0
                const valorHerdadoUnitario = (comprimentoUnitario / 6000) * valorBarra
                const valorIPI = peca.valorIPI || 0
                const valorICMS = peca.valorICMS || 0
                const custoTratamento = peca.custoTratamento || 0
                const valorComImposto = valorHerdadoUnitario + (valorHerdadoUnitario * valorIPI / 100) + (valorHerdadoUnitario * valorICMS / 100)
                const custoTotalNovo = (valorComImposto + custoTratamento) * peca.quantidade

                await tx.peca.update({
                    where: { id: peca.id },
                    data: {
                        statusSuprimento: 'ATENDIDO_ESTOQUE',
                        valorUnitario: valorHerdadoUnitario,
                        custoTotal: custoTotalNovo
                    }
                })
            }
        })

        // Log da ação
        try {
            const { logAction } = await import('../../utils/logger')
            await logAction(
                'Reserva de Estoque (Lote)',
                `${pecas.length} peças reservadas no estoque (Total: ${quantidadeGasta} mm)`,
                event.context.user?.id
            )
        } catch (e) {
            console.error('Erro ao registrar log de reserva em lote', e)
        }

        return { success: true, message: `Lote de ${pecas.length} peças reservadas com sucesso.` }

    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao reservar estoque:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao processar a reserva de estoque.'
        })
    }
})
