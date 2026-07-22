import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            message: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        let body: any = {}
        try {
            body = (await readBody(event)) || {}
        } catch {
            body = {}
        }
        const quantidade = body.quantidade

        const peca = await prisma.peca.findUnique({
            where: { id: parseInt(id) }
        })

        if (!peca) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Peça não encontrada'
            })
        }

        const itemEstoque = await prisma.estoque.findUnique({
            where: { codigo: peca.codigo }
        })

        if (!itemEstoque) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Item não encontrado no cadastro de estoque'
            })
        }

        const qtdReserva = quantidade || peca.quantidade || 1

        if (itemEstoque.quantidade < qtdReserva) {
            throw createError({
                statusCode: 400,
                statusMessage: `Saldo insuficiente no estoque (Disponível: ${itemEstoque.quantidade}, Necessário: ${qtdReserva})`
            })
        }

        const userId = (event.context.user as any)?.id || 1

        return await prisma.$transaction(async (tx: any) => {
            await tx.estoqueMovimentacao.create({
                data: {
                    estoqueId: itemEstoque.id,
                    tipo: 'SAIDA',
                    quantidade: qtdReserva,
                    motivo: `Reserva para OP #${peca.opId} (Peça: ${peca.codigo})`,
                    opId: peca.opId,
                    usuarioId: userId
                }
            })

            await tx.estoque.update({
                where: { id: itemEstoque.id },
                data: { quantidade: { decrement: qtdReserva } }
            })

            const updatedPeca = await tx.peca.update({
                where: { id: peca.id },
                data: { status: 'EM_ESTOQUE' }
            })

            return updatedPeca
        })

    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao reservar estoque:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || error.message || 'Erro ao processar reserva'
        })
    }
})
