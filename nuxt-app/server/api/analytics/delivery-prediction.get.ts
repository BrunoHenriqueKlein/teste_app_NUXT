import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event: any) => {
  const prisma = event.context.prisma

  // Buscar todas as OPs ativas (não concluídas/canceladas)
  const ops = await prisma.oP.findMany({
    where: {
      status: {
        notIn: ['CONCLUIDA', 'CANCELADA']
      }
    },
    include: {
      processos: true,
      pecas: {
        include: {
          compras: {
            include: {
              compra: true
            }
          },
          processos: true
        }
      },
      ordensServico: true,
      compras: true
    }
  })

  const predictions = ops.map((op: any) => {
    let latestExpectedDate = op.dataInicioPrevista ? new Date(op.dataInicioPrevista) : new Date()
    let gargalos: string[] = []

    // 1. Analisar Processos Internos
    let totalProcessosDias = 0
    op.processos.forEach((p: any) => {
      if (p.status !== 'CONCLUIDO' && p.status !== 'CANCELADO') {
        const prazoDias = p.prazoEstimado || 0
        totalProcessosDias += prazoDias
        
        if (p.dataTerminoPrevista && new Date(p.dataTerminoPrevista) > latestExpectedDate) {
          latestExpectedDate = new Date(p.dataTerminoPrevista)
        }
        if (p.status === 'BLOQUEADO') {
          gargalos.push(`Processo interno bloqueado: ${p.nome}`)
        }
      }
    })

    // Adiciona os dias de processos não iniciados à data base atual
    if (totalProcessosDias > 0) {
      const addedDate = new Date()
      addedDate.setDate(addedDate.getDate() + totalProcessosDias)
      if (addedDate > latestExpectedDate) {
        latestExpectedDate = addedDate
      }
    }

    // 2. Analisar Compras Pendentes (diretas na OP)
    op.compras.forEach((comp: any) => {
      if (comp.status !== 'RECEBIDA_TOTAL' && comp.status !== 'CANCELADA') {
        if (comp.dataPrevisaoEntrega) {
          const prevDate = new Date(comp.dataPrevisaoEntrega)
          if (prevDate > latestExpectedDate) {
            latestExpectedDate = prevDate
            gargalos.push(`Aguardando Compra ${comp.numero} (Prev: ${prevDate.toLocaleDateString('pt-BR')})`)
          }
        } else {
          gargalos.push(`Compra ${comp.numero} sem previsão de entrega`)
        }
      }
    })

    // 3. Analisar Peças e suas compras
    op.pecas.forEach((peca: any) => {
      if (peca.status !== 'MONTADA') {
        peca.compras.forEach((item: any) => {
          const comp = item.compra
          if (comp && comp.status !== 'RECEBIDA_TOTAL' && comp.status !== 'CANCELADA') {
             if (comp.dataPrevisaoEntrega) {
                const prevDate = new Date(comp.dataPrevisaoEntrega)
                if (prevDate > latestExpectedDate) {
                  latestExpectedDate = prevDate
                  if (!gargalos.find(g => g.includes(`Compra ${comp.numero}`))) {
                    gargalos.push(`Peça ${peca.codigo} atrasada pela Compra ${comp.numero}`)
                  }
                }
             }
          }
        })
      }
    })

    // 4. Analisar Ordens de Serviço (Terceiros)
    op.ordensServico.forEach((os: any) => {
      if (os.status !== 'CONCLUIDO' && os.status !== 'CANCELADO') {
        if (os.terminoPrevisto) {
          const endOS = new Date(os.terminoPrevisto)
          if (endOS > latestExpectedDate) {
            latestExpectedDate = endOS
            gargalos.push(`Serviço de terceiro OS ${os.numero} previsto para ${endOS.toLocaleDateString('pt-BR')}`)
          }
        }
      }
    })

    // Calcula Risco
    let risk = 'VERDE'
    const limitDate = new Date(op.dataEntrega)
    const timeDiff = limitDate.getTime() - latestExpectedDate.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    // Margem positiva = Verde
    if (daysDiff >= 0) {
      risk = 'VERDE'
    } else if (daysDiff >= -21) {
      // Atraso de até 21 dias (3 semanas)
      risk = 'AMARELO'
    } else {
      // Atraso maior que 21 dias
      risk = 'VERMELHO'
    }

    if (gargalos.length === 0 && risk === 'VERDE') {
      gargalos.push('Nenhum gargalo identificado. Fluxo normal.')
    }

    // ====== INÍCIO: CÁLCULO DA CURVA S ======
    const MAX_DAYS = 300 // Reduzido para não pesar muito no backend em consultas em lote
    let totalWeight = 0
    op.processos.forEach((p: any) => {
      totalWeight += (p.prazoEstimado && p.prazoEstimado > 0) ? p.prazoEstimado : 1
    })

    let minDate = op.dataInicioPrevista ? new Date(op.dataInicioPrevista) : new Date(op.dataCriacao)
    let maxDate = new Date(op.dataEntrega)
    const today = new Date()

    if (today > maxDate) maxDate = today
    minDate.setHours(0,0,0,0)
    maxDate.setHours(0,0,0,0)
    today.setHours(0,0,0,0)

    const labels: string[] = []
    const dataPrevista: number[] = []
    const dataReal: (number | null)[] = []

    if (totalWeight > 0) {
      let currentDate = new Date(minDate)
      let loopCount = 0

      while (currentDate <= maxDate && loopCount < MAX_DAYS) {
        // Encurtar labels (DD/MM) para não poluir os cards pequenos
        const dateString = currentDate.toISOString().split('T')[0]
        const [, month, day] = dateString.split('-')
        labels.push(`${day}/${month}`)

        let accumulatedPlannedWeight = 0
        let accumulatedRealWeight = 0

        op.processos.forEach((p: any) => {
          const weight = (p.prazoEstimado && p.prazoEstimado > 0) ? p.prazoEstimado : 1
          
          if (p.dataTerminoPrevista) {
            const pEnd = new Date(p.dataTerminoPrevista)
            pEnd.setHours(0,0,0,0)
            
            if (currentDate >= pEnd) {
              accumulatedPlannedWeight += weight
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
               if (currentDate <= today) accumulatedRealWeight += weight
            }
          } else if (p.status === 'EM_ANDAMENTO') {
             if (currentDate <= today) {
               accumulatedRealWeight += weight * ((p.progresso || 0) / 100)
             }
          }
        })

        const pctPrevisto = (accumulatedPlannedWeight / totalWeight) * 100
        let pctReal: number | null = (accumulatedRealWeight / totalWeight) * 100

        if (currentDate > today) pctReal = null 

        dataPrevista.push(Math.round(pctPrevisto * 10) / 10)
        dataReal.push(pctReal !== null ? (Math.round(pctReal * 10) / 10) : null)

        currentDate.setDate(currentDate.getDate() + 1)
        loopCount++
      }
    }
    // ====== FIM: CÁLCULO DA CURVA S ======

    return {
      opId: op.id,
      numeroOP: op.numeroOP,
      maquina: op.descricaoMaquina,
      cliente: op.cliente,
      prazoPrometido: limitDate,
      prazoCalculado: latestExpectedDate,
      diasDeMargem: daysDiff,
      risco: risk,
      progresso: op.progresso,
      gargalos: [...new Set(gargalos)],
      chartData: labels.length > 0 ? {
        labels,
        datasets: [
          {
            label: 'Previsto',
            data: dataPrevista,
            borderColor: '#9E9E9E',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            borderDash: [5, 5],
            tension: 0.1,
            fill: false,
            pointRadius: 1
          },
          {
            label: 'Real',
            data: dataReal,
            borderColor: risk === 'VERMELHO' ? '#C62828' : '#2E7D32',
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            tension: 0.1,
            fill: true,
            pointRadius: 2
          }
        ]
      } : null
    }
  })

  // Ordenar por risco e depois por prazo
  predictions.sort((a: any, b: any) => {
    if (a.risco === 'VERMELHO' && b.risco !== 'VERMELHO') return -1
    if (b.risco === 'VERMELHO' && a.risco !== 'VERMELHO') return 1
    if (a.risco === 'AMARELO' && b.risco === 'VERDE') return -1
    if (b.risco === 'AMARELO' && a.risco === 'VERDE') return 1
    return a.prazoCalculado.getTime() - b.prazoCalculado.getTime()
  })

  return {
    success: true,
    data: predictions
  }
})
