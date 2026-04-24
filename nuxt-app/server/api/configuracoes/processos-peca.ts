import { defineEventHandler, createError, readBody, H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        return await prisma.configProcessoPeca.findMany({
            orderBy: { nome: 'asc' }
        })
    }

    if (method === 'POST') {
        const body = await readBody(event)
        return await prisma.configProcessoPeca.create({
            data: {
                nome: body.nome,
                sigla: body.sigla,
                descricao: body.descricao
            }
        })
    }

    if (method === 'PUT') {
        const body = await readBody(event)
        return await prisma.configProcessoPeca.update({
            where: { id: body.id },
            data: {
                nome: body.nome,
                sigla: body.sigla,
                descricao: body.descricao
            }
        })
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        return await prisma.configProcessoPeca.delete({
            where: { id: body.id }
        })
    }
})
