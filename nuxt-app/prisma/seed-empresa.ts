import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const empresa = await prisma.empresa.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            nomeFantasia: 'Sua Empresa Aqui',
            razaoSocial: 'NOME DA EMPRESA LTDA',
            cnpj: '00.000.000/0001-00',
            inscricaoEstadual: '000.000.000.000',
            endereco: 'Rua Exemplo, 123 - Distrito Industrial',
            cidade: 'Sua Cidade',
            estado: 'RS',
            cep: '95000-000',
            telefone: '(54) 3000-0000',
            email: 'compras@suaempresa.com.br',
            logoUrl: '/logo.png'
        }
    })
    console.log('Empresa cadastrada com sucesso!', empresa)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
