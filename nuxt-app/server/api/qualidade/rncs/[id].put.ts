import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID é obrigatório' })
  }

  try {
    const data: any = {
      status: body.status,
      descricaoFalha: body.descricaoFalha,
      acaoCorretiva: body.acaoCorretiva,
      acaoPreventiva: body.acaoPreventiva,
      disposicao: body.disposicao,
      custoMaQualidade: body.custoMaQualidade ? Number(body.custoMaQualidade) : null,
      quantidadeLote: body.quantidadeLote ? Number(body.quantidadeLote) : null,
      quantidadeReprovada: body.quantidadeReprovada ? Number(body.quantidadeReprovada) : null,
    }

    if (body.status === 'CONCLUIDA' || body.status === 'CANCELADA') {
      data.dataFechamento = new Date()
    } else {
      data.dataFechamento = null
    }

    const rnc = await prisma.rNC.update({
      where: { id: Number(id) },
      data
    })
    
    return rnc
  } catch (error) {
    console.error('Erro ao atualizar RNC:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro interno ao atualizar RNC'
    })
  }
})
