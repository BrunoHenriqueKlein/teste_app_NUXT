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
                status: 'AGUARDANDO'
            }
        })

        // Criar histórico
        await prisma.processoHistorico.create({
            data: {
                processoId: processo.id,
                usuarioId: 1, // TODO: Pegar do usuário logado
                acao: 'Processo pausado',
                detalhes: `Processo "${existingProcesso.nome}" pausado`
            }
        })

        return { success: true, processo }
    } catch (error: any) {
        console.error('Erro ao pausar processo:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Erro ao pausar processo'
        })
    }
})
