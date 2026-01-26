import { PrismaClient, OPStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  try {
    // 1. Criar Módulos do Sistema
    const modules = await prisma.module.createMany({
      data: [
        { nome: 'Dashboard', descricao: 'Visão geral do sistema', icon: 'mdi-view-dashboard', path: '/', order: 1 },
        { nome: 'Ordens de Produção', descricao: 'Gerenciar OPs', icon: 'mdi-clipboard-list', path: '/ops', order: 2 },
        { nome: 'Processos', descricao: 'Processos das OPs', icon: 'mdi-cog', path: '/processos', order: 3 },
        { nome: 'Peças', descricao: 'Gestão de peças', icon: 'mdi-cube', path: '/pecas', order: 4 },
        { nome: 'PCP', descricao: 'Planejamento e Controle de Produção', icon: 'mdi-factory', path: '/pcp', order: 5 },
        { nome: 'Estoque', descricao: 'Controle de estoque', icon: 'mdi-warehouse', path: '/estoque', order: 6 },
        { nome: 'Compras', descricao: 'Solicitações de compra', icon: 'mdi-cart', path: '/compras', order: 7 },
        { nome: 'Relatórios', descricao: 'Dashboards e relatórios', icon: 'mdi-chart-bar', path: '/relatorios', order: 8 },
        { nome: 'Administração', descricao: 'Configurações do sistema', icon: 'mdi-cog', path: '/admin', order: 9 },
      ],
      skipDuplicates: true,
    })

    console.log('✅ Módulos criados')

    // 2. Criar Usuário Administrador
    const passwordHash = await bcrypt.hash('admin123', 10)
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@empresa.com' },
      update: {
        password: passwordHash // Atualizar senha se já existir
      },
      create: {
        email: 'admin@empresa.com',
        password: passwordHash,
        name: 'Administrador',
        role: 'ADMIN',
        department: 'ADMINISTRATIVO',
      },
    })

    console.log('✅ Usuário admin criado')


    // 6. Dar acesso total a todos módulos para o admin
    const allModules = await prisma.module.findMany()

    for (const module of allModules) {
      await prisma.userModule.upsert({
        where: {
          userId_moduleId: {
            userId: adminUser.id,
            moduleId: module.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          moduleId: module.id,
          canView: true,
          canEdit: true,
          canDelete: true,
        },
      })
    }

    console.log('✅ Permissões do admin configuradas')

    console.log('🎉 Seed concluído com sucesso!')
    console.log(`👤 Usuário admin: admin@empresa.com / admin123`)

  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  }
}

// Executar o seed
main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })