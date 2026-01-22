import { defineEventHandler, createError, readMultipartFormData, getRouterParam } from 'h3'
import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
    const pecaId = getRouterParam(event, 'id')
    if (!pecaId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Nenhum arquivo enviado'
        })
    }

    const file = formData.find(item => item.name === 'file')
    if (!file) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Arquivo não encontrado'
        })
    }

    try {
        // Garantir que o diretório existe
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'desenhos')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Criar nome único para o arquivo
        const fileExt = path.extname(file.filename || '')
        const fileName = `desenho_${pecaId}_${Date.now()}${fileExt}`
        const filePath = path.join(uploadDir, fileName)

        // Salvar o arquivo
        fs.writeFileSync(filePath, file.data)

        // URL pública
        const url = `/uploads/desenhos/${fileName}`

        // Criar registro na nova tabela de anexos
        const anexo = await prisma.pecaAnexo.create({
            data: {
                pecaId: parseInt(pecaId),
                nome: file.filename || 'Anexo',
                url
            }
        })

        return { success: true, anexo }
    } catch (error: any) {
        console.error('❌ Erro ao salvar desenho:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao salvar o arquivo: ' + error.message
        })
    }
})
