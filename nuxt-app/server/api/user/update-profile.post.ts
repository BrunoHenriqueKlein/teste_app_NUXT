import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { name, currentPassword, newPassword } = body

    // No mundo real, pegaríamos o ID do usuário do token (JWT) decodificado
    // Como estamos simplificando, vamos assumir que o ID vem no body ou o middleware injetaria
    // Mas para fins de demonstração e segurança básica, vamos usar o ID que vier do token se estivermos usando um middleware de auth no backend.

    // TODO: Implementar extração de ID do token JWT se disponível
    // Por enquanto, vamos esperar o email ou id no body para identificar o usuário
    const userId = body.userId

    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do usuário não fornecido'
        })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Usuário não encontrado'
            })
        }

        const updateData: any = {}
        if (name) updateData.name = name

        if (newPassword) {
            if (!currentPassword) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Senha atual é necessária para alterar a senha'
                })
            }

            const validPassword = await bcrypt.compare(currentPassword, user.password)
            if (!validPassword) {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Senha atual incorreta'
                })
            }

            updateData.password = await bcrypt.hash(newPassword, 10)
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        })

        return {
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                department: updatedUser.department
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Erro ao atualizar perfil'
        })
    }
})
