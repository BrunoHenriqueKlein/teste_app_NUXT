import { defineEventHandler, readBody, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { pecaIds, status, action } = body

        if (!pecaIds || !Array.isArray(pecaIds) || pecaIds.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'Nenhuma peça selecionada' })
        }

        if (action === 'update_status') {
            await prisma.peca.updateMany({
                where: {
                    id: { in: pecaIds }
                },
                data: {
                    statusSuprimento: status
                }
            })
            return { success: true, message: 'Status atualizado com sucesso' }
        }

        throw createError({ statusCode: 400, statusMessage: 'Ação inválida' })

    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar atualização: ' + error.message
        })
    }
})
