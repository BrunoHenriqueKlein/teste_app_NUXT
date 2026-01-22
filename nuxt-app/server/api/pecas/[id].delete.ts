import { defineEventHandler, createError, getRouterParam } from 'h3'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        console.log(`🗑️ Iniciando exclusão da peça ${id}`)
        // 1. Buscar anexos para remover arquivos físicos
        const anexos = await prisma.pecaAnexo.findMany({
            where: { pecaId: parseInt(id) }
        })

        for (const anexo of anexos) {
            const filePath = path.join(process.cwd(), 'public', anexo.url)
            console.log(`📂 Removendo arquivo: ${filePath}`)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        }

        // 2. Deletar a peça (processos e anexos no DB serão removidos via Cascade)
        await prisma.peca.delete({
            where: { id: parseInt(id) }
        })

        console.log(`✅ Peça ${id} excluída com sucesso`)
        return { success: true }
    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao excluir peça:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao excluir a peça do sistema'
        })
    }
})
