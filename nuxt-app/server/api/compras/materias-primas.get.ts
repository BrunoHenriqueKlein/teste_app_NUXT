import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        // Busca todas as peças FABRICADAS que tenham material ou tipoMaterial preenchidos
        const materiasPrimas = await prisma.peca.findMany({
            where: {
                categoria: 'FABRICADO',
                OR: [
                    { material: { not: null } },
                    { tipoMaterial: { not: null } }
                ]
            },
            include: {
                op: {
                    select: {
                        numeroOP: true,
                        codigoMaquina: true,
                        status: true
                    }
                }
            },
            orderBy: {
                opId: 'desc'
            }
        })

        // Remove registros onde ambos são vazios mesmo não sendo nulos
        return materiasPrimas.filter(p => 
            (p.material && p.material.trim() !== '') || 
            (p.tipoMaterial && p.tipoMaterial.trim() !== '')
        )
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar matérias-primas: ' + error.message
        })
    }
})
