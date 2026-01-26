import { defineEventHandler } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 1. OPs Aguardando (não iniciadas)
    const opsAbertas = await prisma.oP.count({
      where: { status: 'AGUARDANDO' }
    })

    // 2. OPs Em Produção (Todos os status que começam com EM_)
    // No Prisma, pegamos a lista completa e filtramos ou listamos todos
    const todasOps = await prisma.oP.findMany({
      select: { status: true, dataEntrega: true }
    })

    const opsProducao = todasOps.filter(op => op.status.startsWith('EM_')).length

    // 3. OPs Concluídas
    const opsConcluidas = todasOps.filter(op => op.status === 'CONCLUIDA').length

    // 4. OPs Atrasadas (Qualquer uma não concluída/cancelada com data vencida)
    const agora = new Date()
    const opsAtrasadas = todasOps.filter(op =>
      op.status !== 'CONCLUIDA' &&
      op.status !== 'CANCELADA' &&
      op.dataEntrega &&
      new Date(op.dataEntrega) < agora
    ).length

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
      minhasTarefas,
      total: todasOps.length
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