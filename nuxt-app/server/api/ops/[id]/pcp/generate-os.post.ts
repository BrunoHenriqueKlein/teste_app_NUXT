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
        console.log(`🏗️ Iniciando geração/sincronização de OS para OP ${opId}`)

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

        console.log(`🔍 Encontrados ${processosSemOS.length} processos sem OS para a OP ${opId}`)

        if (processosSemOS.length === 0) {
            return {
                success: true,
                message: 'Todos os processos já possuem OS ou não há novos processos para agrupar.',
                createdCount: 0,
                updatedCount: 0
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
        let updatedCount = 0

        // 3. Processar cada grupo
        for (const [tipo, itensGroup] of Object.entries(grupos)) {
            const itens = itensGroup as any[]
            // Verificar se já existe uma OS "Aberta" deste tipo para esta OP
            const osExistente = await prisma.ordemServico.findFirst({
                where: {
                    opId: parseInt(opId),
                    tipo: tipo as string,
                    status: { not: 'CONCLUIDO' }
                }
            })

            if (osExistente) {
                console.log(`📌 Sincronizando ${itens.length} itens com OS existente: ${osExistente.numero}`)
                await prisma.ordemServico.update({
                    where: { id: osExistente.id },
                    data: {
                        itens: {
                            connect: itens.map(p => ({ id: p.id }))
                        }
                    }
                })
                updatedCount++
            } else {
                const count = await prisma.ordemServico.count()
                const numero = `OS-${opId}-${tipo.substring(0, 3)}-${(count + 1).toString().padStart(3, '0')}`

                console.log(`🆕 Criando nova OS: ${numero}`)
                const novaOS = await prisma.ordemServico.create({
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
                createdOS.push(novaOS)
            }
        }

        return {
            success: true,
            createdCount: createdOS.length,
            updatedCount,
            message: `Processamento concluído. ${createdOS.length} novas OS criadas, ${updatedCount} OS existentes atualizadas.`
        }
    } catch (error: any) {
        console.error('❌ Erro ao gerar/sincronizar OS:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao processar Ordens de Serviço: ' + error.message
        })
    }
})
