import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const updated = await prisma.estoque.updateMany({
    where: { categoria: 'MATERIA_PRIMA' },
    data: { categoria: 'Materia Prima' }
  })
  console.log(`Updated ${updated.count} items.`)
}
main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect())
