import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import { PrismaClient } from '@prisma/client'
import { updateOPStatus } from '../../../../../utils/opStatus'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId') // Será capturado da URL
    const body = await readBody(event)

    console.log('🔧 DEBUG - Atualizando processo:', { opId, processoId, body })

    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP ou ID do processo não informado'
      })
    }

    // Verificar se o processo existe e pertence à OP
    const processoExistente = await prisma.oPProcesso.findFirst({
      where: {
        id: parseInt(processoId),
        opId: parseInt(opId)
      }
    })

    if (!processoExistente) {
      throw createError({
        statusCode: 404,
        message: 'Processo não encontrado nesta OP'
      })
    }

    // Validar dados obrigatórios
    if (!body.nome || !body.sequencia) {
      throw createError({
        statusCode: 400,
        message: 'Nome e sequência são obrigatórios'
      })
    }

    // Verificar se a sequência já existe (excluindo o próprio processo)
    const sequenciaExistente = await prisma.oPProcesso.findFirst({
      where: {
        opId: parseInt(opId),
        sequencia: body.sequencia,
        id: {
          not: parseInt(processoId)
        }
      }
    })

    if (sequenciaExistente) {
      throw createError({
        statusCode: 400,
        message: 'Já existe um processo com esta sequência'
      })
    }

    // Atualizar processo
    const processo = await prisma.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        sequencia: body.sequencia,
        status: body.status || processoExistente.status,
        progresso: body.progresso !== undefined ? body.progresso : processoExistente.progresso,
        prazoEstimado: body.prazoEstimado,
        dataPrevista: body.dataPrevista ? new Date(body.dataPrevista) : null,
        dataInicioPrevista: body.dataInicioPrevista ? new Date(body.dataInicioPrevista) : null,
        dataTerminoPrevista: body.dataTerminoPrevista ? new Date(body.dataTerminoPrevista) : null,
        responsavelId: body.responsavelId
      },
      include: {
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Criar histórico
    await prisma.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1, // Em produção, pegar do usuário logado
        acao: 'Processo atualizado',
        detalhes: `Processo "${body.nome}" atualizado na OP ${opId}`
      }
    })

    // Atualizar OP (Status e Progresso) de forma inteligente
    await updateOPStatus(parseInt(opId))

    // ✅ ATUALIZAR DATA INICIAL DA OP SE ENVIADO (Mudança no planejamento global)
    if (body.dataInicioOPPrevista) {
      await prisma.oP.update({
        where: { id: parseInt(opId) },
        data: { dataInicioPrevista: new Date(body.dataInicioOPPrevista) }
      })
    }

    console.log('✅ Processo atualizado com sucesso')
    return { success: true, processo }
  } catch (error: any) {
    console.error('Erro ao atualizar processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao atualizar processo'
    })
  }
})