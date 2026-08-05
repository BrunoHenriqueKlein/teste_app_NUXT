import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.compra.count({
    where: { status: 'COTACAO' }
  })
  console.log(`Número de compras com status COTACAO: ${count}`)
  
  if (count > 0) {
    console.log("Voltando status para SOLICITADA...")
    await prisma.compra.updateMany({
      where: { status: 'COTACAO' },
      data: { status: 'SOLICITADA' }
    })
    console.log("Feito!")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
