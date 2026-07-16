import { defineEventHandler } from 'h3'
import { auditContext } from '../utils/asyncContext'

export default defineEventHandler((event) => {
    // Pegar o ID do usuário (definido pelo auth.ts)
    const userId = event.context.user?.id

    // enterWith() injeta o estado para todas as chamadas assíncronas subsequentes desta requisição
    auditContext.enterWith({ userId })
})
