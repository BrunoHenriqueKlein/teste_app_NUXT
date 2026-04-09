import { defineEventHandler, createError, readMultipartFormData, getRouterParam, readRawBody } from 'h3'
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
    const contentType = event.headers.get('content-type') || ''

    let fileData: Buffer
    let fileName: string

    if (contentType.includes('multipart/form-data')) {
        const formData = await readMultipartFormData(event)
        if (!formData || formData.length === 0) {
            throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado' })
        }
        const file = formData.find(item => item.name === 'file')
        if (!file) {
            throw createError({ statusCode: 400, statusMessage: 'Arquivo não encontrado no multipart' })
        }
        fileData = file.data
        fileName = file.filename || 'Anexo'
    } else {
        // Suporte para envio binário direto (Macro SW / Script Simulação)
        const body = await readRawBody(event)
        if (!body) {
            throw createError({ statusCode: 400, statusMessage: 'Corpo binário vazio' })
        }
        fileData = body as Buffer
        fileName = event.headers.get('x-file-name') || `desenho_${pecaId}.pdf`
    }

    try {
        // Garantir que o diretório existe
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'desenhos')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Criar nome final para o arquivo no disco (único)
        const fileExt = path.extname(fileName)
        const diskFileName = `desenho_${pecaId}_${Date.now()}${fileExt}`
        const filePath = path.join(uploadDir, diskFileName)

        // Salvar o arquivo
        fs.writeFileSync(filePath, fileData)

        // URL pública
        const url = `/uploads/desenhos/${diskFileName}`

        // Criar registro na nova tabela de anexos
        const anexo = await prisma.pecaAnexo.create({
            data: {
                pecaId: parseInt(pecaId),
                nome: fileName,
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
