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
        
        let newVIPI = existing?.valorIPI || null
        if (body.valorIPI !== undefined) {
            newVIPI = body.valorIPI ? parseFloat(body.valorIPI) : null
        }
        
        let newVICMS = existing?.valorICMS || null
        if (body.valorICMS !== undefined) {
            newVICMS = body.valorICMS ? parseFloat(body.valorICMS) : null
        }

        let vUnitComImposto = newVUnit;
        if (newVUnit) {
            vUnitComImposto = newVUnit + (newVUnit * (newVIPI || 0) / 100) + (newVUnit * (newVICMS || 0) / 100);
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
                valorIPI: newVIPI,
                valorICMS: newVICMS,
                custoTotal: vUnitComImposto * newQtd,
                fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : undefined
            }
        })
        
        // Sincronizar atualizações de quantidade e descrição nas requisições de compra em aberto
        await prisma.compraItem.updateMany({
            where: {
                pecaId: parseInt(id),
                compra: {
                    status: {
                        in: ['SOLICITADA', 'COTACAO']
                    }
                }
            },
            data: {
                quantidade: newQtd
            }
        })

        console.log(`✅ Peça ${id} atualizada com sucesso (e itens de compra sincronizados)`)
        
        try {
            const { logAction } = await import('../../utils/logger')
            await logAction(
                'Edição de Peça',
                `Peça ${body.codigo} editada. OP ID: ${existing?.opId}`,
                event.context.user?.id
            )
        } catch (e) {
            console.error('Erro ao registrar log de peca', e)
        }

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
