import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId')
    const body = await readBody(event)
    
    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs não informados'
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
        nome: body.nome,
        descricao: body.descricao,
        sequencia: body.sequencia,
        status: body.status,
        progresso: body.progresso,
        prazoEstimado: body.prazoEstimado,
        dataPrevista: body.dataPrevista ? new Date(body.dataPrevista) : null,
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
        detalhes: `Processo "${body.nome}" atualizado`
      }
    })

    return { success: true, processo }
  } catch (error: any) {
    console.error('Erro ao atualizar processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro ao atualizar processo'
    })
  }
})