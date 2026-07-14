import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event: any) => {
  const prisma = event.context.prisma

  // Buscar todos os usuários ativos com suas tarefas pendentes
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      department: true,
      opProcessos: {
        where: {
          status: {
            notIn: ['CONCLUIDO', 'CANCELADO']
          }
        },
        include: {
          op: {
            select: {
              numeroOP: true,
              descricaoMaquina: true
            }
          }
        }
      }
    }
  })

  const workloadAi = users.map((user: any) => {
    let totalDaysEstimated = 0
    let delayedTasks = 0
    let emAndamento = 0
    let naoIniciadas = 0
    let totalTasks = user.opProcessos.length

    let pieEmAndamentoEmDia = 0
    let pieEmAndamentoAtrasadas = 0
    let pieNaoIniciadasEmDia = 0
    let pieNaoIniciadasAtrasadas = 0

    user.opProcessos.forEach((task: any) => {
      // Regras de Peso: Redução para serviços acompanhados
      let peso = 1.0
      if (task.vinculoStatusOP === 'EM_FABRICACAO') {
        peso = 0.10 // 10% de esforço interno
      } else if (task.vinculoStatusOP === 'EM_CALIBRACAO') {
        peso = 0.20 // 20% de esforço interno
      }
      
      if (task.status === 'EM_ANDAMENTO') {
        emAndamento++
        // Somar workload apenas para tarefas ativas
        totalDaysEstimated += (task.prazoEstimado || 0) * peso
      } else if (task.status === 'NAO_INICIADO') {
        naoIniciadas++
      }

      let isAtrasada = false
      if (task.dataTerminoPrevista) {
        const endDate = new Date(task.dataTerminoPrevista)
        const today = new Date()
        today.setHours(0,0,0,0)
        endDate.setHours(0,0,0,0)
        if (endDate < today) {
          delayedTasks++
          isAtrasada = true
        }
      }

      if (task.status === 'EM_ANDAMENTO') {
        if (isAtrasada) pieEmAndamentoAtrasadas++
        else pieEmAndamentoEmDia++
      } else if (task.status === 'NAO_INICIADO') {
        if (isAtrasada) pieNaoIniciadasAtrasadas++
        else pieNaoIniciadasEmDia++
      }
    })

    // Aplicar fator de paralelismo: um operador consegue focar em média em 5 tarefas simultâneas
    const FATOR_PARALELISMO = 5
    const realDaysEstimated = Math.ceil(totalDaysEstimated / FATOR_PARALELISMO)

    // Calcular data estimada de liberação (Adicionar dias úteis reais à data atual)
    let availableDate = new Date()
    let daysToAdd = realDaysEstimated

    // Pular finais de semana no cálculo da data livre
    while (daysToAdd > 0) {
      availableDate.setDate(availableDate.getDate() + 1)
      const dayOfWeek = availableDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
        daysToAdd--
      }
    }

    let loadStatus = 'LEVE'
    // Status baseado na quantidade REAL de dias pendentes (Em Andamento)
    if (realDaysEstimated > 30) {
      loadStatus = 'SOBRECARREGADO'
    } else if (realDaysEstimated > 10) {
      loadStatus = 'MODERADO'
    }

    if (emAndamento === 0) {
      loadStatus = 'LIVRE'
    }

    // A regra de atrasos (separada)
    let delayStatus = null
    if (delayedTasks >= 10) {
      delayStatus = 'Atraso Crítico'
    } else if (delayedTasks >= 3) {
      delayStatus = 'Muitos Atrasos'
    } else if (delayedTasks > 0) {
      delayStatus = 'Pequenos Atrasos'
    }

    return {
      userId: user.id,
      userName: user.name,
      department: user.department,
      role: user.role,
      totalTarefasPendentes: totalTasks,
      emAndamento: emAndamento,
      naoIniciadas: naoIniciadas,
      pieEmAndamentoEmDia,
      pieEmAndamentoAtrasadas,
      pieNaoIniciadasEmDia,
      pieNaoIniciadasAtrasadas,
      totalDiasAcumulados: realDaysEstimated,
      tarefasAtrasadas: delayedTasks,
      dataEstimadaLivre: totalTasks === 0 ? new Date() : availableDate,
      statusCarga: loadStatus,
      statusAtraso: delayStatus
    }
  })

  // Ordenar pelos mais sobrecarregados primeiro
  workloadAi.sort((a: any, b: any) => b.totalDiasAcumulados - a.totalDiasAcumulados)

  return {
    success: true,
    data: workloadAi
  }
})
