import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    try {
        const [materiasPrimas, estoqueFisico] = await Promise.all([
            prisma.peca.findMany({
            where: {
                OR: [
                    {
                        categoria: 'FABRICADO',
                        tipoMaterial: { not: null }
                    },
                    {
                        categoria: 'MATERIA_PRIMA'
                    }
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
        }),
        prisma.estoque.findMany({
            where: {
                categoria: 'MATERIA_PRIMA'
            }
        })
        ])

        // Remove registros vazios e tudo que for relacionado a "chapa"
        const pecasFiltradas = materiasPrimas.filter(p => {
            if (!p.tipoMaterial || p.tipoMaterial.trim() === '') return false;
            
            const tipoLower = p.tipoMaterial.toLowerCase();
            const descLower = (p.descricao || '').toLowerCase();
            const matLower = (p.material || '').toLowerCase();
            
            // Se for chapa, não entra como matéria prima (comprado direto com corte)
            if (tipoLower.includes('chapa') || descLower.includes('chapa') || matLower.includes('chapa')) {
                return false;
            }
            
            return true;
        })

        return {
            pecas: pecasFiltradas,
            estoque: estoqueFisico
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao buscar matérias-primas: ' + error.message
        })
    }
})
