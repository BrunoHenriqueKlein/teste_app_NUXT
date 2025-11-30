export default defineEventHandler(async (event) => {
  try {
    const opId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    console.log('🎯 Aplicando template - OP ID:', opId)
    console.log('🎯 Template selecionado:', body.templateName)

    if (!opId) {
      throw createError({
        statusCode: 400,
        message: 'ID da OP não informado'
      })
    }

    if (!body.templateName) {
      throw createError({
        statusCode: 400,
        message: 'Nome do template não informado'
      })
    }

    // ✅ Agora deve funcionar com o plugin configurado
    const prisma = event.context.prisma

    if (!prisma) {
      throw createError({
        statusCode: 500,
        message: 'Prisma não configurado no contexto'
      })
    }

    console.log('✅ Prisma encontrado no contexto')

    // Templates
    const templates = {
      PADRAO_MAQUINA: [
        { nome: 'Lançamento da OP no Sistema', descricao: 'Registro inicial da Ordem de Produção no sistema', sequencia: 1, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Criação da Pasta do Projeto', descricao: 'Criação da estrutura de pastas para documentação do projeto', sequencia: 2, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Início do Projeto Mecânico', descricao: 'Início do desenvolvimento do projeto 3D no SolidWorks', sequencia: 3, prazoEstimado: 15, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Detalhamento das Peças', descricao: 'Criação dos desenhos técnicos e detalhamento de todas as peças', sequencia: 4, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Geração da Lista de Peças (BOM)', descricao: 'Exportação da planilha BOM do SolidWorks', sequencia: 5, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Importação da Lista de Peças', descricao: 'Upload e importação da planilha BOM no sistema', sequencia: 6, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Criação de Roteiros de Fabricação', descricao: 'Criação dos roteiros de pintura, zincagem e calibração', sequencia: 7, prazoEstimado: 3, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Solicitação de Orçamentos', descricao: 'Envio de e-mails para cotação de peças e serviços', sequencia: 8, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Solicitação de Compras', descricao: 'Emissão de ordens de compra baseadas nos orçamentos aprovados', sequencia: 9, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Recebimento de Materiais', descricao: 'Controle de recebimento e inspeção de materiais comprados', sequencia: 10, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Montagem do Equipamento', descricao: 'Montagem mecânica completa do equipamento', sequencia: 11, prazoEstimado: 15, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Projeto Elétrico e CLP', descricao: 'Desenvolvimento da parte elétrica e programação do CLP/IHM', sequencia: 12, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Testes do Equipamento', descricao: 'Testes funcionais e de qualidade do equipamento montado', sequencia: 13, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Documentação Técnica', descricao: 'Elaboração de manual técnico, fotos e vídeos', sequencia: 14, prazoEstimado: 5, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Embalagem e Expedição', descricao: 'Preparação para envio e expedição ao cliente', sequencia: 15, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 }
      ],
      SIMPLES: [
        { nome: 'Lançamento da OP', descricao: 'Registro inicial da OP', sequencia: 1, prazoEstimado: 1, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Projeto Mecânico', descricao: 'Desenvolvimento do projeto 3D', sequencia: 2, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Lista de Peças', descricao: 'Geração e importação do BOM', sequencia: 3, prazoEstimado: 2, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Compras', descricao: 'Solicitação e acompanhamento de compras', sequencia: 4, prazoEstimado: 7, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Montagem', descricao: 'Montagem do equipamento', sequencia: 5, prazoEstimado: 10, status: 'NAO_INICIADO', progresso: 0 },
        { nome: 'Testes e Entrega', descricao: 'Testes finais e expedição', sequencia: 6, prazoEstimado: 3, status: 'NAO_INICIADO', progresso: 0 }
      ]
    }

    const templateProcesses = templates[body.templateName] || templates.PADRAO_MAQUINA

    if (!templateProcesses) {
      throw createError({
        statusCode: 400,
        message: 'Template não encontrado'
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

    console.log('✅ OP encontrada:', opExistente.numeroOP)

    // Verificar processos existentes
    const processosExistentes = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { sequencia: true }
    })

    const sequenciasExistentes = processosExistentes.map(p => p.sequencia)
    const maiorSequencia = sequenciasExistentes.length > 0 ? Math.max(...sequenciasExistentes) : 0

    console.log(`📊 Processos existentes: ${processosExistentes.length}, Maior sequência: ${maiorSequencia}`)

    // Criar processos do template
    const processosCriados = []
    
    for (const [index, processo] of templateProcesses.entries()) {
      try {
        const novoProcesso = await prisma.oPProcesso.create({
          data: {
            opId: parseInt(opId),
            nome: processo.nome,
            descricao: processo.descricao,
            sequencia: maiorSequencia + index + 1,
            status: processo.status,
            progresso: processo.progresso,
            prazoEstimado: processo.prazoEstimado,
            dataPrevista: null
          }
        })
        processosCriados.push(novoProcesso)
        
        console.log(`✅ Processo criado: ${processo.nome} (ID: ${novoProcesso.id})`)
      } catch (processError) {
        console.error(`❌ Erro ao criar processo ${processo.nome}:`, processError)
        // Continuar com os próximos processos
      }
    }

    // Atualizar progresso da OP
    const todosProcessos = await prisma.oPProcesso.findMany({
      where: { opId: parseInt(opId) },
      select: { progresso: true }
    })

    const progressoMedio = todosProcessos.length > 0 
      ? Math.round(todosProcessos.reduce((sum, p) => sum + p.progresso, 0) / todosProcessos.length)
      : 0

    await prisma.oP.update({
      where: { id: parseInt(opId) },
      data: { progresso: progressoMedio }
    })

    console.log(`🎉 Template aplicado: ${processosCriados.length} processos criados`)

    return { 
      success: true, 
      processos: processosCriados,
      totalCriados: processosCriados.length,
      message: `Template aplicado com sucesso! ${processosCriados.length} processos criados.`
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao aplicar template:', error)
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao aplicar template'
    })
  }
})