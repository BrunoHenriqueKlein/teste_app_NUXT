import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event: any) => {
  const prisma = event.context.prisma
  const query = getQuery(event)
  const opId = parseInt(query.opId as string)

  if (!opId || isNaN(opId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OP ID' })
  }

  const op = await prisma.oP.findUnique({
    where: { id: opId },
    include: {
      processos: true
    }
  })

  if (!op) {
    throw createError({ statusCode: 404, statusMessage: 'OP not found' })
  }

  const processos = op.processos
  if (processos.length === 0) {
    return { labels: [], dataPrevista: [], dataReal: [] }
  }

  // Define o peso de cada processo baseado na estimativa (fallback para 1)
  let totalWeight = 0
  processos.forEach((p: any) => {
    totalWeight += (p.prazoEstimado && p.prazoEstimado > 0) ? p.prazoEstimado : 1
  })

  // Encontra a janela de datas do projeto
  let minDate = op.dataInicioPrevista ? new Date(op.dataInicioPrevista) : new Date(op.dataCriacao)
  let maxDate = new Date(op.dataEntrega)
  const today = new Date()

  // Ajusta o máximo se o dia de hoje já ultrapassou a entrega
  if (today > maxDate) maxDate = today

  // Normaliza horas para meia-noite
  minDate.setHours(0,0,0,0)
  maxDate.setHours(0,0,0,0)
  today.setHours(0,0,0,0)

  // Para evitar sobrecarga de laço infinito (projetos de > 2 anos) limitamos a iteração
  const MAX_DAYS = 1000

  const labels: string[] = []
  const dataPrevista: number[] = []
  const dataReal: (number | null)[] = []

  let currentDate = new Date(minDate)
  let loopCount = 0

  while (currentDate <= maxDate && loopCount < MAX_DAYS) {
    labels.push(currentDate.toISOString().split('T')[0])

    let accumulatedPlannedWeight = 0
    let accumulatedRealWeight = 0

    processos.forEach((p: any) => {
      const weight = (p.prazoEstimado && p.prazoEstimado > 0) ? p.prazoEstimado : 1
      
      // ====== PROGRESSO PREVISTO ======
      if (p.dataTerminoPrevista) {
        const pEnd = new Date(p.dataTerminoPrevista)
        pEnd.setHours(0,0,0,0)
        
        if (currentDate >= pEnd) {
          accumulatedPlannedWeight += weight // 100%
        } else if (p.dataInicioPrevista) {
           const pStart = new Date(p.dataInicioPrevista)
           pStart.setHours(0,0,0,0)
           if (currentDate >= pStart && currentDate < pEnd) {
             const totalDuration = pEnd.getTime() - pStart.getTime()
             if (totalDuration > 0) {
               const elapsed = currentDate.getTime() - pStart.getTime()
               accumulatedPlannedWeight += weight * (elapsed / totalDuration)
             }
           }
        }
      }

      // ====== PROGRESSO REAL ======
      if (p.status === 'CONCLUIDO') {
        if (p.dataFim) {
          const rEnd = new Date(p.dataFim)
          rEnd.setHours(0,0,0,0)
          if (currentDate >= rEnd) {
            accumulatedRealWeight += weight
          } else if (p.dataInicio) {
             const rStart = new Date(p.dataInicio)
             rStart.setHours(0,0,0,0)
             if (currentDate >= rStart && currentDate < rEnd) {
               const totalDuration = rEnd.getTime() - rStart.getTime()
               if (totalDuration > 0) {
                 const elapsed = currentDate.getTime() - rStart.getTime()
                 accumulatedRealWeight += weight * (elapsed / totalDuration)
               }
             }
          }
        } else {
           // Processo concluído mas sem data fim cravada (dado legado)
           if (currentDate <= today) accumulatedRealWeight += weight
        }
      } else if (p.status === 'EM_ANDAMENTO') {
         // Usa o progresso apontado (0-100%) se a data analisada for hoje ou no passado
         if (currentDate <= today) {
           accumulatedRealWeight += weight * ((p.progresso || 0) / 100)
         }
      }
    })

    const pctPrevisto = totalWeight > 0 ? (accumulatedPlannedWeight / totalWeight) * 100 : 0
    let pctReal: number | null = totalWeight > 0 ? (accumulatedRealWeight / totalWeight) * 100 : 0

    // O gráfico Real só deve desenhar a linha até o dia de "hoje"
    if (currentDate > today) {
       pctReal = null 
    }

    dataPrevista.push(Math.round(pctPrevisto * 10) / 10)
    dataReal.push(pctReal !== null ? (Math.round(pctReal * 10) / 10) : null)

    currentDate.setDate(currentDate.getDate() + 1)
    loopCount++
  }

  return {
    labels,
    dataPrevista,
    dataReal
  }
})
