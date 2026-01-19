// server/api/auth/forgot-password.post.ts
import { PrismaClient } from '@prisma/client'
import { createTransport } from 'nodemailer'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })

    if (!user) {
      // Por segurança, não informamos se o e-mail existe ou não
      return {
        success: true,
        message: 'Se o e-mail existir em nosso sistema, você receberá um link de recuperação'
      }
    }

    // Gerar token de redefinição
    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Configurar e-mail (em produção, use variáveis de ambiente)
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Redefinição de Senha - Sistema SOMEH',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1867C0;">Redefinição de Senha</h2>
          <p>Olá ${user.name},</p>
          <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1867C0; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;">
              Redefinir Senha
            </a>
          </p>
          <p>Este link expirará em 1 hora.</p>
          <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Sistema SOMEH - Controle de Produção
          </p>
        </div>
      `
    }

    // Enviar e-mail
    await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: 'Link de recuperação enviado para seu e-mail'
    }
  } catch (error) {
    console.error('Erro no forgot-password:', error)
    return {
      success: false,
      message: 'Erro ao processar solicitação'
    }
  }
})