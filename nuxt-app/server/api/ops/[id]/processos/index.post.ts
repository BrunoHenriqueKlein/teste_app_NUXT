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

    // ✅ VALIDAÇÃO MELHORADA
    const errors = []

    if (!body.nome || body.nome.trim() === '') {
      errors.push('Nome é obrigatório')
    }

    if (!body.sequencia) {
      errors.push('Sequência é obrigatória')
    } else if (isNaN(parseInt(body.sequencia)) || parseInt(body.sequencia) <= 0) {
      errors.push('Sequência deve ser um número positivo')
    }

    if (!body.prazoEstimado) {
      errors.push('Prazo estimado é obrigatório')
    } else if (isNaN(parseInt(body.prazoEstimado)) || parseInt(body.prazoEstimado) <= 0) {
      errors.push('Prazo estimado deve ser um número positivo')
    }

    if (errors.length > 0) {
      throw createError({
        statusCode: 400,
        message: errors.join(', ')
      })
    }

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

    // ✅ FUNÇÃO AUXILIAR PARA CONVERTER DATAS
    const parseDate = (dateValue: any): Date | null => {
      if (!dateValue || dateValue === '' || dateValue === null) {
        return null
      }

      try {
        let dateStr = dateValue
        if (typeof dateStr === 'string' && !dateStr.includes('T')) {
          dateStr = dateStr + 'T00:00:00.000Z'
        }
        const date = new Date(dateStr)

        // Verificar se a data é válida
        if (isNaN(date.getTime())) {
          console.warn(`⚠️ Data inválida: ${dateValue}`)
          return null
        }

        return date
      } catch (error) {
        console.warn(`⚠️ Erro ao converter data: ${dateValue}`, error)
        return null
      }
    }

    // ✅ TRATAMENTO DE DATAS - TODOS OS CAMPOS
    const dataPrevista = parseDate(body.dataPrevista)
    const dataInicioPrevista = parseDate(body.dataInicioPrevista)
    const dataTerminoPrevista = parseDate(body.dataTerminoPrevista)
    const dataInicio = parseDate(body.dataInicio)
    const dataFim = parseDate(body.dataFim)

    // ✅ CÁLCULO AUTOMÁTICO DE DATAS SE NÃO FORNECIDAS
    let dataInicioCalculada = dataInicioPrevista
    let dataTerminoCalculada = dataTerminoPrevista

    // Se não tem dataInicioPrevista, tentar calcular
    if (!dataInicioCalculada) {
      if (dataPrevista) {
        // Usar dataPrevista como fallback
        dataInicioCalculada = dataPrevista
      } else {
        // Tentar buscar a data de início da OP (Prioridade: Prevista > Pedido)
        dataInicioCalculada = opExistente.dataInicioPrevista || opExistente.dataPedido || null
      }
    }

    // Se tem dataInicioPrevista mas não tem dataTerminoPrevista, calcular baseado no prazo
    if (dataInicioCalculada && !dataTerminoCalculada && body.prazoEstimado) {
      const prazo = parseInt(body.prazoEstimado)
      if (prazo > 0) {
        const terminoDate = new Date(dataInicioCalculada)
        terminoDate.setDate(terminoDate.getDate() + prazo - 1)
        dataTerminoCalculada = terminoDate
      }
    }

    // ✅ DADOS DO PROCESSO COM TODOS OS CAMPOS
    const processoData = {
      opId: parseInt(opId),
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || null,
      sequencia: sequencia,
      status: body.status || 'NAO_INICIADO',
      progresso: parseInt(body.progresso) || 0,
      prazoEstimado: body.prazoEstimado ? parseInt(body.prazoEstimado) : null,

      // ✅ DATAS PREVISTAS (CÁLCULO EM CASCATA)
      dataInicioPrevista: dataInicioCalculada,
      dataTerminoPrevista: dataTerminoCalculada,

      // ✅ DATAS REAIS (se fornecidas)
      dataInicio: dataInicio,
      dataFim: dataFim,

      // ✅ DATAS DE COMPATIBILIDADE (campo antigo)
      dataPrevista: dataPrevista || dataInicioCalculada,

      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null,
      vinculoStatusOP: body.vinculoStatusOP || null
    }

    console.log('📝 DEBUG - Dados do processo a ser criado:', {
      ...processoData,
      dataInicioPrevista: processoData.dataInicioPrevista?.toISOString(),
      dataTerminoPrevista: processoData.dataTerminoPrevista?.toISOString(),
      dataPrevista: processoData.dataPrevista?.toISOString()
    })

    // ✅ CRIAR PROCESSO
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
            descricaoMaquina: true,
            dataInicio: true
          }
        }
      }
    })

    // ✅ ATUALIZAR PROGRESSO DA OP
    const processosOP = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    })

    const progressoMedio = processosOP.length > 0
      ? Math.round(processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length)
      : 0

    const updateData: any = { progresso: progressoMedio }

    // ✅ ATUALIZAR DATA INICIAL DA OP SE ENVIADO (Mudança no planejamento global)
    if (body.dataInicioOPPrevista) {
      updateData.dataInicioPrevista = new Date(body.dataInicioOPPrevista)
    }

    await prisma.oP.update({
      where: { id: parseInt(opId) },
      data: updateData
    })

    console.log('📊 Progresso da OP atualizado para:', progressoMedio + '%')

    // ✅ CRIAR HISTÓRICO
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1, // TODO: Substituir pelo ID do usuário logado
          acao: 'Processo criado',
          detalhes: `Processo "${body.nome}" criado na OP ${opExistente.numeroOP}`
        }
      })
      console.log('📖 Histórico criado para processo:', processo.id)
    } catch (historyError) {
      console.log('ℹ️ Tabela de histórico não disponível, continuando...')
    }

    console.log('✅ Processo criado com sucesso:', {
      id: processo.id,
      nome: processo.nome,
      dataInicioPrevista: processo.dataInicioPrevista?.toISOString(),
      dataTerminoPrevista: processo.dataTerminoPrevista?.toISOString()
    })

    return {
      success: true,
      processo,
      message: 'Processo criado com sucesso'
    }

  } catch (error: any) {
    console.error('❌ Erro ao criar processo:', error)

    let errorMessage = error.message || 'Erro ao criar processo'
    let statusCode = error.statusCode || 500

    // ✅ TRATAMENTO DE ERROS ESPECÍFICOS DO PRISMA
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('sequencia')) {
        errorMessage = 'Já existe um processo com esta sequência'
      } else {
        errorMessage = 'Já existe um processo com estes dados'
      }
      statusCode = 400
    } else if (error.code === 'P2003') {
      errorMessage = 'Responsável não encontrado'
      statusCode = 400
    } else if (error.code === 'P2025') {
      errorMessage = 'Registro relacionado não encontrado'
      statusCode = 404
    }

    throw createError({
      statusCode: statusCode,
      message: errorMessage
    })
  }
})