import { defineEventHandler, readBody, createError } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id, name, email, role, department, isActive, password } = body

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do usuário não fornecido'
        })
    }

    try {
        const data: any = {
            role,
            department,
            isActive
        }

        if (name) data.name = name
        if (email) data.email = email
        if (password) {
            const bcrypt = await import('bcryptjs')
            data.password = await bcrypt.default.hash(password, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data
        })

        return {
            success: true,
            user: updatedUser
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `Erro ao atualizar usuário: ${error.message}`
        })
    }
})
