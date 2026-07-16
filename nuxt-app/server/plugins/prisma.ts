import { PrismaClient } from '@prisma/client'
import { auditContext } from '../utils/asyncContext'

const basePrisma = new PrismaClient()

// Extensão do Prisma para auditoria global
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Ignorar tabelas internas ou relacionadas a log para evitar loop infinito
        const ignoredModels = ['SystemLog', 'ProcessoHistorico']
        if (ignoredModels.includes(model)) {
          return query(args)
        }

        // Focar apenas nas operações que modificam o banco (C, U, D)
        const modifyingOperations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany']
        
        if (modifyingOperations.includes(operation)) {
          // Pegar o userId do contexto assíncrono (injetado pelo z-audit.ts)
          const context = auditContext.getStore()
          const userId = context?.userId || null

          try {
            const result = await query(args)
            
            let detalhesExtra = ''
            
            if (result && typeof result === 'object') {
              if (result.count !== undefined) {
                detalhesExtra = ` (Registros afetados: ${result.count})`
              } else {
                const identificadores = []
                
                // Buscar dados da OP para enriquecer o log
                if (result.opId) {
                  try {
                    const op = await basePrisma.oP.findUnique({
                      where: { id: result.opId },
                      select: { numeroOP: true, codigoMaquina: true }
                    })
                    if (op) {
                      identificadores.push(`OP: ${op.numeroOP} [${op.codigoMaquina || '-'}]`)
                    }
                  } catch (e) {
                    identificadores.push(`OP ID: ${result.opId}`)
                  }
                } else if (result.numeroOP) {
                  identificadores.push(`OP: ${result.numeroOP} [${result.codigoMaquina || '-'}]`)
                }

                // Buscar dados da Peça se for um anexo ou processo vinculado a uma peça
                if (result.pecaId) {
                  try {
                    const peca = await basePrisma.peca.findUnique({
                      where: { id: result.pecaId },
                      include: { op: { select: { numeroOP: true, codigoMaquina: true } } }
                    })
                    if (peca) {
                      identificadores.push(`Peça: ${peca.codigo}`)
                      if (peca.op && !result.opId) {
                        identificadores.push(`OP: ${peca.op.numeroOP} [${peca.op.codigoMaquina || '-'}]`)
                      }
                    }
                  } catch (e) {
                    identificadores.push(`Peça ID: ${result.pecaId}`)
                  }
                }
                
                if (result.id) identificadores.push(`ID: ${result.id}`)
                if (result.codigo && !result.pecaId) identificadores.push(`Cód: ${result.codigo}`)
                if (result.nome) identificadores.push(`Nome: "${result.nome}"`)
                if (result.descricao && !result.nome) identificadores.push(`Desc: "${String(result.descricao).substring(0, 30)}"`)
                
                if (identificadores.length > 0) {
                  detalhesExtra = ` - ${identificadores.join(', ')}`
                }
              }
            }
            
            // Gravar o log após a operação ter sucesso
            await basePrisma.systemLog.create({
              data: {
                user: userId ? { connect: { id: userId } } : undefined,
                acao: `[AUTO] ${operation.toUpperCase()}`,
                detalhes: `Tabela: ${model}${detalhesExtra}`
              }
            }).catch(e => console.error('Erro silencioso ao gravar log global:', e))
            
            return result
          } catch (error) {
            // Em caso de erro, só repassa
            throw error
          }
        }

        // Operações de leitura (findUnique, findMany, etc) passam direto
        return query(args)
      },
    },
  },
})

export default defineNitroPlugin((nitroApp) => {
  console.log('✅ Prisma plugin carregado')
  
  // Injeta o Prisma no contexto de todos os eventos
  nitroApp.hooks.hook('request', (event) => {
    event.context.prisma = prisma
  })
})