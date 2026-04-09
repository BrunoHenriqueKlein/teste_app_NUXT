
import axios from 'axios';

async function testSorting() {
    const baseUrl = 'http://localhost:3000/api/ops';
    const fields = ['numeroOP', 'cliente', 'status', 'progresso', 'dataEntrega'];

    console.log('🧪 Iniciando testes de ordenação da API...');

    for (const field of fields) {
        try {
            console.log(`\n--- Testando ordenação por: ${field} (ASC) ---`);
            const response = await axios.get(baseUrl, {
                params: { sortBy: field, sortOrder: 'asc' }
            });
            const data = response.data;
            if (data.length > 0) {
                console.log(`✅ Recebidos ${data.length} itens.`);
                console.log(`Primeiro item (${field}):`, data[0][field === 'descricao' ? 'descricaoMaquina' : (field === 'numeroOP' ? 'numeroOP' : field)]);
            } else {
                console.log('⚠️ Nenhum dado retornado.');
            }
        } catch (error) {
            console.error(`❌ Erro ao testar ${field}:`, error.message);
        }
    }
}

// testSorting(); // Precisa de um ambiente rodando, vamos usar npx tsx direto no docker
