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

    // ✅ CORREÇÃO: Usar OPProcesso
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

    // ✅ CORREÇÃO: Preparar dados para OPProcesso
    const updateData = {
      nome: body.nome?.trim(),
      descricao: body.descricao?.trim() || null,
      sequencia: body.sequencia ? parseInt(body.sequencia) : existingProcesso.sequencia,
      status: body.status || existingProcesso.status,
      progresso: body.progresso ? parseInt(body.progresso) : existingProcesso.progresso,
      prazoEstimado: body.prazoEstimado ? parseInt(body.prazoEstimado) : null,
      responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null
    }

    // ✅ CORREÇÃO: Tratamento de datas
    if (body.dataPrevista !== undefined) {
      if (body.dataPrevista === null || body.dataPrevista === '') {
        updateData.dataPrevista = null
      } else {
        if (typeof body.dataPrevista === 'string' && body.dataPrevista.includes('T')) {
          updateData.dataPrevista = new Date(body.dataPrevista)
        } else {
          updateData.dataPrevista = new Date(body.dataPrevista + 'T00:00:00.000Z')
        }
      }
    }

    console.log('📝 DEBUG - Dados para atualização:', updateData)

    // ✅ CORREÇÃO: Atualizar OPProcesso
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
            descricaoMaquina: true
          }
        }
      }
    })

    // ✅ CORREÇÃO: Atualizar progresso da OP
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

    // ✅ CORREÇÃO: Criar histórico usando ProcessoHistorico
    try {
      await prisma.processoHistorico.create({
        data: {
          processoId: processo.id,
          usuarioId: 1,
          acao: 'Processo atualizado',
          detalhes: `Processo "${body.nome}" atualizado - Status: ${body.status || existingProcesso.status}`
        }
      })
      console.log('📖 Histórico criado para processo:', processo.id)
    } catch (historyError) {
      console.log('ℹ️ Tabela de histórico não disponível, continuando...')
    }

    console.log('✅ Processo atualizado com sucesso:', processo.id)
    
    return { 
      success: true, 
      processo,
      message: 'Processo atualizado com sucesso'
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar processo:', error)
    
    let errorMessage = error.message || 'Erro ao atualizar processo'
    let statusCode = error.statusCode || 500
    
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