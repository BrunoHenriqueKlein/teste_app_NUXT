import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const method = event.method

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da peça não informado'
        })
    }

    const prisma = event.context.prisma

    if (method === 'GET') {
        try {
            console.log(`🔍 Buscando processos para a peça ${id}`)
            const processos = await prisma.processoPeca.findMany({
                where: { pecaId: parseInt(id) },
                include: { ordemServico: true },
                orderBy: { sequencia: 'asc' }
            })
            console.log(`✅ Sucesso: ${processos.length} processos encontrados`)
            return processos
        } catch (error) {
            console.error('❌ Erro ao buscar processos:', error)
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao buscar processos da peça'
            })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { processos } = body
        console.log(`📦 Recebendo ${processos?.length || 0} processos para a peça ${id}`)

        try {
            return await prisma.$transaction(async (tx: any) => {
                // 1. Obter IDs dos processos enviados para manter
                const sentIds = processos.filter((p: any) => p.id).map((p: any) => p.id)

                // 2. Deletar processos que não foram enviados na lista atual
                await tx.processoPeca.deleteMany({
                    where: {
                        pecaId: parseInt(id),
                        id: { notIn: sentIds }
                    }
                })

                const results = []
                for (let i = 0; i < processos.length; i++) {
                    const p = processos[i]

                    // Sanitizar fornecedorId: garantir que seja Int ou null
                    let fId = p.fornecedorId
                    if (fId === '' || fId === undefined) fId = null
                    if (fId !== null) fId = parseInt(fId)

                    // Sanitizar valorCusto
                    let vCusto = p.valorCusto
                    if (vCusto === '' || vCusto === undefined || vCusto === null) {
                        vCusto = null
                    } else if (typeof vCusto === 'string') {
                        vCusto = parseFloat(vCusto.replace(',', '.'))
                        if (isNaN(vCusto)) vCusto = null
                    } else {
                        vCusto = parseFloat(vCusto)
                    }

                    const proc = await tx.processoPeca.upsert({
                        where: { id: p.id || -1 },
                        update: {
                            nome: p.nome,
                            sequencia: i + 1,
                            status: p.status || 'NAO_INICIADO',
                            fornecedorId: fId,
                            tempoEstimado: p.tempoEstimado ? parseInt(p.tempoEstimado) : null,
                            valorCusto: vCusto
                        },
                        create: {
                            pecaId: parseInt(id),
                            nome: p.nome,
                            sequencia: i + 1,
                            status: p.status || 'NAO_INICIADO',
                            fornecedorId: fId,
                            tempoEstimado: p.tempoEstimado ? parseInt(p.tempoEstimado) : null,
                            valorCusto: vCusto
                        }
                    })
                    results.push(proc)
                }

                // 4. Somar todos os custos e atualizar a Peça pai
                const pecaAtual = await tx.peca.findUnique({
                    where: { id: parseInt(id) },
                    select: { quantidade: true }
                });
                const qty = pecaAtual?.quantidade || 1;

                const totalProcessos = results.reduce((sum, p) => sum + (p.valorCusto || 0), 0)
                await tx.peca.update({
                    where: { id: parseInt(id) },
                    data: { 
                        valorUnitario: totalProcessos,
                        custoTotal: totalProcessos * qty
                    }
                })

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
