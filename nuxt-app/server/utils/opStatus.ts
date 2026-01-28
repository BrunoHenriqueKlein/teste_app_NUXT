import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Atualiza o status e progresso de uma OP de forma centralizada e inteligente.
 * Regra: O status da OP reflete o 'vinculoStatusOP' do primeiro processo (menor sequência)
 * que estiver com status 'EM_ANDAMENTO'.
 */
export async function updateOPStatus(opId: number) {
    try {
        // 1. Buscar todos os processos da OP
        const processos = await prisma.oPProcesso.findMany({
            where: { opId },
            orderBy: { sequencia: 'asc' }
        })

        if (processos.length === 0) return

        // 2. Calcular progresso médio
        const totalProgresso = processos.reduce((sum, p) => sum + (p.progresso || 0), 0)
        const progressoMedio = Math.round(totalProgresso / processos.length)

        // 3. Definir novo status da OP
        let novoStatusOP: string | null = null

        // Se tudo concluído
        if (progressoMedio === 100) {
            novoStatusOP = 'CONCLUIDA'
        } else {
            // Encontrar o PRIMEIRO processo que NÃO está concluído e tem status EM_ANDAMENTO
            const primeiroAtivo = processos.find(p => p.status === 'EM_ANDAMENTO')

            if (primeiroAtivo && primeiroAtivo.vinculoStatusOP) {
                novoStatusOP = primeiroAtivo.vinculoStatusOP
            } else {
                // Se nenhum está em andamento, mas progresso > 0, talvez manter o status anterior ou AGUARDANDO
                // Mas o usuário quer refletir o andamento. 
                // Se houver processos iniciados mas nenhum "Em Andamento" agora (ex: todos bloqueados ou não iniciados)
                // Não alteramos o status da OP para não confundir, ou mantemos AGUARDANDO se for o início.
            }
        }

        // 4. Preparar dados de atualização
        const dataUpdate: any = {
            progresso: progressoMedio
        }

        if (novoStatusOP) {
            dataUpdate.status = novoStatusOP
        }

        // Se for o início do primeiro processo, garantir data de início da OP
        const op = await prisma.oP.findUnique({
            where: { id: opId },
            select: { dataInicio: true }
        })

        const algumIniciado = processos.some(p => p.status !== 'NAO_INICIADO')
        if (algumIniciado && op && !op.dataInicio) {
            dataUpdate.dataInicio = new Date()
        }

        // 5. Executar atualização
        await prisma.oP.update({
            where: { id: opId },
            data: dataUpdate
        })

        console.log(`✅ OP ${opId} atualizada: Progresso ${progressoMedio}%, Status: ${novoStatusOP || 'Sem alteração'}`)
    } catch (error) {
        console.error(`❌ Erro ao atualizar status da OP ${opId}:`, error)
    }
}
