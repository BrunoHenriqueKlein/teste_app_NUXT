import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    try {
        const empresas = await prisma.empresa.findMany()
        return empresas
    } catch (error) {
        return []
    }
})
