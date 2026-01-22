import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const method = event.method

    if (method === 'GET') {
        try {
            const fornecedores = await prisma.fornecedor.findMany({
                orderBy: { nome: 'asc' }
            })
            return fornecedores
        } catch (error) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao buscar fornecedores'
            })
        }
    }

    if (method === 'POST') {
        const body = await readBody(event)
        try {
            if (body.id) {
                // Update
                const fornecedor = await prisma.fornecedor.update({
                    where: { id: body.id },
                    data: {
                        nome: body.nome,
                        cnpj: body.cnpj,
                        categorias: body.categorias || [],
                        telefone: body.telefone,
                        whatsapp: body.whatsapp,
                        email: body.email,
                        contato: body.contato,
                        endereco: body.endereco
                    }
                })
                return fornecedor
            } else {
                // Create
                const fornecedor = await prisma.fornecedor.create({
                    data: {
                        nome: body.nome,
                        cnpj: body.cnpj,
                        categorias: body.categorias || [],
                        telefone: body.telefone,
                        whatsapp: body.whatsapp,
                        email: body.email,
                        contato: body.contato,
                        endereco: body.endereco
                    }
                })
                return fornecedor
            }
        } catch (error: any) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao salvar fornecedor: ' + error.message
            })
        }
    }

    if (method === 'DELETE') {
        const body = await readBody(event)
        try {
            await prisma.fornecedor.delete({
                where: { id: body.id }
            })
            return { success: true }
        } catch (error: any) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Erro ao excluir fornecedor: ' + error.message
            })
        }
    }
})
