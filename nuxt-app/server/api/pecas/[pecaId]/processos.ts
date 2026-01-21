import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const pecaId = getRouterParam(event, 'pecaId')
    const method = event.method

    if (!pecaId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma

    if (method === 'GET') {
        try {
            const processos = await prisma.processoPeca.findMany({
                where: { pecaId: parseInt(pecaId) },
                include: { ordemServico: true },
                orderBy: { sequencia: 'asc' }
            })
            return processos
        } catch (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao buscar processos da peça'
            })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { processos } = body // Espera um array de processos

        try {
            // Usar transação para garantir integridade
            return await prisma.$transaction(async (tx: any) => {
                // 1. Remover processos antigos que não estão mais na lista (opcional, ou apenas atualizar)
                // Para simplificar, vamos deletar e recriar ou atualizar por ID

                const results = []
                for (let i = 0; i < processos.length; i++) {
                    const p = processos[i]
                    const proc = await tx.processoPeca.upsert({
                        where: { id: p.id || -1 },
                        update: {
                            nome: p.nome,
                            sequencia: i + 1,
                            status: p.status || 'NAO_INICIADO',
                            fornecedor: p.fornecedor,
                            custo: p.custo,
                            tempoEstimado: p.tempoEstimado
                        },
                        create: {
                            pecaId: parseInt(pecaId),
                            nome: p.nome,
                            sequencia: i + 1,
                            status: p.status || 'NAO_INICIADO',
                            fornecedor: p.fornecedor,
                            custo: p.custo,
                            tempoEstimado: p.tempoEstimado
                        }
                    })
                    results.push(proc)
                }
                return results
            })
        } catch (error) {
            console.error('❌ Erro ao salvar processos:', error)
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao salvar processos da peça'
            })
        }
    }
})
