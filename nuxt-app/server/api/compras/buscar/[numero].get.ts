import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const numero = event.context.params?.numero

    if (!numero) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Número da OC não informado.'
        })
    }

    try {
        const compra = await prisma.compra.findFirst({
            where: {
                numero: {
                    equals: numero,
                    mode: 'insensitive'
                },
                status: {
                    notIn: ['RECEBIDA_TOTAL', 'CANCELADA']
                }
            },
            include: {
                itens: {
                    include: {
                        peca: {
                            include: {
                                anexos: true
                            }
                        }
                    }
                }
            }
        })

        if (!compra) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Ordem de Compra não encontrada ou já finalizada.'
            })
        }

        return compra
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Erro ao buscar OC: ' + error.message
        })
    }
})
