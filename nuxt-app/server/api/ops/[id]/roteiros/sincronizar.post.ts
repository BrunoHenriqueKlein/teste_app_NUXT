import { defineEventHandler, createError, getRouterParam } from 'h3'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const opIdStr = getRouterParam(event, 'id')
    if (!opIdStr) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
        })
    }

    const opId = parseInt(opIdStr)

    try {
        const op = await prisma.oP.findUnique({
            where: { id: opId },
            include: { pecas: true }
        })

        if (!op) {
            throw createError({ statusCode: 404, statusMessage: 'OP não encontrada' })
        }

        let criados = 0

        // Para cada peça, verificar se precisa de roteiro
        for (const peca of op.pecas) {
            // Se for "Sem tratamento superficial" ou vazio, removemos itens de roteiros existentes dessa peça
            if (!peca.tratamentoSuperficial || peca.tratamentoSuperficial.toLowerCase() === 'sem tratamento superficial') {
                await prisma.roteiroItem.deleteMany({
                    where: { pecaId: peca.id }
                })
                continue
            }

            // Descobre o tipo
            const tratamento = String(peca.tratamentoSuperficial).toUpperCase()
            let tipoRoteiro = 'OUTROS'
            if (tratamento.includes('ZINCO')) tipoRoteiro = 'ZINCO'
            else if (tratamento.includes('PINTURA')) tipoRoteiro = 'PINTURA'

            // Busca se a OP já tem esse roteiro
            let roteiro = await prisma.roteiro.findFirst({
                where: { opId: opId, tipo: tipoRoteiro }
            })

            // Se não tem, cria
            if (!roteiro) {
                const numRoteiro = `ROT-${op.numeroOP}-${tipoRoteiro}`
                roteiro = await prisma.roteiro.create({
                    data: {
                        numero: numRoteiro,
                        tipo: tipoRoteiro,
                        opId: opId,
                        status: 'CRIADO'
                    }
                })
                criados++
            }

            // Verifica se a peça já está no roteiro
            const roteiroItemExistente = await prisma.roteiroItem.findFirst({
                where: { roteiroId: roteiro.id, pecaId: peca.id }
            })

            if (roteiroItemExistente) {
                await prisma.roteiroItem.update({
                    where: { id: roteiroItemExistente.id },
                    data: {
                        quantidade: peca.quantidade,
                        pesoIndividual: peca.peso,
                        areaSuperficial: peca.areaSuperficial,
                        dimensoesExternas: peca.dimensoesExternas,
                        tratamento: peca.tratamentoSuperficial || 'Não especificado',
                        imagemUrl: peca.imagem
                    }
                })
            } else {
                // Remove de outros roteiros caso a peça tenha trocado de tipo (ex: de ZINCO pra PINTURA)
                await prisma.roteiroItem.deleteMany({
                    where: { pecaId: peca.id }
                })

                await prisma.roteiroItem.create({
                    data: {
                        roteiroId: roteiro.id,
                        pecaId: peca.id,
                        quantidade: peca.quantidade,
                        pesoIndividual: peca.peso,
                        areaSuperficial: peca.areaSuperficial,
                        dimensoesExternas: peca.dimensoesExternas,
                        tratamento: peca.tratamentoSuperficial || 'Não especificado',
                        imagemUrl: peca.imagem
                    }
                })
            }
        }

        // Deletar roteiros que ficaram vazios
        const roteirosVazios = await prisma.roteiro.findMany({
            where: { opId: opId, itens: { none: {} } }
        })
        
        for (const rv of roteirosVazios) {
            await prisma.roteiro.delete({ where: { id: rv.id } })
        }

        return { success: true, message: 'Roteiros sincronizados com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao sincronizar roteiros:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao sincronizar roteiros da OP.'
        })
    }
})
