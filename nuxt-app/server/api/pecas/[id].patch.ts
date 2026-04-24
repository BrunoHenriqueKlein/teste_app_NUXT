import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma
    const body = await readBody(event)

    try {
        console.log(`📝 Atualizando peça ${id}:`, body)

        const existing = await prisma.peca.findUnique({ where: { id: parseInt(id) } })
        const newQtd = (body.quantidade !== undefined && body.quantidade !== null) ? parseInt(body.quantidade) : (existing?.quantidade || 1)

        // Se vier valor unitário na edição, sobrescreve. Senão mantém o valor já atrelado.
        let newVUnit = existing?.valorUnitario || 0
        if (body.valorUnitario !== undefined && body.valorUnitario !== null) {
            newVUnit = parseFloat(body.valorUnitario)
        }

        const updatedPeca = await prisma.peca.update({
            where: { id: parseInt(id) },
            data: {
                codigo: body.codigo,
                descricao: body.descricao,
                quantidade: newQtd,
                material: body.material,
                status: body.status,
                categoria: body.categoria,
                subcategoria: body.subcategoria,
                subconjunto: body.subconjunto,
                statusSuprimento: body.statusSuprimento,
                valorUnitario: newVUnit,
                custoTotal: newVUnit * newQtd,
                fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : undefined
            }
        })
        console.log(`✅ Peça ${id} atualizada com sucesso`)
        return updatedPeca
    } catch (error: any) {
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao atualizar peça:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao atualizar os dados da peça'
        })
    }
})
