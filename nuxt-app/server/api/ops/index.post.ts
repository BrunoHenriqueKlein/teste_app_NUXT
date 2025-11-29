import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
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

    // Criar OP com usuário válido
    const op = await prisma.oP.create({
      data: {
        numeroOP: body.numeroOP,
        codigoMaquina: body.codigoMaquina,
        descricaoMaquina: body.descricaoMaquina,
        dataPedido: body.dataPedido ? new Date(body.dataPedido) : null,
        dataEntrega: body.dataEntrega ? new Date(body.dataEntrega) : null,
        cliente: body.cliente,
        cnpjCliente: body.cnpjCliente,
        enderecoCliente: body.enderecoCliente,
        observacoes: body.observacoes,
        status: body.status || 'ABERTA',
        progresso: body.progresso || 0,
        criadoPorId: primeiroUsuario.id // ✅ Usar usuário válido
      },
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
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