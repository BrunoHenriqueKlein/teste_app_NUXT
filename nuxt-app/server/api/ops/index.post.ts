import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Validar dados obrigatórios
    if (!body.numeroOP || !body.codigoMaquina || !body.descricaoMaquina || 
        !body.dataPedido || !body.dataEntrega || !body.cliente) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dados obrigatórios não informados'
      })
    }
    
    // Verificar se número OP já existe
    const existingOP = await prisma.oP.findUnique({
      where: { numeroOP: body.numeroOP }
    })
    
    if (existingOP) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Número de OP já existe'
      })
    }
    
    // Criar OP
    const op = await prisma.oP.create({
      data: {
        ...body,
        criadoPorId: 1, // Em produção, pegar do usuário logado
        dataPedido: new Date(body.dataPedido),
        dataEntrega: new Date(body.dataEntrega)
      }
    })
    
    // Criar histórico
    await prisma.oPHistorico.create({
      data: {
        opId: op.id,
        usuarioId: 1, // Em produção, pegar do usuário logado
        acao: 'OP criada',
        detalhes: `Ordem de produção ${body.numeroOP} criada`
      }
    })
    
    return { success: true, op }
  } catch (error) {
    console.error('Erro ao criar OP:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao criar ordem de produção'
    })
  }
})