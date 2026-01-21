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
        // 1. Buscar todos os processos de peças desta OP que ainda não têm OS
        const processosSemOS = await prisma.processoPeca.findMany({
            where: {
                peca: { opId: parseInt(opId) },
                osId: null
            },
            include: {
                peca: true
            }
        })

        if (processosSemOS.length === 0) {
            return {
                success: true,
                message: 'Todos os processos já possuem OS ou não há processos cadastrados.',
                createdCount: 0
            }
        }

        // 2. Agrupar por nome do processo (Tipo da OS)
        const grupos = processosSemOS.reduce((acc: any, proc: any) => {
            const nome = proc.nome.toUpperCase().trim()
            if (!acc[nome]) acc[nome] = []
            acc[nome].push(proc)
            return acc
        }, {})

        const createdOS = []

        // 3. Criar uma OS para cada grupo
        for (const [tipo, itens] of Object.entries(grupos)) {
            const count = await prisma.ordemServico.count()
            const numero = `OS-${opId}-${tipo.substring(0, 3)}-${(count + 1).toString().padStart(3, '0')}`

            const os = await prisma.ordemServico.create({
                data: {
                    numero,
                    tipo: tipo as string,
                    opId: parseInt(opId),
                    status: 'NAO_INICIADO',
                    itens: {
                        connect: (itens as any[]).map(p => ({ id: p.id }))
                    }
                }
            })
            createdOS.push(os)
        }

        return {
            success: true,
            createdCount: createdOS.length,
            orders: createdOS
        }
    } catch (error: any) {
        console.error('❌ Erro ao gerar OS:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao gerar Ordens de Serviço: ' + error.message
        })
    }
})
