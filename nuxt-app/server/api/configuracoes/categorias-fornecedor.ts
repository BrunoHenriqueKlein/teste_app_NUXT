import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        return await prisma.configCategoriaFornecedor.findMany({
            orderBy: { nome: 'asc' }
        })
    }

    if (method === 'POST') {
        const body = await readBody(event)
        return await prisma.configCategoriaFornecedor.create({
            data: { nome: body.nome }
        })
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        return await prisma.configCategoriaFornecedor.delete({
            where: { id: body.id }
        })
    }
})
