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
        const body = await readBody(event)
        const { quantidade } = body

        // ... (rest of logic remains same, just ensuring createError uses message) ...
        const peca = await prisma.peca.findUnique({
            where: { id: parseInt(id) }
        })

        if (!peca) {
            throw createError({
                statusCode: 404,
                message: 'Peça não encontrada'
            })
        }

        const itemEstoque = await prisma.estoque.findUnique({
            where: { codigo: peca.codigo }
        })

        if (!itemEstoque || itemEstoque.quantidade < (quantidade || peca.quantidade)) {
            throw createError({
                statusCode: 400,
                message: 'Saldo insuficiente no estoque'
            })
        }
        // ...
        const qtdReserva = quantidade || peca.quantidade

        return await prisma.$transaction(async (tx: any) => {
            await tx.estoqueMovimentacao.create({
                data: {
                    estoqueId: itemEstoque.id,
                    tipo: 'SAIDA',
                    quantidade: qtdReserva,
                    motivo: `Reserva para OP #${peca.opId} (Peça: ${peca.codigo})`,
                    opId: peca.opId,
                    usuarioId: 1
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
            statusCode: 500,
            message: 'Erro ao processar reserva: ' + error.message
        })
    }
})
