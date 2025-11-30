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

    const prisma = event.context.prisma

    // Verificar se a OP existe - CORREÇÃO: modelo OP (não oP)
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

    // ✅ CORREÇÃO: Usar OPProcesso (não oPProcesso)
    const sequencia = parseInt(body.sequencia)

    // Verificar se a sequência já existe
    const existingProcesso = await prisma.oPProcesso.findFirst({
      where: {
        opId: parseInt(opId),
        sequencia: sequencia
      }
    })

    if (existingProcesso) {
      throw createError({
        statusCode: 400,
        message: 'Já existe um processo com esta sequência'
      })
    }

    // ✅ CORREÇÃO: Tratamento de datas para OPProcesso
    let dataPrevista = null
    if (body.dataPrevista) {
      if (typeof body.dataPrevista === 'string' && body.dataPrevista.includes('T')) {
        dataPrevista = new Date(body.dataPrevista)
      } else {
        dataPrevista = new Date(body.dataPrevista + 'T00:00:00.000Z')
      }
    }

    // Criar processo - CORREÇÃO: modelo OPProcesso
    const processoData = {
      opId: parseInt(opId),
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || null,
      sequencia: sequencia,
      status: body.status || 'NAO_INICIADO',
      progresso: parseInt(body.progresso) || 0,
      prazoEstimado: body.prazoEstimado ? parseInt(body.prazoEstimado) : null,
      dataPrevista: dataPrevista,
      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null
    }

    console.log('📝 DEBUG - Dados do processo a ser criado:', processoData)

    const processo = await prisma.oPProcesso.create({
      data: processoData,
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

    // ✅ CORREÇÃO: Atualizar progresso da OP
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

    // ✅ CORREÇÃO: Criar histórico usando ProcessoHistorico
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1, // Em produção, pegar do usuário logado
          acao: 'Processo criado',
          detalhes: `Processo "${body.nome}" criado na OP ${opExistente.numeroOP}`
        }
      })
    } catch (historyError) {
      console.log('ℹ️ Tabela de histórico não disponível, continuando...')
    }

    console.log('✅ Processo criado com sucesso:', processo.id)
    
    return { 
      success: true, 
      processo,
      message: 'Processo criado com sucesso'
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao criar processo:', error)
    
    let errorMessage = error.message || 'Erro ao criar processo'
    let statusCode = error.statusCode || 500
    
    if (error.code === 'P2002') {
      errorMessage = 'Já existe um processo com estes dados'
      statusCode = 400
    } else if (error.code === 'P2003') {
      errorMessage = 'Responsável não encontrado'
      statusCode = 400
    }
    
    throw createError({
      statusCode: statusCode,
      message: errorMessage
    })
  }
})