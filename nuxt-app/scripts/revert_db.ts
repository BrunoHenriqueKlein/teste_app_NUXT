import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const movId = 51 // A movimentação em lote
  
  const mov = await prisma.estoqueMovimentacao.findUnique({ where: { id: movId } })
  if (!mov) {
    console.log("Movimentação já revertida ou não encontrada.")
    return
  }

  await prisma.$transaction(async (tx) => {
    // 1. Estornar o saldo no estoque
    await tx.estoque.update({
      where: { id: mov.estoqueId },
      data: { quantidade: { increment: mov.quantidade } }
    })
    console.log(`Estornado ${mov.quantidade} no estoque ID ${mov.estoqueId}`)

    // 2. Apagar o registro da movimentação
    await tx.estoqueMovimentacao.delete({
      where: { id: mov.id }
    })
    console.log("Movimentação apagada do histórico.")

    // 3. Voltar o status das 2 peças (Tubo ID 4543 e Fuso ID 4653)
    // Se não tivermos certeza dos IDs, podemos usar as que foram atualizadas hoje na OPs 3250 e 1111,
    // mas pelos logs sabemos que as peças em questão são as que geraram a mistura.
    // Pelo log anterior: 
    // ID 4543 (SOH 1663-001-01-01.3)
    // O ID 4653 (SOH1231-001-02-0274)
    // (Apenas voltando o status delas, e zerando os custos gerados pela herança do estoque)
    
    await tx.peca.updateMany({
      where: { id: { in: [4543, 4653] } },
      data: {
        statusSuprimento: 'NAO_SOLICITADO',
        valorUnitario: null,
        custoTotal: null
      }
    })
    console.log("Peças 4543 e 4653 revertidas com sucesso.")
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
