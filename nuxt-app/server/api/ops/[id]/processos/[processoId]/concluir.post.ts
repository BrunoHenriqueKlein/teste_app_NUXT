import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const opId = getRouterParam(event, 'id')
        const processoId = getRouterParam(event, 'processoId')

        if (!opId || !processoId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'IDs inválidos'
            })
        }

        // Verificar se processo existe
        const existingProcesso = await prisma.oPProcesso.findFirst({
            where: {
                id: parseInt(processoId),
                opId: parseInt(opId)
            }
        })

        if (!existingProcesso) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Processo não encontrado'
            })
        }

        // Atualizar processo
        const processo = await prisma.oPProcesso.update({
            where: {
                id: parseInt(processoId)
            },
            data: {
                status: 'CONCLUIDO',
                progresso: 100,
                dataFim: new Date()
            }
        })

        // Atualizar progresso da OP
        const processosOP = await prisma.oPProcesso.findMany({
            where: { opId: parseInt(opId) },
            select: { progresso: true }
        })

        const progressoMedio = processosOP.length > 0
            ? Math.round(processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length)
            : 0

        await prisma.oP.update({
            where: { id: parseInt(opId) },
            data: { progresso: progressoMedio }
        })

        // Criar histórico
        await prisma.processoHistorico.create({
            data: {
                processoId: processo.id,
                usuarioId: 1, // TODO: Pegar do usuário logado
                acao: 'Processo concluído',
                detalhes: `Processo "${existingProcesso.nome}" concluído`
            }
        })

        return { success: true, processo }
    } catch (error: any) {
        console.error('Erro ao concluir processo:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Erro ao concluir processo'
        })
    }
})
