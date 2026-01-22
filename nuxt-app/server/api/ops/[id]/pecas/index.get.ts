import { defineEventHandler, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
        })
    }

    const prisma = event.context.prisma

    try {
        const pecas = await prisma.peca.findMany({
            where: { opId: parseInt(opId) },
            include: {
                processos: true,
                anexos: true,
                _count: {
                    select: { processos: true }
                }
            },
            orderBy: { codigo: 'asc' }
        })

        // 2. Buscar saldos de estoque para os códigos dessas peças
        const codigos = pecas.map((p: any) => p.codigo)
        const estoques = await prisma.estoque.findMany({
            where: { codigo: { in: codigos } }
        })

        // 3. Cruzar dados
        const pecasComEstoque = pecas.map((peca: any) => {
            const itemEstoque = estoques.find((e: any) => e.codigo === peca.codigo)
            return {
                ...peca,
                temNoEstoque: !!itemEstoque && itemEstoque.quantidade > 0,
                saldoEstoque: itemEstoque ? itemEstoque.quantidade : 0
            }
        })

        return pecasComEstoque
    } catch (error) {
        console.error('❌ Erro ao buscar peças:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar peças da OP'
        })
    }
})
