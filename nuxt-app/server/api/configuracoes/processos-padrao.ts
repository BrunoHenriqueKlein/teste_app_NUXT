import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        return await prisma.configProcessoPadrao.findMany({
            include: { responsavel: { select: { id: true, name: true } } },
            orderBy: { nome: 'asc' }
        })
    }

    if (method === 'POST') {
        const body = await readBody(event)
        return await prisma.configProcessoPadrao.create({
            data: {
                nome: body.nome,
                descricao: body.descricao,
                prazoEstimadoPadrao: body.prazoEstimadoPadrao ? parseInt(body.prazoEstimadoPadrao) : null,
                responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null,
                vinculoStatusOP: body.vinculoStatusOP || null
            },
            include: { responsavel: { select: { id: true, name: true } } }
        })
    }

    if (method === 'PUT') {
        const body = await readBody(event)
        return await prisma.configProcessoPadrao.update({
            where: { id: body.id },
            data: {
                nome: body.nome,
                descricao: body.descricao,
                prazoEstimadoPadrao: body.prazoEstimadoPadrao ? parseInt(body.prazoEstimadoPadrao) : null,
                responsavelId: body.responsavelId ? parseInt(body.responsavelId) : null,
                vinculoStatusOP: body.vinculoStatusOP || null
            },
            include: { responsavel: { select: { id: true, name: true } } }
        })
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        return await prisma.configProcessoPadrao.delete({
            where: { id: body.id }
        })
    }
})
