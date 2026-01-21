// server/api/auth/login.post.ts (adicione logs)
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  console.log('🔐 Tentativa de login:', body.email)

  try {
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: {
        email: body.email
      },
      include: {
        userModules: {
          where: {
            canView: true
          },
          include: {
            module: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', body.email)
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    console.log('👤 Usuário encontrado:', user.email, 'ID:', user.id)

    // Verificar se usuário está ativo
    if (!user.isActive) {
      console.log('❌ Usuário desativado:', user.email)
      throw createError({
        statusCode: 401,
        statusMessage: 'Usuário desativado'
      })
    }

    // Verificar senha com bcrypt
    const validPassword = await bcrypt.compare(body.password, user.password)

    console.log('🔑 Validação de senha:', validPassword ? '✅ Correta' : '❌ Incorreta')

    if (!validPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    console.log('✅ Login bem-sucedido:', user.email)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        userModules: user.userModules // Incluir permissões para o frontend
      }
    }
  } catch (error: any) {
    console.error('❌ Erro no login:', error.message)
    if (error.statusCode === 401) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Erro ao fazer login: ${error.message}`
    })
  }
})