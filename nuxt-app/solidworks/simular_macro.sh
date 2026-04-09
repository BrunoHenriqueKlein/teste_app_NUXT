#!/bin/bash

# Configurações
BASE_URL="http://localhost:3080/api"
SECRET="someh-sw-integration-2024"
OP_NUMERO="TESTE-2024" # Altere para uma OP que exista no seu banco

echo "🚀 Iniciando Simulação da Macro SolidWorks (Bridge Strategy)..."

# 1. Simular o POST de importação da Peça
echo "📦 1/2: Enviando metadados da peça..."
RESPONSE=$(curl -s -X POST "$BASE_URL/ops/import-bom" \
  -H "Content-Type: application/json" \
  -H "X-SW-Secret: $SECRET" \
  -d "{
    \"numeroOP\": \"$OP_NUMERO\",
    \"peca\": {
      \"codigo\": \"SIMULADO-001\",
      \"descricao\": \"PECA DE TESTE REMOTO\",
      \"material\": \"ACO SAE 1020\",
      \"quantidade\": 5,
      \"categoria\": \"FABRICADO\",
      \"subcategoria\": \"CALDEIRARIA\",
      \"processos\": [\"CORTE\", \"DOBRA\", \"CALDEIRARIA\"]
    }
  }")

# Extração robusta do pecaId (funciona com JSON multi-linha)
PECA_ID=$(echo "$RESPONSE" | grep '"pecaId":' | tr -dc '0-9')

if [ -z "$PECA_ID" ]; then
  echo "❌ Erro ao importar peça!"
  echo "Resposta do servidor: $RESPONSE"
  echo "Dica: Verifique se a OP '$OP_NUMERO' existe no Painel de OPs."
  exit 1
fi

echo "✅ Peça importada com ID: $PECA_ID"

# 2. Criar um arquivo PDF fake e enviar
echo "📄 2/2: Criando e enviando desenho simulado (PDF)..."
echo "CONTEUDO_SIMULADO_PDF" > desenho_teste.pdf

curl -s -X POST "$BASE_URL/pecas/$PECA_ID/desenho" \
  -H "X-SW-Secret: $SECRET" \
  -H "Content-Type: application/pdf" \
  -H "X-File-Name: SIMULADO-001.pdf" \
  --data-binary @desenho_teste.pdf

if [ $? -eq 0 ]; then
  echo "✅ Desenho enviado com sucesso!"
else
  echo "❌ Erro ao enviar desenho."
fi

# Limpeza
rm desenho_teste.pdf

echo "🏁 Simulação concluída. Verifique a OP $OP_NUMERO no sistema!"
