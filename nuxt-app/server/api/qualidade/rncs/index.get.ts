import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Extrai filtros
  const { status, opId, pecaId, compraId, fornecedorId } = query
  
  const where: any = {}
  
  if (status && status !== 'Todos') {
    where.status = status
  }
  if (opId) where.opId = Number(opId)
  if (pecaId) where.pecaId = Number(pecaId)
  if (compraId) where.compraId = Number(compraId)
  if (fornecedorId) where.fornecedorId = Number(fornecedorId)

  try {
    const rncs = await prisma.rNC.findMany({
      where,
      include: {
        op: { select: { numeroOP: true } },
        peca: { select: { codigo: true, descricao: true } },
        compra: { select: { numero: true } },
        fornecedor: { select: { nome: true } },
        relator: { select: { name: true } },
      },
      orderBy: {
        dataEmissao: 'desc'
      }
    })
    
    return rncs
  } catch (error) {
    console.error('Erro ao buscar RNCs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao buscar RNCs'
    })
  }
})
