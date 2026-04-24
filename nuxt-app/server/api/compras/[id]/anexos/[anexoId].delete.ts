import { defineEventHandler } from 'h3'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const compraId = parseInt(event.context.params?.id as string)
    const anexoId = parseInt(event.context.params?.anexoId as string)

    if (isNaN(compraId) || isNaN(anexoId)) {
        throw createError({ statusCode: 400, statusMessage: 'IDs inválidos' })
    }

    const anexo = await prisma.compraAnexo.findUnique({
        where: { id: anexoId }
    })

    if (!anexo || anexo.compraId !== compraId) {
        throw createError({ statusCode: 404, statusMessage: 'Anexo não encontrado' })
    }

    // Excluir arquivo físico
    const filePath = path.join(process.cwd(), 'public', anexo.url)
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }

    // Remover do BD
    await prisma.compraAnexo.delete({
        where: { id: anexoId }
    })

    return {
        success: true,
        message: 'Anexo excluído com sucesso'
    }
})
