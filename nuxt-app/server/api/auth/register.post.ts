// server/api/auth/register.post.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  console.log('📝 Tentativa de registro:', {
    email: body.email,
    name: body.name,
    department: body.department,
    role: body.role
  })

  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })

    if (existingUser) {
      console.log('❌ Usuário já existe:', body.email)
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuário já existe'
      })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Criar usuário com department padrão se não informado
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        department: body.department || 'ADMINISTRATIVO',
        role: 'USER' // Forçamos USER. Somente Admin Mestre pode elevar cargos via painel.
      }
    })

    console.log('✅ Usuário criado com sucesso:', user.id, user.email)

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    }
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error)

    // Verificar se é erro do Prisma
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 400,
        statusMessage: 'E-mail já cadastrado'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: `Erro ao criar usuário: ${error.message}`
    })
  }
})