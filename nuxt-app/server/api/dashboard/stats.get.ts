import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const opsAbertas = await prisma.oP.count({
      where: { status: 'ABERTA' }
    })

    const opsProducao = await prisma.oP.count({
      where: {
        status: {
          in: ['EM_PROJETO', 'EM_FABRICACAO', 'EM_MONTAGEM']
        }
      }
    })

    const opsConcluidas = await prisma.oP.count({
      where: { status: 'ENTREGUE' }
    })

    const opsAtrasadas = await prisma.oP.count({
      where: {
        dataEntrega: { lt: new Date() },
        status: { not: 'ENTREGUE' }
      }
    })

    const user = event.context.user
    let minhasTarefas = 0
    if (user) {
      minhasTarefas = await prisma.oPProcesso.count({
        where: {
          responsavelId: user.id,
          status: { in: ['NAO_INICIADO', 'EM_ANDAMENTO', 'AGUARDANDO'] }
        }
      })
    }

    return {
      opsAbertas,
      opsProducao,
      opsConcluidas,
      opsAtrasadas,
      minhasTarefas
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    return {
      opsAbertas: 0,
      opsProducao: 0,
      opsConcluidas: 0,
      opsAtrasadas: 0
    }
  }
})