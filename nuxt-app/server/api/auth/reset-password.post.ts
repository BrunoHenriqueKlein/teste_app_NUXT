// server/api/auth/reset-password.post.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Buscar usuário pelo token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: body.token,
        resetTokenExpiry: {
          gt: new Date() // Token ainda não expirou
        }
      }
    })

    if (!user) {
      return {
        success: false,
        message: 'Token inválido ou expirado'
      }
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: 'Senha redefinida com sucesso'
    }
  } catch (error) {
    console.error('Erro no reset-password:', error)
    return {
      success: false,
      message: 'Erro ao redefinir senha'
    }
  }
})