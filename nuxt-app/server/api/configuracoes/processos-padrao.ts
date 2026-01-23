import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        return await prisma.configProcessoPadrao.findMany({
            orderBy: { nome: 'asc' }
        })
    }

    if (method === 'POST') {
        const body = await readBody(event)
        return await prisma.configProcessoPadrao.create({
            data: {
                nome: body.nome,
                descricao: body.descricao,
                prazoEstimadoPadrao: body.prazoEstimadoPadrao ? parseInt(body.prazoEstimadoPadrao) : null
            }
        })
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        return await prisma.configProcessoPadrao.delete({
            where: { id: body.id }
        })
    }
})
