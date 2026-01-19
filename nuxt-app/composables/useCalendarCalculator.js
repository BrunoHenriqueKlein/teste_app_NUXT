export const useCalendarCalculator = () => {
  
  // Calcular data final considerando apenas dias úteis
  const calcularDataFinal = (dataInicio, diasUteis) => {
    if (!dataInicio || !diasUteis || diasUteis <= 0) return null
    
    let data = new Date(dataInicio)
    let diasAdicionados = 0
    
    // O primeiro dia já conta como dia útil
    diasAdicionados++
    
    while (diasAdicionados < diasUteis) {
      data.setDate(data.getDate() + 1)
      
      // Verificar se é dia útil (segunda a sexta)
      const diaSemana = data.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) { // Não é sábado(6) ou domingo(0)
        diasAdicionados++
      }
    }
    
    return data.toISOString().split('T')[0]
  }
  
  // Calcular data de início baseada na data final do processo anterior
  const calcularDataInicio = (dataFinalAnterior) => {
    if (!dataFinalAnterior) return null
    
    let data = new Date(dataFinalAnterior)
    data.setDate(data.getDate() + 1) // Começa no próximo dia
    
    // Pular fins de semana
    while (data.getDay() === 0 || data.getDay() === 6) {
      data.setDate(data.getDate() + 1)
    }
    
    return data.toISOString().split('T')[0]
  }
  
  // Calcular todas as datas em cascata para uma lista de processos
  const calcularDatasCascata = (processos, dataInicioOP) => {
    if (!processos.length || !dataInicioOP) return processos
    
    console.log('🔄 Calculando datas em cascata...', {
      totalProcessos: processos.length,
      dataInicioOP: dataInicioOP
    })
    
    const processosComDatas = JSON.parse(JSON.stringify(processos))
    let dataInicioAtual = dataInicioOP
    
    for (let i = 0; i < processosComDatas.length; i++) {
      const processo = processosComDatas[i]
      
      console.log(`📅 Processo ${i + 1}: ${processo.nome}`, {
        sequencia: processo.sequencia,
        prazo: processo.prazoEstimado,
        dataInicioAtual: dataInicioAtual
      })
      
      // Definir data de início
      processo.dataInicioPrevista = dataInicioAtual
      
      // Calcular data final baseada no prazo
      if (processo.prazoEstimado && processo.prazoEstimado > 0) {
        processo.dataFimPrevista = calcularDataFinal(dataInicioAtual, processo.prazoEstimado)
        
        console.log(`✅ Datas calculadas:`, {
          inicio: processo.dataInicioPrevista,
          fim: processo.dataFimPrevista,
          prazo: processo.prazoEstimado
        })
        
        // Preparar data de início para o próximo processo
        dataInicioAtual = calcularDataInicio(processo.dataFimPrevista)
      } else {
        processo.dataFimPrevista = dataInicioAtual
        dataInicioAtual = calcularDataInicio(dataInicioAtual)
      }
    }
    
    return processosComDatas
  }
  
  return {
    calcularDataFinal,
    calcularDataInicio,
    calcularDatasCascata
  }
}