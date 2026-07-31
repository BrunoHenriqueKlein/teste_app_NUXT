import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const roteiroId = parseInt(event.context.params?.id as string)
  
  if (isNaN(roteiroId)) {
    throw createError({
      statusCode: 400,
      message: 'ID do roteiro inválido'
    })
  }

  try {
    const body = await readBody(event)
    
    // Validations based on type could be done here, but we will accept the common object
    const roteiroItem = await prisma.roteiroItem.create({
      data: {
        roteiroId,
        pecaId: body.pecaId,
        quantidade: body.quantidade,
        tratamento: body.tratamento,
        pesoIndividual: body.pesoIndividual,
        areaSuperficial: body.areaSuperficial,
        dimensoesExternas: body.dimensoesExternas,
        valorUnitario: body.valorUnitario,
        valorTotal: body.valorTotal,
        imagemUrl: body.imagemUrl
      },
      include: {
        peca: {
          include: { anexos: true }
        }
      }
    })

    // Se o valorTotal do item foi enviado, atualiza o valorTotal do Roteiro (opcional, pode ser feito via trigger ou agregacao)
    
    return roteiroItem
  } catch (error: any) {
    console.error('Erro ao adicionar item ao roteiro:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao adicionar item'
    })
  }
})
