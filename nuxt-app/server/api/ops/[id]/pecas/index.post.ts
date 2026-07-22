import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
    const opId = getRouterParam(event, 'id')
    if (!opId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OP não informado'
        })
    }

    const prisma = event.context.prisma
    const body = await readBody(event)

    try {
        // 1. Verificar se a peça já existe nesta OP (Evitar erro de unique constraint)
        const existePeca = await prisma.peca.findUnique({
            where: {
                opId_codigo: {
                    opId: parseInt(opId),
                    codigo: body.codigo
                }
            }
        })

        if (existePeca) {
            throw createError({
                statusCode: 409,
                message: `Já existe uma peça cadastrada com o código "${body.codigo}" nesta lista (BOM).`
            })
        }

        // 2. Verificar se o código já existe no estoque para marcar temNoEstoque
        const estoqueItem = await prisma.estoque.findUnique({
            where: { codigo: body.codigo }
        })

        const qtd = body.quantidade || 1
        const desc = body.descricao || (estoqueItem ? estoqueItem.descricao : '') || ''
        const mat = body.material || (estoqueItem ? estoqueItem.material : '') || ''
        const catRaw = body.categoria || (estoqueItem ? estoqueItem.categoria : '') || 'FABRICADO'
        const catFinal = (String(catRaw).toUpperCase() === 'COMERCIAL' || String(catRaw).toUpperCase() === 'COMPRADO') ? 'COMERCIAL' : 'FABRICADO'
        const subcat = body.subcategoria || (estoqueItem ? estoqueItem.subcategoria : '') || ''

        const vUnit = (body.valorUnitario !== undefined && body.valorUnitario !== null && body.valorUnitario !== '') 
            ? parseFloat(body.valorUnitario) 
            : (estoqueItem?.valorUnitario ?? null)
            
        const vIPI = (body.valorIPI !== undefined && body.valorIPI !== null && body.valorIPI !== '') 
            ? parseFloat(body.valorIPI) 
            : (estoqueItem?.impostoIPI ?? null)
            
        const vICMS = (body.valorICMS !== undefined && body.valorICMS !== null && body.valorICMS !== '') 
            ? parseFloat(body.valorICMS) 
            : null
        
        let vUnitComImposto = vUnit;
        if (vUnit) {
            vUnitComImposto = vUnit + (vUnit * (vIPI || 0) / 100) + (vUnit * (vICMS || 0) / 100);
        }

        const peca = await prisma.peca.create({
            data: {
                opId: parseInt(opId),
                codigo: body.codigo,
                descricao: desc,
                quantidade: qtd,
                material: mat,
                categoria: catFinal,
                subcategoria: subcat,
                subconjunto: body.subconjunto,
                statusSuprimento: body.statusSuprimento || 'NAO_SOLICITADO',
                valorUnitario: vUnit,
                valorIPI: vIPI,
                valorICMS: vICMS,
                custoTotal: vUnitComImposto ? vUnitComImposto * qtd : null,
                fornecedorId: body.fornecedorId ? parseInt(body.fornecedorId) : null,
                status: 'NAO_INICIADA'
            }
        })

        return peca
    } catch (error: any) {
        // Se já for um erro do H3 (como o 409 acima), apenas repassa
        if (error.statusCode && error.statusCode < 500) throw error

        console.error('❌ Erro ao inserir peça manualmente:', error)
        throw createError({
            statusCode: 500,
            message: 'Erro ao inserir peça: ' + error.message
        })
    }
})
