export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const processoId = getRouterParam(event, 'processoId')
    const body = await readBody(event)
    
    console.log('✏️ DEBUG - Editando processo:', { opId, processoId, body })

    if (!opId || !processoId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'IDs não informados'
      })
    }

    const prisma = event.context.prisma

    // Verificar se o processo existe
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

    // ✅ VERIFICAR SEQUÊNCIA DUPLICADA (excluindo o próprio processo)
    if (body.sequencia !== undefined) {
      const novaSequencia = parseInt(body.sequencia)
      const sequenciaExistente = await prisma.oPProcesso.findFirst({
        where: {
          opId: parseInt(opId),
          sequencia: novaSequencia,
          id: {
            not: parseInt(processoId)
          }
        }
      })

      if (sequenciaExistente) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Já existe um processo com esta sequência'
        })
      }
    }

    // ✅ PREPARAR DADOS PARA ATUALIZAÇÃO
    const updateData: any = {
      nome: body.nome?.trim() || existingProcesso.nome,
      descricao: body.descricao?.trim() || null,
      status: body.status || existingProcesso.status,
      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null
    }

    // ✅ TRATAMENTO DE NÚMEROS
    if (body.sequencia !== undefined) {
      updateData.sequencia = parseInt(body.sequencia)
    }
    
    if (body.progresso !== undefined) {
      updateData.progresso = parseInt(body.progresso)
    }
    
    if (body.prazoEstimado !== undefined) {
      updateData.prazoEstimado = body.prazoEstimado !== null ? parseInt(body.prazoEstimado) : null
    }

    // ✅ TRATAMENTO DE DATAS - CAMPO ANTIGO (para compatibilidade)
    if (body.dataPrevista !== undefined) {
      if (body.dataPrevista === null || body.dataPrevista === '') {
        updateData.dataPrevista = null
      } else {
        try {
          const dateStr = typeof body.dataPrevista === 'string' && !body.dataPrevista.includes('T') 
            ? body.dataPrevista + 'T00:00:00.000Z'
            : body.dataPrevista
          updateData.dataPrevista = new Date(dateStr)
        } catch (error) {
          console.warn('⚠️ Erro ao converter dataPrevista:', error)
        }
      }
    }

    // ✅ TRATAMENTO DE DATAS - NOVOS CAMPOS
    // dataInicioPrevista
    if (body.dataInicioPrevista !== undefined) {
      if (body.dataInicioPrevista === null || body.dataInicioPrevista === '') {
        updateData.dataInicioPrevista = null
      } else {
        try {
          const dateStr = typeof body.dataInicioPrevista === 'string' && !body.dataInicioPrevista.includes('T')
            ? body.dataInicioPrevista + 'T00:00:00.000Z'
            : body.dataInicioPrevista
          updateData.dataInicioPrevista = new Date(dateStr)
        } catch (error) {
          console.warn('⚠️ Erro ao converter dataInicioPrevista:', error)
        }
      }
    }

    // dataTerminoPrevista
    if (body.dataTerminoPrevista !== undefined) {
      if (body.dataTerminoPrevista === null || body.dataTerminoPrevista === '') {
        updateData.dataTerminoPrevista = null
      } else {
        try {
          const dateStr = typeof body.dataTerminoPrevista === 'string' && !body.dataTerminoPrevista.includes('T')
            ? body.dataTerminoPrevista + 'T00:00:00.000Z'
            : body.dataTerminoPrevista
          updateData.dataTerminoPrevista = new Date(dateStr)
        } catch (error) {
          console.warn('⚠️ Erro ao converter dataTerminoPrevista:', error)
        }
      }
    }

    // ✅ TRATAMENTO DE DATAS REAIS (se necessário)
    if (body.dataInicio !== undefined) {
      if (body.dataInicio === null || body.dataInicio === '') {
        updateData.dataInicio = null
      } else {
        try {
          const dateStr = typeof body.dataInicio === 'string' && !body.dataInicio.includes('T')
            ? body.dataInicio + 'T00:00:00.000Z'
            : body.dataInicio
          updateData.dataInicio = new Date(dateStr)
        } catch (error) {
          console.warn('⚠️ Erro ao converter dataInicio:', error)
        }
      }
    }

    if (body.dataFim !== undefined) {
      if (body.dataFim === null || body.dataFim === '') {
        updateData.dataFim = null
      } else {
        try {
          const dateStr = typeof body.dataFim === 'string' && !body.dataFim.includes('T')
            ? body.dataFim + 'T00:00:00.000Z'
            : body.dataFim
          updateData.dataFim = new Date(dateStr)
        } catch (error) {
          console.warn('⚠️ Erro ao converter dataFim:', error)
        }
      }
    }

    console.log('📝 DEBUG - Dados para atualização:', updateData)

    // ✅ ATUALIZAR PROCESSO
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
    try {
      const processosOP = await prisma.oPProcesso.findMany({
        where: { opId: parseInt(opId) },
        select: { progresso: true }
      })

      if (processosOP.length > 0) {
        const progressoMedio = Math.round(
          processosOP.reduce((sum, p) => sum + p.progresso, 0) / processosOP.length
        )

        await prisma.oP.update({
          where: { id: parseInt(opId) },
          data: { progresso: progressoMedio }
        })

        console.log('📊 Progresso da OP atualizado para:', progressoMedio + '%')
      }
    } catch (progressError) {
      console.log('⚠️ Não foi possível atualizar progresso da OP:', progressError)
    }

    // ✅ CRIAR HISTÓRICO
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1, // TODO: Substituir pelo ID do usuário logado
          acao: 'Processo atualizado',
          detalhes: `Processo "${body.nome || existingProcesso.nome}" atualizado - Status: ${body.status || existingProcesso.status}`
        }
      })
      console.log('📖 Histórico criado para processo:', processo.id)
    } catch (historyError) {
      console.log('ℹ️ Tabela de histórico não disponível, continuando...')
    }

    console.log('✅ Processo atualizado com sucesso:', {
      id: processo.id,
      nome: processo.nome,
      dataInicioPrevista: processo.dataInicioPrevista,
      dataTerminoPrevista: processo.dataTerminoPrevista
    })
    
    return { 
      success: true, 
      processo,
      message: 'Processo atualizado com sucesso'
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar processo:', error)
    
    let errorMessage = error.message || 'Erro ao atualizar processo'
    let statusCode = error.statusCode || 500
    
    // Tratamento de erros específicos do Prisma
    if (error.code === 'P2025') {
      errorMessage = 'Processo não encontrado'
      statusCode = 404
    } else if (error.code === 'P2002') {
      errorMessage = 'Já existe um processo com esta sequência'
      statusCode = 400
    } else if (error.code === 'P2003') {
      errorMessage = 'Responsável não encontrado'
      statusCode = 400
    }
    
    throw createError({
      statusCode: statusCode,
      statusMessage: errorMessage
    })
  }
})