import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.peca.updateMany({
    where: { statusSuprimento: 'EM_ORCAMENTO' },
    data: { statusSuprimento: 'NAO_SOLICITADO' }
  })
  console.log(`Reset ${result.count} pecas`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
