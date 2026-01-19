// composables/useAutoDates.js
export const useAutoDates = () => {
  
  // Calcular data final baseada na data inicial + dias
  const calcularDataFinal = (dataInicio, dias) => {
    if (!dataInicio || !dias) return null
    
    const data = new Date(dataInicio)
    data.setDate(data.getDate() + parseInt(dias))
    return data.toISOString().split('T')[0]
  }
  
  // Calcular TODAS as datas para uma lista de processos
  const calcularTodasDatas = (processos, dataInicioOP) => {
    if (!processos.length || !dataInicioOP) return processos
    
    console.log('🔄 Calculando TODAS as datas automaticamente...')
    
    const processosComDatas = JSON.parse(JSON.stringify(processos))
    let dataAtual = dataInicioOP
    
    for (let i = 0; i < processosComDatas.length; i++) {
      const processo = processosComDatas[i]
      
      // SEMPRE calcular as datas, independente do que já existe
      if (processo.prazoEstimado) {
        // Data de início é sempre a data atual do cálculo
        processo.dataInicioPrevista = dataAtual
        // Data final = data início + prazo
        processo.dataPrevista = calcularDataFinal(dataAtual, processo.prazoEstimado)
        
        console.log(`📅 Processo ${i+1} (${processo.nome}):`)
        console.log(`   Início: ${processo.dataInicioPrevista}`)
        console.log(`   Término: ${processo.dataPrevista}`)
        console.log(`   Prazo: ${processo.prazoEstimado} dias`)
        
        // Preparar data para próximo processo (inicia no dia seguinte ao término)
        if (processo.dataPrevista) {
          dataAtual = calcularDataFinal(processo.dataPrevista, 1)
        }
      }
    }
    
    return processosComDatas
  }
  
  // Calcular datas para um NOVO processo
  const calcularDatasNovoProcesso = (processosExistentes, dataInicioOP, prazoNovoProcesso) => {
    if (!prazoNovoProcesso) return { dataInicio: null, dataTermino: null }
    
    let dataInicio
    
    if (processosExistentes.length === 0) {
      // Primeiro processo: usa data da OP
      dataInicio = dataInicioOP
    } else {
      // Processos subsequentes: inicia no dia seguinte ao último processo
      const ultimoProcesso = processosExistentes[processosExistentes.length - 1]
      dataInicio = calcularDataFinal(ultimoProcesso.dataPrevista, 1)
    }
    
    const dataTermino = calcularDataFinal(dataInicio, prazoNovoProcesso)
    
    return {
      dataInicio,
      dataTermino
    }
  }
  
  return {
    calcularDataFinal,
    calcularTodasDatas,
    calcularDatasNovoProcesso
  }
}