import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    console.log('🆕 DEBUG - Criando processo:', { opId, body })
    
    if (!opId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP não informado'
      })
    }

    // Verificar se a OP existe
    const opExistente = await prisma.oP.findUnique({
      where: {
        id: parseInt(opId)
      }
    })

    if (!opExistente) {
      throw createError({
        statusCode: 404,
        message: 'OP não encontrada'
      })
    }

    // Validar dados obrigatórios
    if (!body.nome || !body.sequencia) {
      throw createError({
        statusCode: 400,
        message: 'Nome e sequência são obrigatórios'
      })
    }

    // Verificar se a sequência já existe
    const existingProcesso = await prisma.oPProcesso.findFirst({
      where: {
        opId: parseInt(opId),
        sequencia: body.sequencia
      }
    })

    if (existingProcesso) {
      throw createError({
        statusCode: 400,
        message: 'Já existe um processo com esta sequência'
      })
    }

    // Criar processo
    const processo = await prisma.oPProcesso.create({
      data: {
        opId: parseInt(opId),
        nome: body.nome,
        descricao: body.descricao,
        sequencia: body.sequencia,
        status: body.status || 'NAO_INICIADO',
        progresso: body.progresso || 0,
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
        },
        op: {
          select: {
            id: true,
            numeroOP: true,
            descricaoMaquina: true
          }
        }
      }
    })

    // Criar histórico
    await prisma.processoHistorico.create({
      data: {
        processoId: processo.id,
        usuarioId: 1, // Em produção, pegar do usuário logado
        acao: 'Processo criado',
        detalhes: `Processo "${body.nome}" criado na OP ${opExistente.numeroOP}`
      }
    })

    console.log('✅ Processo criado com sucesso:', processo.id)
    return { success: true, processo }
  } catch (error: any) {
    console.error('Erro ao criar processo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao criar processo'
    })
  }
})