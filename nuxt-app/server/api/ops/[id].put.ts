import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID da OP não informado'
      })
    }
    
    // Verificar se OP existe
    const existingOP = await prisma.oP.findUnique({
      where: { id: parseInt(id) }
    })
    
    if (!existingOP) {
      throw createError({
        statusCode: 404,
        statusMessage: 'OP não encontrada'
      })
    }
    
    // Atualizar OP
    const op = await prisma.oP.update({
      where: { id: parseInt(id) },
      data: {
        numeroOP: body.numeroOP,
        codigoMaquina: body.codigoMaquina,
        descricaoMaquina: body.descricaoMaquina,
        dataPedido: new Date(body.dataPedido),
        dataEntrega: new Date(body.dataEntrega),
        cliente: body.cliente,
        cnpjCliente: body.cnpjCliente,
        enderecoCliente: body.enderecoCliente,
        observacoes: body.observacoes,
        status: body.status,
        responsavelId: body.responsavelId || null
      },
      include: {
        responsavel: {
          select: { name: true }
        }
      }
    })
    
    // Criar histórico
    await prisma.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: 1, // Em produção, pegar do usuário logado
        acao: 'OP atualizada',
        detalhes: `Ordem de produção ${body.numeroOP} atualizada`
      }
    })
    
    return { success: true, op }
  } catch (error: any) {
    console.error('Erro ao atualizar OP:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erro ao atualizar ordem de produção'
    })
  }
})