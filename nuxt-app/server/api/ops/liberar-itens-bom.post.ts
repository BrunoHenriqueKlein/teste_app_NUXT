import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const prisma = event.context.prisma
    const { pecaIds } = await readBody(event)

    if (!pecaIds || !Array.isArray(pecaIds) || pecaIds.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Lista de peças inválida.'
        })
    }

    try {
        // 1. Buscar detalhes das peças para saber a categoria e a OP
        const pecas = await prisma.peca.findMany({
            where: { id: { in: pecaIds } },
            include: { op: true }
        })

        if (pecas.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Peças não encontradas.'
            })
        }

        const opId = pecas[0].opId

        // 2. Atualizar status das peças para PARA_COTACAO apenas se elas ainda não tiverem sido processadas
        const atualizacao = await prisma.peca.updateMany({
            where: { 
                id: { in: pecaIds },
                statusSuprimento: 'NAO_SOLICITADO' 
            },
            data: { statusSuprimento: 'PARA_COTACAO' }
        })

        try {
            const { logAction } = await import('../../utils/logger')
            const numeroOP = pecas[0].op?.numeroOP || 'S/ OP'
            await logAction(
                'Liberação de Itens para Compras',
                `${atualizacao.count} item(ns) da OP ${numeroOP} liberado(s) para o setor de Compras.`,
                user.id
            )
        } catch (e) {
            console.error('Erro ao registrar log de liberação de itens:', e)
        }

        return {
            success: true,
            message: `${atualizacao.count} itens liberados para compra. (Itens que já estavam liberados ou em andamento não sofreram alterações).`
        }

    } catch (error: any) {
        console.error('Erro ao liberar itens para compra:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar liberação: ' + error.message
        })
    }
})
