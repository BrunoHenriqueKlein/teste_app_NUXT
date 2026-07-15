import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

/**
 * Faz o upload de um arquivo para o Google Drive e o torna público.
 * @param filePath Caminho absoluto do arquivo no servidor.
 * @param mimeType Tipo MIME do arquivo (ex: 'application/zip').
 * @param originalName Nome do arquivo (ex: 'cotacao.zip').
 * @returns Um link compartilhável para o arquivo (webViewLink).
 */
export const uploadToGoogleDrive = async (filePath: string, mimeType: string, originalName: string): Promise<string> => {
    // O arquivo de credenciais deve ser colocado na raiz do projeto
    const keyPath = path.resolve(process.cwd(), 'credenciais.json')
    
    if (!fs.existsSync(keyPath)) {
        throw new Error('Arquivo credenciais.json não encontrado na raiz do projeto. Por favor, siga as instruções para gerar as credenciais do Google Cloud.')
    }

    // Inicializa a autenticação
    const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/drive.file']
    })

    const drive = google.drive({ version: 'v3', auth })

    // Configura os metadados do arquivo
    const fileMetadata = {
        name: originalName,
        parents: ['1PPx1S8YL9HqQRUiVoRsd3Y6M9wJy0Bty'] // Pasta "Cotacoes_Someh" do usuário
    }

    // Lê o arquivo como stream
    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
    }

    try {
        // 1. Faz o upload
        const file = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        })

        const fileId = file.data.id
        if (!fileId) throw new Error('Falha ao obter ID do arquivo no Google Drive')

        // 2. Altera a permissão para "Qualquer pessoa com o link"
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        })

        return file.data.webViewLink as string
    } catch (error: any) {
        console.error('Erro no upload para o Google Drive:', error)
        throw new Error('Falha ao fazer upload para o Google Drive: ' + error.message)
    }
}
