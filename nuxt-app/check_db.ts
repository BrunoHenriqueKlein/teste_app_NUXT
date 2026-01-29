import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const processos = await prisma.configProcessoPeca.findMany()
    console.log('--- Processos de Peças ---')
    console.log(JSON.stringify(processos, null, 2))

    const ops = await prisma.oP.findMany({
        take: 5,
        select: { numeroOP: true, id: true }
    })
    console.log('\n--- Últimas 5 OPs ---')
    console.log(JSON.stringify(ops, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
