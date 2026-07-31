import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tipo = query.tipo as string // 'ZINCO', 'PINTURA', etc

  if (!tipo) {
    throw createError({
      statusCode: 400,
      message: 'O parâmetro tipo é obrigatório'
    })
  }

  // Define a palavra-chave de busca baseada no tipo
  let keyword = ''
  if (tipo === 'ZINCO') keyword = 'zinco'
  else if (tipo === 'PINTURA') keyword = 'pintura'
  else keyword = tipo.toLowerCase()

  try {
    const pendentes = await prisma.processoPeca.findMany({
      where: {
        nome: {
          contains: keyword,
          mode: 'insensitive' // Busca ignorando maiúsculas/minúsculas
        },
        status: {
          in: ['NAO_INICIADO', 'AGUARDANDO']
        },
        ...(query.opId && { peca: { opId: parseInt(query.opId as string) } })
      },
      include: {
        peca: {
          include: {
            anexos: true,
            op: true // Para mostrar o número da OP na tela
          }
        }
      },
      orderBy: {
        peca: {
          op: {
            dataEntrega: 'asc'
          }
        }
      }
    })

    return pendentes
  } catch (error) {
    console.error('Erro ao buscar processos pendentes:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno ao buscar processos pendentes'
    })
  }
})
