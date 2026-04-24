import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const compraId = parseInt(event.context.params?.id as string)

    if (isNaN(compraId)) {
        throw createError({ statusCode: 400, statusMessage: 'ID da Compra inválido' })
    }

    const formData = await readMultipartFormData(event)
    
    if (!formData) {
        throw createError({ statusCode: 400, statusMessage: 'Nenhum arquivo enviado' })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'compras')
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const savedFiles = []

    for (const part of formData) {
        if (part.name === 'file' && part.filename) {
            // Gerar nome único para o arquivo
            const filename = `${Date.now()}-${part.filename}`
            const filePath = path.join(uploadsDir, filename)
            
            // Salvar no disco
            fs.writeFileSync(filePath, part.data)
            
            // Registrar no Banco de Dados
            const anexo = await prisma.compraAnexo.create({
                data: {
                    compraId,
                    nome: part.filename,
                    url: `/uploads/compras/${filename}`
                }
            })
            
            savedFiles.push(anexo)
        }
    }

    return {
        success: true,
        message: 'Orçamentos anexados com sucesso',
        anexos: savedFiles
    }
})
