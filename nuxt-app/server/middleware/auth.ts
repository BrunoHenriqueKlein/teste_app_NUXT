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
            console.log('🔐 Usuário autenticado via middleware:', (decoded as any).email)
        } catch (error) {
            console.error('❌ Erro na verificação do JWT no middleware:', error)
            // Não bloqueamos aqui para permitir que rotas públicas funcionem,
            // mas o event.context.user ficará vazio.
        }
    }
})
