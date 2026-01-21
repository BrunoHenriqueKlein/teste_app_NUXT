import { defineEventHandler, createError, readMultipartFormData, getRouterParam } from 'h3'
import * as XLSX from 'xlsx'

export default defineEventHandler(async (event) => {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
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
            statusMessage: 'Arquivo não encontrado no formulário'
        })
    }

    try {
        // Ler o buffer do arquivo Excel
        const workbook = XLSX.read(file.data, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Converter para JSON
        // Esperamos colunas: Codigo, Descricao, Quantidade, Material
        const rawData = XLSX.utils.sheet_to_json(worksheet)

        console.log(`📊 Importando ${rawData.length} itens para a OP ${opId}`)

        const results = []
        const errors = []

        for (const item of rawData) {
            const row = item as any
            try {
                const codigo = String(row.Codigo || row.codigo || row.CODIGO || '').trim()
                const descricao = String(row.Descricao || row.descricao || row.DESCRICAO || '').trim()
                const quantidade = parseInt(row.Quantidade || row.quantidade || row.QUANTIDADE || '1')
                const material = String(row.Material || row.material || row.MATERIAL || '').trim()

                if (!codigo || !descricao) {
                    continue // Pula linhas vazias ou inválidas
                }

                // 1. Verificar se já existe no Estoque para avisar
                const itemEstoque = await prisma.estoque.findUnique({
                    where: { codigo }
                })

                // 2. Criar ou atualizar a peça na OP
                const peca = await prisma.peca.upsert({
                    where: {
                        opId_codigo: {
                            opId: parseInt(opId),
                            codigo
                        }
                    },
                    update: {
                        descricao,
                        quantidade,
                        material
                    },
                    create: {
                        opId: parseInt(opId),
                        codigo,
                        descricao,
                        quantidade,
                        material,
                        status: itemEstoque ? 'EM_ESTOQUE' : 'NAO_INICIADA'
                    }
                })

                results.push({
                    ...peca,
                    temNoEstoque: !!itemEstoque,
                    saldoEstoque: itemEstoque?.quantidade || 0
                })
            } catch (rowError: any) {
                errors.push({ row, error: rowError.message })
            }
        }

        return {
            success: true,
            importedCount: results.length,
            items: results,
            errors
        }
    } catch (error) {
        console.error('❌ Erro ao processar Excel:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar o arquivo Excel'
        })
    }
})
