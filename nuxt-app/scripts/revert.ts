import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const movs = await prisma.estoqueMovimentacao.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  console.log("Últimas Movimentações:")
  console.log(movs)

  const pecas = await prisma.peca.findMany({
    where: { statusSuprimento: 'ATENDIDO_ESTOQUE' },
    include: { op: true }
  })
  console.log("\nPeças com status ATENDIDO_ESTOQUE:")
  console.log(pecas.map(p => ({ id: p.id, codigo: p.codigo, op: p.op?.numeroOP, material: p.material, tipoMaterial: p.tipoMaterial })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
