import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
    console.log('⚠️  INICIANDO LIMPEZA TOTAL DE DADOS OPERACIONAIS ⚠️')
    console.log('------------------------------------------------')

    try {
        // 1. Limpar OPs (Cascata apaga: Peças, Processos, OS, Histórico, Arquivos, Compras vinculadas)
        console.log('🗑️  Excluindo todas as Ordens de Produção...')
        const ops = await prisma.oP.deleteMany({})
        console.log(`   -> ${ops.count} OPs excluídas.`)

        // 2. Limpar Compras soltas (que não estavam vinculadas a OPs)
        console.log('🗑️  Excluindo compras avulsas...')
        const compras = await prisma.compra.deleteMany({})
        console.log(`   -> ${compras.count} compras excluídas.`)

        // 3. Limpar Estoque e Movimentações
        console.log('🗑️  Excluindo movimentações e itens de estoque...')
        await prisma.estoqueMovimentacao.deleteMany({})
        const estoque = await prisma.estoque.deleteMany({})
        console.log(`   -> ${estoque.count} itens de estoque excluídos.`)

        // 4. Limpar Fornecedores (Cascata apaga vínculos restantes)
        console.log('🗑️  Excluindo fornecedores...')
        const fornecedores = await prisma.fornecedor.deleteMany({})
        console.log(`   -> ${fornecedores.count} fornecedores excluídos.`)

        // 5. Limpar Usuários (EXCETO ADMIN)
        console.log('🗑️  Excluindo usuários (exceto Admin)...')

        // Primeiro pegar os IDs dos usuários que serão excluídos
        const usersToDelete = await prisma.user.findMany({
            where: {
                email: { not: 'admin@empresa.com' }
            },
            select: { id: true }
        })
        const userIds = usersToDelete.map(u => u.id)

        if (userIds.length > 0) {
            // Deletar permissões primeiro
            await prisma.userModule.deleteMany({
                where: {
                    userId: { in: userIds }
                }
            })

            // Agora deletar os usuários
            const users = await prisma.user.deleteMany({
                where: {
                    id: { in: userIds }
                }
            })
            console.log(`   -> ${users.count} usuários excluídos.`)
        } else {
            console.log('   -> Nenhum outro usuário para excluir.')
        }

        console.log('------------------------------------------------')
        console.log('✅ LIMPEZA CONCLUÍDA!')
        console.log('🔒 DADOS PRESERVADOS:')
        console.log('   - Usuário Admin')
        console.log('   - Configurações de Processos Padrão')
        console.log('   - Templates de OP')
        console.log('   - Categorias de Fornecedor')
        console.log('   - Módulos do Sistema')

    } catch (error) {
        console.error('❌ Erro ao limpar banco de dados:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetDatabase()
