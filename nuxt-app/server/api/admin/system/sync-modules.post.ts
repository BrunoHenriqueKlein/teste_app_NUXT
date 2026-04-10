import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const modules = [
            { nome: 'Dashboard', descricao: 'Visão geral do sistema', icon: 'mdi-view-dashboard', path: '/', order: 1 },
            { nome: 'Tarefas', descricao: 'Minhas tarefas e progresso', icon: 'mdi-clipboard-check-multiple', path: '/tarefas', order: 1.5 },
            { nome: 'Ordens de Produção', descricao: 'Gerenciar OPs', icon: 'mdi-clipboard-list', path: '/ops', order: 2 },
            { nome: 'Processos', descricao: 'Processos das OPs', icon: 'mdi-cog', path: '/processos', order: 3 },
            { nome: 'Peças', descricao: 'Gestão de peças', icon: 'mdi-cogs', path: '/pecas', order: 4 },
            { nome: 'PCP', descricao: 'Planejamento e Controle de Produção', icon: 'mdi-factory', path: '/pcp', order: 5 },
            { nome: 'Estoque', descricao: 'Controle de estoque', icon: 'mdi-warehouse', path: '/estoque', order: 6 },
            { nome: 'Fornecedores', descricao: 'Gestão de fornecedores', icon: 'mdi-account-group', path: '/fornecedores', order: 6.5 },
            { nome: 'Compras', descricao: 'Solicitações de compra', icon: 'mdi-cart', path: '/compras', order: 7 },
            { nome: 'Relatórios', descricao: 'Dashboards e relatórios', icon: 'mdi-chart-bar', path: '/relatorios', order: 8 },
            { nome: 'Administração', descricao: 'Configurações do sistema', icon: 'mdi-cog', path: '/admin', order: 9 },
        ]

        for (const m of modules) {
            await prisma.module.upsert({
                where: { nome: m.nome },
                update: {
                    descricao: m.descricao,
                    icon: m.icon,
                    path: m.path,
                    order: m.order
                },
                create: m
            })
        }

        return { success: true, message: 'Módulos sincronizados com sucesso' }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
})
