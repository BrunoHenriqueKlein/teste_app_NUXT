import { defineEventHandler, getQuery, createError } from 'h3'
export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma
  try {
    const query = getQuery(event)
    const { status, search, atrasada, dataInicio, dataFim, sortBy, sortOrder } = query

    const where: any = {}

    if (status) {
      if (status === 'IN_PRODUCTION') {
        where.status = {
          in: [
            'EM_ENGENHARIA', 'EM_COMPRAS', 'EM_FABRICACAO', 'EM_AUTOMACAO',
            'EM_PROJETO_ELETRICO', 'EM_CALIBRACAO', 'EM_MONTAGEM', 'EM_TESTES',
            'EM_DOCUMENTACAO', 'EM_EXPEDICAO'
          ]
        }
      } else {
        where.status = status
      }
    }

    if (atrasada === 'true') {
      where.dataEntrega = { lt: new Date() }
      where.status = { notIn: ['CONCLUIDA', 'CANCELADA'] }
    }

    // Filtro por intervalo de data de entrega
    if (dataInicio || dataFim) {
      where.dataEntrega = where.dataEntrega || {}
      if (dataInicio) {
        where.dataEntrega.gte = new Date(String(dataInicio))
      }
      if (dataFim) {
        // Ajustar para o final do dia
        const end = new Date(String(dataFim))
        end.setHours(23, 59, 59, 999)
        where.dataEntrega.lte = end
      }
    }

    if (search) {
      where.OR = [
        { numeroOP: { contains: String(search), mode: 'insensitive' } },
        { cliente: { contains: String(search), mode: 'insensitive' } },
        { descricaoMaquina: { contains: String(search), mode: 'insensitive' } },
        { codigoMaquina: { contains: String(search), mode: 'insensitive' } }
      ]
    }

    // Lógica de Ordenação
    let orderBy: any = { dataCriacao: 'desc' }
    if (sortBy) {
      const order = sortOrder === 'asc' ? 'asc' : 'desc'

      // Mapeamento de campos de ordenação
      const fieldMap: Record<string, string> = {
        'numeroOP': 'numeroOP',
        'descricao': 'descricaoMaquina',
        'cliente': 'cliente',
        'status': 'status',
        'progresso': 'progresso',
        'dataEntrega': 'dataEntrega',
        'dataCriacao': 'dataCriacao'
      }

      const dbField = fieldMap[String(sortBy)]
      if (dbField) {
        orderBy = { [dbField]: order }
      }
    }

    const ops = await prisma.oP.findMany({
      where,
      include: {
        criadoPor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pecas: {
          select: { status: true, statusSuprimento: true }
        }
      },
      orderBy
    })

    const opsComProgresso = ops.map((op: any) => {
      let prontidaoGeral = 0
      if (op.pecas && op.pecas.length > 0) {
        const prontos = op.pecas.filter((p: any) => 
          ['CONCLUIDA', 'EM_ESTOQUE'].includes(p.status) || p.statusSuprimento === 'RECEBIDO'
        ).length
        prontidaoGeral = Math.round((prontos / op.pecas.length) * 100)
      }
      
      const { pecas, ...opSemPecas } = op
      return {
        ...opSemPecas,
        progressoMateriais: prontidaoGeral
      }
    })

    return opsComProgresso
  } catch (error) {
    console.error('Erro ao carregar OPs:', error)
    throw createError({
      statusCode: 500,
      message: 'Erro interno do servidor'
    })
  }
})