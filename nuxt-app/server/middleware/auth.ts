import { defineEventHandler, createError, getHeader } from 'h3'
import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'Authorization')

    // Pular verificação para rotas de auth
    if (event.path.startsWith('/api/auth/')) {
        return
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        try {
            const decoded = jwt.verify(token, jwtSecret)
            event.context.user = decoded
        } catch (error: any) {
            // Se o token expirou, retornar 401 para o cliente saber que precisa logar novamente
            if (error.name === 'TokenExpiredError') {
                throw createError({
                    statusCode: 401,
                    statusMessage: 'Token expirado',
                    message: 'Sua sessão expirou. Por favor, faça login novamente.'
                })
            }

            console.error('❌ Erro na verificação do JWT no middleware:', error.message)
            // Para outros erros (token inválido/malformado), continuamos sem autenticar
            // para permitir acesso a rotas públicas
        }
    }
})
