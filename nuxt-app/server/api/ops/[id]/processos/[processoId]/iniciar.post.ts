import { defineEventHandler, createError, getRouterParam } from 'h3'
import { PrismaClient } from '@prisma/client'
import { updateOPStatus } from '../../../../../utils/opStatus'

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
        const now = new Date()
        const processo = await prisma.oPProcesso.update({
            where: {
                id: parseInt(processoId)
            },
            data: {
                status: 'EM_ANDAMENTO',
                dataInicio: now,
                progresso: existingProcesso.progresso > 0 ? existingProcesso.progresso : 10
            }
        })

        // Atualizar OP (Status e Progresso) de forma inteligente
        await updateOPStatus(parseInt(opId))

        // Criar histórico
        await prisma.processoHistorico.create({
            data: {
                processoId: processo.id,
                usuarioId: 1, // TODO: Pegar do usuário logado
                acao: 'Processo iniciado',
                detalhes: `Processo "${existingProcesso.nome}" iniciado`
            }
        })

        return { success: true, processo }
    } catch (error: any) {
        console.error('Erro ao iniciar processo:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Erro ao iniciar processo'
        })
    }
})
