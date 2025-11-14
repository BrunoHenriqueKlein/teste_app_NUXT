import { PrismaClient } from '@prisma/client'

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
        { nome: 'Estoque', descricao: 'Controle de estoque', icon: 'mdi-warehouse', path: '/estoque', order: 5 },
        { nome: 'Compras', descricao: 'Solicitações de compra', icon: 'mdi-cart', path: '/compras', order: 6 },
        { nome: 'Relatórios', descricao: 'Dashboards e relatórios', icon: 'mdi-chart-bar', path: '/relatorios', order: 7 },
        { nome: 'Administração', descricao: 'Configurações do sistema', icon: 'mdi-cog', path: '/admin', order: 8 },
      ],
      skipDuplicates: true,
    })

    console.log('✅ Módulos criados')

    // 2. Criar Usuário Administrador
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@empresa.com' },
      update: {},
      create: {
        email: 'admin@empresa.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'ADMIN',
        department: 'ADMINISTRATIVO',
      },
    })

    console.log('✅ Usuário admin criado')

    // 3. Criar alguns usuários de exemplo
    const gerente = await prisma.user.upsert({
      where: { email: 'gerente@empresa.com' },
      update: {},
      create: {
        email: 'gerente@empresa.com',
        password: 'gerente123',
        name: 'João Silva',
        role: 'GERENTE',
        department: 'ENGENHARIA',
      },
    })

    const engenheiro = await prisma.user.upsert({
      where: { email: 'engenheiro@empresa.com' },
      update: {},
      create: {
        email: 'engenheiro@empresa.com',
        password: 'engenheiro123',
        name: 'Maria Santos',
        role: 'ENGENHEIRO',
        department: 'ENGENHARIA',
      },
    })

    console.log('✅ Usuários de exemplo criados')

    // 4. Criar OPs de exemplo
    const opsExemplo = [
      {
        numeroOP: 'OP-2024-001',
        codigoMaquina: 'MEC-001',
        descricaoMaquina: 'Máquina de Corte CNC 3000',
        dataPedido: new Date('2024-01-15'),
        dataEntrega: new Date('2024-06-30'),
        cliente: 'Indústria Metalúrgica ABC',
        cnpjCliente: '12.345.678/0001-90',
        enderecoCliente: 'Rua Industrial, 123 - São Paulo/SP',
        status: 'EM_PROJETO',
        progresso: 25,
        criadoPorId: adminUser.id,
        responsavelId: gerente.id,
      },
      {
        numeroOP: 'OP-2024-002',
        codigoMaquina: 'MEC-002',
        descricaoMaquina: 'Prensa Hidráulica 50T',
        dataPedido: new Date('2024-02-01'),
        dataEntrega: new Date('2024-05-15'),
        cliente: 'Fábrica de Componentes XYZ',
        cnpjCliente: '98.765.432/0001-10',
        enderecoCliente: 'Av. Tecnológica, 456 - Campinas/SP',
        status: 'EM_FABRICACAO',
        progresso: 60,
        criadoPorId: adminUser.id,
        responsavelId: engenheiro.id,
      },
      {
        numeroOP: 'OP-2024-003',
        codigoMaquina: 'MEC-003',
        descricaoMaquina: 'Esteira Transportadora Industrial',
        dataPedido: new Date('2024-03-10'),
        dataEntrega: new Date('2024-08-20'),
        cliente: 'Logística Rápida Ltda',
        status: 'ABERTA',
        progresso: 10,
        criadoPorId: adminUser.id,
      }
    ]

    for (const opData of opsExemplo) {
      await prisma.oP.upsert({
        where: { numeroOP: opData.numeroOP },
        update: {},
        create: opData,
      })
    }

    console.log('✅ OPs de exemplo criadas')

    // 5. Criar processos padrão para as OPs
    const ops = await prisma.oP.findMany()

    for (const op of ops) {
      const processosPadrao = [
        {
          nome: 'Lançamento da OP no Sistema',
          descricao: 'Registrar a OP no sistema de produção',
          sequencia: 1,
          status: 'CONCLUIDO' as const,
          progresso: 100,
          dataInicio: new Date('2024-01-15T08:00:00'),
          dataFim: new Date('2024-01-15T08:30:00'),
          responsavelId: adminUser.id
        },
        {
          nome: 'Criação da Pasta do Projeto',
          descricao: 'Criar estrutura de pastas para documentação',
          sequencia: 2,
          status: 'CONCLUIDO' as const,
          progresso: 100,
          dataInicio: new Date('2024-01-15T09:00:00'),
          dataFim: new Date('2024-01-15T10:00:00'),
          responsavelId: gerente.id
        },
        {
          nome: 'Projeto Mecânico 3D',
          descricao: 'Desenvolver projeto 3D da máquina',
          sequencia: 3,
          status: 'EM_ANDAMENTO' as const,
          progresso: 65,
          dataInicio: new Date('2024-01-16T08:00:00'),
          dataPrevista: new Date('2024-02-15'),
          prazoEstimado: 30,
          responsavelId: engenheiro.id
        },
        {
          nome: 'Detalhamento de Peças',
          descricao: 'Criar desenhos de fabricação',
          sequencia: 4,
          status: 'NAO_INICIADO' as const,
          progresso: 0,
          dataPrevista: new Date('2024-02-20'),
          prazoEstimado: 15
        }
      ]

      for (const processoData of processosPadrao) {
        await prisma.oPProcesso.create({
          data: {
            opId: op.id,
            ...processoData
          }
        })
      }
    }

    console.log(`✅ Processos padrão criados para ${ops.length} OPs`)

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
    console.log(`👤 Usuário gerente: gerente@empresa.com / gerente123`)
    console.log(`👤 Usuário engenheiro: engenheiro@empresa.com / engenheiro123`)
    console.log(`📋 ${opsExemplo.length} OPs de exemplo criadas`)
    console.log(`⚙️ Processos padrão criados para cada OP`)

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