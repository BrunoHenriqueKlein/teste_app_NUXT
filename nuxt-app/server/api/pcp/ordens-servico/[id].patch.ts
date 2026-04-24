import { defineEventHandler, createError, readBody, H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    const prisma = event.context.prisma
    const id = parseInt(event.context.params?.id || '')
    const body = await readBody(event)

    if (isNaN(id)) {
        throw createError({ statusCode: 400, message: 'ID da OS inválido' })
    }

    try {
        const updatedOS = await prisma.ordemServico.update({
            where: { id },
            data: {
                status: body.status,
                // Poderíamos adicionar dataFinalizacao se for CONCLUIDO
                ...(body.status === 'CONCLUIDO' ? { dataFinalizacao: new Date() } : {})
            }
        })

        // Se a OS for marcada como CONCLUIDO, podemos querer atualizar os ProcessoPeca vinculados
        if (body.status === 'CONCLUIDO') {
            await prisma.processoPeca.updateMany({
                where: { osId: id },
                data: { status: 'CONCLUIDO' }
            })
        }

        // Se a OS for CANCELADA, cancela também a Compra associada (Requisição/OC)
        if (body.status === 'CANCELADO') {
            // Cancela a Compra geral se houver
            await prisma.compra.updateMany({
                where: { osId: id },
                data: { status: 'CANCELADA' }
            })
            // Também cancela os detalhes dos processos vinculados
            await prisma.processoPeca.updateMany({
                where: { osId: id },
                data: { status: 'CANCELADO' }
            })
        }

        return { success: true, os: updatedOS }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            message: 'Erro ao atualizar status da OS: ' + error.message
        })
    }
})
