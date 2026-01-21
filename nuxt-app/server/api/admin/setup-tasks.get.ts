import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const user = event.context.user

    if (!user || user.role !== 'ADMIN') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Acesso negado. Apenas administradores podem executar este comando.'
        })
    }

    try {
        // 1. Criar o módulo
        const module = await prisma.module.upsert({
            where: { nome: 'Tarefas' },
            update: {
                descricao: 'Gestão de tarefas e processos',
                icon: 'mdi-clipboard-check-multiple',
                path: '/tarefas',
                order: 1.5 // Logo abaixo do Dashboard
            },
            create: {
                nome: 'Tarefas',
                descricao: 'Gestão de tarefas e processos',
                icon: 'mdi-clipboard-check-multiple',
                path: '/tarefas',
                order: 1.5,
                isActive: true
            }
        })

        // 2. Dar permissão ao Admin
        await prisma.userModule.upsert({
            where: {
                userId_moduleId: {
                    userId: user.id,
                    moduleId: module.id
                }
            },
            update: {
                canView: true,
                canEdit: true,
                canDelete: true
            },
            create: {
                userId: user.id,
                moduleId: module.id,
                canView: true,
                canEdit: true,
                canDelete: true
            }
        })

        return {
            success: true,
            message: 'Módulo de Tarefas registrado com sucesso!',
            module
        }
    } catch (error) {
        console.error('Erro ao registrar módulo:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao registrar módulo'
        })
    }
})
