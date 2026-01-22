import { defineEventHandler, createError, getRouterParam } from 'h3'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do anexo não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        // 1. Buscar o anexo para pegar a URL
        const anexo = await prisma.pecaAnexo.findUnique({
            where: { id: parseInt(id) }
        })

        if (!anexo) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Anexo não encontrado'
            })
        }

        // 2. Tentar remover o arquivo físico
        const filePath = path.join(process.cwd(), 'public', anexo.url)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        // 3. Remover do banco de dados
        await prisma.pecaAnexo.delete({
            where: { id: parseInt(id) }
        })

        return { success: true }
    } catch (error: any) {
        console.error('❌ Erro ao deletar anexo:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao deletar anexo: ' + error.message
        })
    }
})
