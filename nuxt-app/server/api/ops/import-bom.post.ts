import { defineEventHandler, createError, readBody, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
    const user = event.context.user
    const swSecret = getHeader(event, 'X-SW-Secret')

    // Permitir se for usuário logado OU se for a macro com o segredo correto
    if (!user && swSecret !== 'someh-sw-integration-2024') {
        throw createError({
            statusCode: 401,
            statusMessage: 'Não autorizado'
        })
    }

    const prisma = event.context.prisma
    const body = await readBody(event)

    const { numeroOP, peca } = body
    console.log(`📥 Recebendo importação SW para OP: ${numeroOP}, Peça: ${peca?.codigo}`)

    if (!numeroOP || !peca || !peca.codigo) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dados inválidos. Número da OP e código da peça são obrigatórios.'
        })
    }

    try {
        // 1. Localizar a OP
        const op = await prisma.oP.findUnique({
            where: { numeroOP }
        })

        if (!op) {
            throw createError({
                statusCode: 404,
                statusMessage: `Ordem de Produção ${numeroOP} não encontrada.`
            })
        }

        // 1.5 Buscar item no estoque para auto-completar dados se existir
        const itemEstoque = await prisma.estoque.findUnique({
            where: { codigo: peca.codigo }
        })

        const descFinal = peca.descricao || (itemEstoque ? itemEstoque.descricao : '') || ''
        const matFinal = peca.material || (itemEstoque ? itemEstoque.material : '') || ''
        const catRaw = peca.categoria || (itemEstoque ? itemEstoque.categoria : '') || 'FABRICADO'
        const catFinal = (String(catRaw).toUpperCase() === 'COMERCIAL' || String(catRaw).toUpperCase() === 'COMPRADO') ? 'COMERCIAL' : 'FABRICADO'
        const subcatFinal = peca.subcategoria || (itemEstoque ? itemEstoque.subcategoria : '') || ''
        
        const valUnit = (itemEstoque?.valorUnitario) ? itemEstoque.valorUnitario : null
        const valIPI = (itemEstoque?.impostoIPI) ? itemEstoque.impostoIPI : null
        const valUnitComImposto = valUnit ? (valUnit + (valUnit * (valIPI || 0) / 100)) : null
        const qtdFinal = peca.quantidade || 1

        // 2. Upsert da Peça
        const pecaCriada = await prisma.peca.upsert({
            where: {
                opId_codigo: {
                    opId: op.id,
                    codigo: peca.codigo
                }
            },
            update: {
                descricao: descFinal,
                material: matFinal,
                quantidade: qtdFinal,
                categoria: catFinal,
                subcategoria: subcatFinal,
                valorUnitario: valUnit,
                valorIPI: valIPI,
                custoTotal: valUnitComImposto ? valUnitComImposto * qtdFinal : undefined
            },
            create: {
                opId: op.id,
                codigo: peca.codigo,
                descricao: descFinal,
                material: matFinal,
                quantidade: qtdFinal,
                categoria: catFinal,
                subcategoria: subcatFinal,
                valorUnitario: valUnit,
                valorIPI: valIPI,
                custoTotal: valUnitComImposto ? valUnitComImposto * qtdFinal : null,
                status: 'NAO_INICIADA'
            }
        })

        // 3. Lógica de Processos
        let processosParaInserir = peca.processos

        // Se não vierem processos, tentar buscar de uma importação anterior da mesma peça em outra OP (Memória)
        if (!processosParaInserir || processosParaInserir.length === 0) {
            const ultimaPecaComProcessos = await prisma.peca.findFirst({
                where: {
                    codigo: peca.codigo,
                    processos: { some: {} }
                },
                include: { processos: { orderBy: { sequencia: 'asc' } } }
            })

            if (ultimaPecaComProcessos) {
                processosParaInserir = ultimaPecaComProcessos.processos.map(p => p.nome)
            }
        }

        // Atualizar Processos da Peça
        await prisma.processoPeca.deleteMany({
            where: { pecaId: pecaCriada.id }
        })

        if (processosParaInserir && Array.isArray(processosParaInserir)) {
            const processosData = processosParaInserir.map((nome: string, index: number) => ({
                pecaId: pecaCriada.id,
                nome: nome,
                sequencia: index + 1,
                status: 'NAO_INICIADO'
            }))

            await prisma.processoPeca.createMany({
                data: processosData
            })
        }

        return {
            success: true,
            message: `Peça ${peca.codigo} processada.`,
            pecaId: pecaCriada.id,
            sugeriuProcessos: !peca.processos?.length && processosParaInserir?.length > 0
        }
    } catch (error) {
        console.error('Erro ao importar BOM do SolidWorks:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro interno ao processar a importação.'
        })
    }
})
