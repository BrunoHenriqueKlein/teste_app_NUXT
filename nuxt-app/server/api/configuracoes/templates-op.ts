import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        return await prisma.configTemplateOP.findMany({
            include: {
                processos: {
                    include: { processo: true },
                    orderBy: { sequencia: 'asc' }
                }
            },
            orderBy: { nome: 'asc' }
        })
    }

    if (method === 'POST') {
        const body = await readBody(event)
        const { nome, processos } = body

        // Criar template e itens em uma transação
        return await prisma.$transaction(async (tx: any) => {
            const template = await tx.configTemplateOP.create({
                data: { nome }
            })

            if (processos && processos.length > 0) {
                await tx.configTemplateOPItem.createMany({
                    data: processos.map((p: any, idx: number) => ({
                        templateId: template.id,
                        processoId: p.id,
                        sequencia: idx + 1
                    }))
                })
            }

            return tx.configTemplateOP.findUnique({
                where: { id: template.id },
                include: { processos: { include: { processo: true } } }
            })
        })
    }

    if (method === 'PUT') {
        const body = await readBody(event)
        const { id, nome, processos } = body

        return await prisma.$transaction(async (tx: any) => {
            // Atualizar nome do template
            const template = await tx.configTemplateOP.update({
                where: { id },
                data: { nome }
            })

            // Remover itens antigos
            await tx.configTemplateOPItem.deleteMany({
                where: { templateId: id }
            })

            // Criar novos itens
            if (processos && processos.length > 0) {
                await tx.configTemplateOPItem.createMany({
                    data: procesos.map((p: any, idx: number) => ({
                        templateId: id,
                        processoId: p.id,
                        sequencia: idx + 1
                    }))
                })
            }

            return tx.configTemplateOP.findUnique({
                where: { id },
                include: { processos: { include: { processo: true } } }
            })
        })
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        return await prisma.configTemplateOP.delete({
            where: { id: body.id }
        })
    }
})
