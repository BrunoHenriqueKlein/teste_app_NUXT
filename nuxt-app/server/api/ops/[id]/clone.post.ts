import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
      throw createError({ statusCode: 400, message: 'ID da OP não fornecido' })
    }

    const body = await readBody(event)
    const { novoNumeroOP } = body

    if (!novoNumeroOP) {
      throw createError({
        statusCode: 400,
        message: 'O novo número da OP é obrigatório'
      })
    }

    // Verificar se a nova OP já existe
    const existingOP = await prisma.oP.findUnique({
      where: { numeroOP: novoNumeroOP }
    })

    if (existingOP) {
      throw createError({
        statusCode: 400,
        message: `Já existe uma OP com o número ${novoNumeroOP}`
      })
    }

    // Buscar a OP original completa
    const opOriginal = await prisma.oP.findUnique({
      where: { id: parseInt(opId) },
      include: {
        processos: true,
        pecas: {
          include: {
            processos: true
          }
        }
      }
    })

    if (!opOriginal) {
      throw createError({ statusCode: 404, message: 'OP original não encontrada' })
    }

    const usuarioId = (event.context.user as any)?.id || 1 // Fallback para 1

    // Transação para clonagem
    const novaOP = await prisma.$transaction(async (tx: any) => {
      // 1. Criar a Nova OP baseada na antiga
      const createdOp = await tx.oP.create({
        data: {
          numeroOP: novoNumeroOP,
          codigoMaquina: opOriginal.codigoMaquina,
          descricaoMaquina: opOriginal.descricaoMaquina,
          cliente: opOriginal.cliente,
          cnpjCliente: opOriginal.cnpjCliente,
          enderecoCliente: opOriginal.enderecoCliente,
          observacoes: `Clonada da OP ${opOriginal.numeroOP}. ${opOriginal.observacoes || ''}`.substring(0, 500),
          dataPedido: new Date(),
          dataEntrega: new Date(), // Requer ajuste posterior pelo PCP
          dataInicioPrevista: new Date(),
          orcamentoPrevisto: opOriginal.orcamentoPrevisto,
          valorVenda: opOriginal.valorVenda,
          status: 'AGUARDANDO',
          progresso: 0,
          criadoPorId: usuarioId
        }
      })

      // 2. Copiar Processos
      if (opOriginal.processos && opOriginal.processos.length > 0) {
        let dataInicioAtual = new Date(createdOp.dataPedido)
        dataInicioAtual.setHours(0, 0, 0, 0)

        for (const p of opOriginal.processos) {
          const prazo = p.prazoEstimado || 1

          const dataInicioPrevista = new Date(dataInicioAtual)
          const dataTerminoPrevista = new Date(dataInicioPrevista)
          dataTerminoPrevista.setDate(dataTerminoPrevista.getDate() + prazo - 1)
          dataTerminoPrevista.setHours(0, 0, 0, 0)

          await tx.oPProcesso.create({
            data: {
              opId: createdOp.id,
              nome: p.nome,
              descricao: p.descricao,
              sequencia: p.sequencia,
              status: 'NAO_INICIADO',
              progresso: 0,
              prazoEstimado: prazo,
              dataInicioPrevista: dataInicioPrevista,
              dataTerminoPrevista: dataTerminoPrevista,
              responsavelId: p.responsavelId,
              vinculoStatusOP: p.vinculoStatusOP
            }
          })

          dataInicioAtual = new Date(dataTerminoPrevista)
          dataInicioAtual.setHours(0, 0, 0, 0)
        }
      }

      // 3. Copiar Peças (BOM)
      if (opOriginal.pecas && opOriginal.pecas.length > 0) {
        for (const peca of opOriginal.pecas) {
          await tx.peca.create({
            data: {
              opId: createdOp.id,
              codigo: peca.codigo,
              descricao: peca.descricao,
              quantidade: peca.quantidade,
              material: peca.material,
              categoria: peca.categoria,
              subcategoria: peca.subcategoria,
              subconjunto: peca.subconjunto,
              status: 'NAO_INICIADA',
              statusSuprimento: 'NAO_SOLICITADO',
              valorUnitario: null,
              custoTotal: null,
              fornecedorId: null,
              arquivoBOM: peca.arquivoBOM,
              processos: peca.processos && peca.processos.length > 0 ? {
                create: peca.processos.map((p: any) => ({
                  nome: p.nome,
                  sequencia: p.sequencia,
                  tempoEstimado: p.tempoEstimado,
                  status: 'NAO_INICIADO'
                }))
              } : undefined
            }
          })
        }
      }

      return createdOp
    })

    // 4. Registrar no histórico da nova OP
    await prisma.oPHistorico.create({
      data: {
        opId: novaOP.id,
        usuarioId: usuarioId,
        acao: 'OP Clonada',
        detalhes: `OP criada através da clonagem da OP ${opOriginal.numeroOP}`
      }
    })

    return {
      success: true,
      message: 'Ordem de Produção clonada com sucesso',
      op: novaOP
    }

  } catch (error: any) {
    console.error('Erro ao clonar OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao clonar a OP. Tente novamente.'
    })
  }
})
