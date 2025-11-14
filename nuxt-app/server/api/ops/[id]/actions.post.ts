import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId')
    const body = await readBody(event)
    
    if (!opId || !processoId || !body.acao) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dados incompletos'
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

    let updateData: any = {}
    let acaoHistorico = ''
    let detalhesHistorico = ''

    switch (body.acao) {
      case 'INICIAR':
        updateData = {
          status: 'EM_ANDAMENTO',
          dataInicio: new Date(),
          progresso: 10
        }
        acaoHistorico = 'Processo iniciado'
        detalhesHistorico = `Processo "${existingProcesso.nome}" iniciado`
        break

      case 'PAUSAR':
        updateData = {
          status: 'AGUARDANDO'
        }
        acaoHistorico = 'Processo pausado'
        detalhesHistorico = `Processo "${existingProcesso.nome}" pausado`
        break

      case 'CONCLUIR':
        updateData = {
          status: 'CONCLUIDO',
          progresso: 100,
          dataFim: new Date()
        }
        acaoHistorico = 'Processo concluído'
        detalhesHistorico = `Processo "${existingProcesso.nome}" concluído`
        break

      case 'REABRIR':
        updateData = {
          status: 'EM_ANDAMENTO',
          dataFim: null
        }
        acaoHistorico = 'Processo reaberto'
        detalhesHistorico = `Processo "${existingProcesso.nome}" reaberto`
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Ação não reconhecida'
        })
    }

    // Atualizar processo
    const processo = await prisma.oPProcesso.update({
      where: {
        id: parseInt(processoId)
      },
      data: updateData,
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
        acao: acaoHistorico,
        detalhes: detalhesHistorico
      }
    })

    return { success: true, processo }
  } catch (error: any) {
    console.error('Erro na ação do processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro na ação do processo'
    })
  }
})