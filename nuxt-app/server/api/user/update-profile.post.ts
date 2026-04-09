import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

        // Novos campos de E-mail
        if (body.mailHost) updateData.mailHost = body.mailHost
        if (body.mailPort) updateData.mailPort = Number(body.mailPort)
        if (body.mailUser) updateData.mailUser = body.mailUser
        if (body.mailPass) updateData.mailPass = body.mailPass
        if (body.mailSecure !== undefined) updateData.mailSecure = body.mailSecure
        if (body.mailFrom) updateData.mailFrom = body.mailFrom
        if (body.imapHost) updateData.imapHost = body.imapHost
        if (body.popHost) updateData.popHost = body.popHost

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
                department: updatedUser.department,
                mailHost: updatedUser.mailHost,
                mailPort: updatedUser.mailPort,
                mailUser: updatedUser.mailUser,
                mailPass: updatedUser.mailPass,
                mailSecure: updatedUser.mailSecure,
                mailFrom: updatedUser.mailFrom,
                imapHost: updatedUser.imapHost,
                popHost: updatedUser.popHost
            }
        }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Erro ao atualizar perfil'
        })
    }
})
