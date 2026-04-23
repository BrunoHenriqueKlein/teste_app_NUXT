import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma

    try {
        // 1. Buscar todos os usuários
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true
            },
            orderBy: { name: 'asc' }
        })

        // 2. Buscar todos os processos de OPs que têm responsável
        const processos = await prisma.oPProcesso.findMany({
            where: {
                responsavelId: { not: null },
                status: { not: 'CANCELADO' }
            },
            include: {
                op: {
                    select: {
                        id: true,
                        numeroOP: true,
                        cliente: true,
                        descricaoMaquina: true
                    }
                }
            },
            orderBy: { dataInicioPrevista: 'asc' }
        })

        // 3. Estruturar os dados
        const workload = users.map(user => {
            const userTasks = processos.filter(p => p.responsavelId === user.id)

            return {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                department: user.department,
                tasks: userTasks.map(t => ({
                    id: t.id,
                    opId: t.opId,
                    nome: t.nome,
                    op: t.op?.numeroOP || 'N/A',
                    cliente: t.op?.cliente || 'N/A',
                    maquina: t.op?.descricaoMaquina || 'N/A',
                    status: t.status,
                    progresso: t.progresso,
                    sequencia: t.sequencia,
                    dataInicioPrevista: t.dataInicioPrevista,
                    dataTerminoPrevista: t.dataTerminoPrevista,
                    prazoEstimado: t.prazoEstimado
                }))
            }
        })

        return {
            success: true,
            data: workload,
            debug: {
                usersCount: users.length,
                tasksCount: processos.length
            },
            timestamp: new Date().toISOString()
        }
    } catch (error: any) {
        console.error('❌ Erro na API de Workload:', error)
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao carregar carga de trabalho: ${error.message}`
        })
    }
})
