import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { compraId, numeroNF, itens, dataEntregaReal } = body

    if (!compraId || !itens || !Array.isArray(itens)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dados de recebimento inválidos.'
        })
    }

    try {
        // 1. Atualizar a Compra com a NF e data de entrega
        await prisma.compra.update({
            where: { id: Number(compraId) },
            data: {
                numeroNF: numeroNF,
                dataEntregaReal: dataEntregaReal ? new Date(dataEntregaReal) : new Date(),
                status: 'RECEBIDA_TOTAL' // Simplificado (assume-se que recebeu tudo se está dando baixa)
            }
        })

        // 2. Atualizar o status de cada peça vinculada aos itens recebidos
        for (const item of itens) {
            // Buscar o pecaId se não foi passado (segurança)
            let currentPecaId = item.pecaId

            if (!currentPecaId && item.id) {
                const dbItem = await prisma.compraItem.findUnique({
                    where: { id: item.id },
                    select: { pecaId: true }
                })
                currentPecaId = dbItem?.pecaId
            }

            if (currentPecaId) {
                await prisma.peca.update({
                    where: { id: currentPecaId },
                    data: {
                        statusSuprimento: 'RECEBIDO'
                    }
                })
            }
        }

        return { success: true, message: 'Recebimento processado com sucesso!' }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar recebimento: ' + error.message
        })
    }
})
