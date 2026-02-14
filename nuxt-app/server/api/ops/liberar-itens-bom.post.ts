import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const prisma = event.context.prisma
    const { pecaIds } = await readBody(event)

    if (!pecaIds || !Array.isArray(pecaIds) || pecaIds.length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Lista de peças inválida.'
        })
    }

    try {
        // 1. Buscar detalhes das peças para saber a categoria e a OP
        const pecas = await prisma.peca.findMany({
            where: { id: { in: pecaIds } },
            include: { op: true }
        })

        if (pecas.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Peças não encontradas.'
            })
        }

        const opId = pecas[0].opId

        // 2. Atualizar status das peças para PARA_COTACAO
        await prisma.peca.updateMany({
            where: { id: { in: pecaIds } },
            data: { statusSuprimento: 'PARA_COTACAO' }
        })

        // 3. Agrupar peças por categoria para criar as requisições
        // Lógica de agrupamento baseada no material ou subcategoria (simplificada para o exemplo)
        const categorias = {
            'MATERIA_PRIMA': pecas.filter(p => p.material?.toLowerCase().includes('barra') || p.material?.toLowerCase().includes('chapa')),
            'ELETRICO': pecas.filter(p => p.subcategoria?.toLowerCase().includes('elet') || p.material?.toLowerCase().includes('cabo')),
            'COMERCIAL': pecas.filter(p => p.subcategoria?.toLowerCase().includes('comerc') || p.material?.toLowerCase().includes('parafuso')),
            'SERVICO_EXTERNO': pecas.filter(p => p.categoria === 'FABRICADO' && p.statusSuprimento === 'PARA_COTACAO') // Itens fabricados que precisam de processo externo
        }

        const results = []

        for (const [catName, itens] of Object.entries(categorias)) {
            if (itens.length === 0) continue

            // 4. Localizar ou criar uma "Compra" (Requisição) para este lote/categoria
            // Procuramos uma que ainda esteja no status SOLICITADA para a mesma OP e categoria (usando o nome do fornecedor como 'tag' temporária)
            let compra = await prisma.compra.findFirst({
                where: {
                    opId: opId,
                    status: 'SOLICITADA',
                    fornecedor: `REQ_${catName}` // Usando o campo fornecedor para identificar a categoria da requisição por ora
                }
            })

            if (!compra) {
                const count = await prisma.compra.count()
                compra = await prisma.compra.create({
                    data: {
                        opId: opId,
                        numero: `REQ-${(count + 1).toString().padStart(4, '0')}`,
                        fornecedor: `REQ_${catName}`,
                        status: 'SOLICITADA'
                    }
                })
            }

            // 5. Adicionar itens à requisição
            for (const item of itens) {
                // Verificar se o item já está na requisição para não duplicar
                const exists = await prisma.compraItem.findFirst({
                    where: {
                        compraId: compra.id,
                        pecaId: item.id
                    }
                })

                if (!exists) {
                    await prisma.compraItem.create({
                        data: {
                            compraId: compra.id,
                            pecaId: item.id,
                            descricao: item.descricao,
                            quantidade: item.quantidade,
                            valorUnitario: 0
                        }
                    })
                }
            }
            results.push({ categoria: catName, compraId: compra.id, numero: compra.numero })
        }

        return {
            success: true,
            message: `${pecaIds.length} itens liberados para compra.`,
            requericoes: results
        }

    } catch (error: any) {
        console.error('Erro ao liberar itens para compra:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao processar liberação: ' + error.message
        })
    }
})
