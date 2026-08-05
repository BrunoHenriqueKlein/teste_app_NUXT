import { PrismaClient } from '@prisma/client'

const normalizeKey = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().replace(/\s+/g, ' ')
}

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { action, tipoMaterial, material, quantidade, valorUnitario, motivo, oldCodigo, id } = body

        if (!action) {
            throw createError({ statusCode: 400, statusMessage: 'Ação não informada' })
        }

        if (action === 'delete') {
            if (!id) throw createError({ statusCode: 400, statusMessage: 'ID não informado' })
            await prisma.estoqueMovimentacao.deleteMany({ where: { estoqueId: parseInt(id) } })
            await prisma.estoque.delete({ where: { id: parseInt(id) } })
            return { success: true }
        }

        if (!tipoMaterial || (action !== 'edit' && quantidade === undefined)) {
            throw createError({ statusCode: 400, statusMessage: 'Dados incompletos' })
        }

        const codigoOriginal = `${tipoMaterial} | ${material || ''}`
        const codigo = normalizeKey(codigoOriginal)
        
        let estoqueItem = null
        
        if (action === 'edit' && id) {
            estoqueItem = await prisma.estoque.findUnique({ where: { id: parseInt(id) } })
            if (!estoqueItem) throw createError({ statusCode: 404, statusMessage: 'Item não encontrado' })
            
            await prisma.estoque.update({
                where: { id: estoqueItem.id },
                data: {
                    codigo,
                    descricao: tipoMaterial,
                    material: material || '',
                    ...(valorUnitario !== undefined ? { valorUnitario: parseFloat(valorUnitario) } : {})
                }
            })
            return { success: true }
        }

        estoqueItem = await prisma.estoque.findUnique({
            where: { codigo }
        })

        if (!estoqueItem) {
            estoqueItem = await prisma.estoque.create({
                data: {
                    codigo,
                    descricao: tipoMaterial,
                    material: material || '',
                    categoria: 'MATERIA_PRIMA',
                    unidade: 'mm',
                    quantidade: 0,
                    ...(valorUnitario !== undefined ? { valorUnitario: parseFloat(valorUnitario) } : {})
                }
            })
        }

        let novaQuantidade = estoqueItem.quantidade
        let tipoMovimentacao = 'ENTRADA'

        if (action === 'add') {
            novaQuantidade += parseInt(quantidade)
            tipoMovimentacao = 'ENTRADA'
        } else if (action === 'deduct') {
            novaQuantidade -= parseInt(quantidade)
            tipoMovimentacao = 'SAIDA'
        } else {
            throw createError({ statusCode: 400, statusMessage: 'Ação inválida' })
        }

        // Atualizar saldo
        await prisma.estoque.update({
            where: { id: estoqueItem.id },
            data: { quantidade: novaQuantidade }
        })

        // Registrar movimentação
        await prisma.estoqueMovimentacao.create({
            data: {
                estoqueId: estoqueItem.id,
                tipo: tipoMovimentacao as any,
                quantidade: parseInt(quantidade),
                motivo: motivo || (action === 'add' ? 'Entrada Manual' : 'Baixa para OP'),
                usuarioId: 1 // TODO: Pegar do usuário logado
            }
        })

        return { success: true, novaQuantidade }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao movimentar estoque: ' + error.message
        })
    }
})
