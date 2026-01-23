import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const body = await readBody(event)

    // Validar dados obrigatórios
    if (!body.numeroOP || !body.descricaoMaquina || !body.cliente) {
      throw createError({
        statusCode: 400,
        message: 'Número da OP, descrição e cliente são obrigatórios'
      })
    }

    // Verificar se número da OP já existe
    const existingOP = await prisma.oP.findFirst({
      where: {
        numeroOP: body.numeroOP
      }
    })

    if (existingOP) {
      throw createError({
        statusCode: 400,
        message: 'Já existe uma OP com este número'
      })
    }

    // 🔥 SOLUÇÃO TEMPORÁRIA - Pegar o primeiro usuário do banco
    const primeiroUsuario = await prisma.user.findFirst({
      select: { id: true }
    })

    if (!primeiroUsuario) {
      throw createError({
        statusCode: 400,
        message: 'Nenhum usuário encontrado no sistema'
      })
    }

    // Criar OP com usuário válido e processos do template se houver
    const op = await prisma.$transaction(async (tx: any) => {
      const newOp = await tx.oP.create({
        data: {
          numeroOP: body.numeroOP,
          codigoMaquina: body.codigoMaquina,
          descricaoMaquina: body.descricaoMaquina,
          dataPedido: body.dataPedido ? new Date(body.dataPedido) : new Date(),
          dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : new Date(),
          cliente: body.cliente,
          cnpjCliente: body.cnpjCliente,
          enderecoCliente: body.enderecoCliente,
          observacoes: body.observacoes,
          status: body.status || 'ABERTA',
          progresso: (body.progresso ? parseInt(body.progresso) : 0) as number,
          criadoPorId: primeiroUsuario.id
        },
        include: {
          criadoPor: { select: { id: true, name: true, email: true } }
        }
      })

      // Se houver template, carregar processos e criar na OP
      if (body.templateId) {
        const template = await tx.configTemplateOP.findUnique({
          where: { id: parseInt(body.templateId) },
          include: { processos: { include: { processo: true }, orderBy: { sequencia: 'asc' } } }
        })

        if (template && template.processos.length > 0) {
          await tx.oPProcesso.createMany({
            data: template.processos.map((tp: any) => ({
              opId: newOp.id,
              nome: tp.processo.nome,
              status: 'PENDENTE'
            }))
          })
        }
      }

      return newOp
    })

    // Criar histórico
    await prisma.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: primeiroUsuario.id,
        acao: 'OP criada',
        detalhes: `OP ${body.numeroOP} criada no sistema`
      }
    })

    return { success: true, op }
  } catch (error: any) {
    console.error('Erro ao criar OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Erro ao criar OP'
    })
  }
})