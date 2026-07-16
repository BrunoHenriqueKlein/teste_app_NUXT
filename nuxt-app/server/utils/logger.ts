import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function logAction(acao: string, detalhes: string, userId?: number) {
    try {
        await prisma.systemLog.create({
            data: {
                acao,
                detalhes,
                userId: userId || null
            }
        })
    } catch (error) {
        console.error('Falha ao registrar SystemLog:', error)
    }
}
