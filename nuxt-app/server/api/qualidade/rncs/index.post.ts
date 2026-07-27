import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Generate next RNC number (e.g. RNC-2024-001)
    const year = new Date().getFullYear()
    const latestRNC = await prisma.rNC.findFirst({
      where: { numero: { startsWith: `RNC-${year}-` } },
      orderBy: { id: 'desc' }
    })
    
    let sequence = 1
    if (latestRNC) {
      const parts = latestRNC.numero.split('-')
      sequence = parseInt(parts[2]) + 1
    }
    
    const numero = `RNC-${year}-${String(sequence).padStart(3, '0')}`

    const rnc = await prisma.rNC.create({
      data: {
        numero,
        descricaoFalha: body.descricaoFalha,
        quantidadeLote: body.quantidadeLote ? Number(body.quantidadeLote) : null,
        quantidadeReprovada: body.quantidadeReprovada ? Number(body.quantidadeReprovada) : null,
        custoMaQualidade: body.custoMaQualidade ? Number(body.custoMaQualidade) : null,
        opId: body.opId ? Number(body.opId) : null,
        pecaId: body.pecaId ? Number(body.pecaId) : null,
        compraId: body.compraId ? Number(body.compraId) : null,
        fornecedorId: body.fornecedorId ? Number(body.fornecedorId) : null,
        relatorId: Number(body.relatorId), // Should come from session in a real app, passing for now
        status: 'ABERTA'
      }
    })
    
    return rnc
  } catch (error) {
    console.error('Erro ao criar RNC:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao criar RNC'
    })
  }
})
