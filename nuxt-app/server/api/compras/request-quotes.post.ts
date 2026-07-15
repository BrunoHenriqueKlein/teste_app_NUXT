import { defineEventHandler, createError, readBody } from 'h3'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { pecaIds, fornecedorIds, preview, subject: overrideSubject, html: overrideHtml, directPurchase } = body

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (!pecaIds || !pecaIds.length) {
        throw createError({ statusCode: 400, statusMessage: 'Nenhuma peça selecionada.' })
    }
    
    if (!directPurchase && (!fornecedorIds || !fornecedorIds.length)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'É necessário selecionar peças e fornecedores.'
        })
    }

    try {
        // 1. Buscar peças (Demandas)
        const pecas = await prisma.peca.findMany({
            where: { id: { in: pecaIds } },
            include: {
                op: true,
                anexos: true
            }
        })

        if (!pecas || pecas.length === 0) {
            throw new Error('Nenhuma peça encontrada')
        }

        // 2. Buscar fornecedores
        const fornecedores = await prisma.fornecedor.findMany({
            where: { id: { in: fornecedorIds } }
        })

        if (!fornecedores || fornecedores.length === 0) {
            throw new Error('Nenhum fornecedor válido encontrado')
        }

        // 3. Buscar configurações de e-mail do remetente
        const sender = await prisma.user.findUnique({
            where: { id: userId }
        })

        // 4. Preparar lista de peças para o e-mail
        // Agrupar por OP para facilitar a visualização
        const pecasPorOp: Record<string, any[]> = {}
        for (const peca of pecas) {
            const opKey = peca.op ? `OP ${peca.op.numeroOP}` : 'Uso Geral'
            if (!pecasPorOp[opKey]) pecasPorOp[opKey] = []
            pecasPorOp[opKey].push(peca)
        }

        let pecasTableBody = ''
        for (const [op, listaPecas] of Object.entries(pecasPorOp)) {
            pecasTableBody += `
                <tr>
                    <td colspan="4" style="background-color: #e0e0e0; font-weight: bold; padding: 8px;">${op}</td>
                </tr>
            `
            for (const peca of listaPecas) {
                pecasTableBody += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${peca.codigo}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${peca.descricao}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${peca.quantidade}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${peca.material || '-'}</td>
                    </tr>
                `
            }
        }

        const attachments = []
        let totalSize = 0
        const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024 // 15MB

        for (const peca of pecas) {
            if (peca.anexos && peca.anexos.length > 0) {
                for (const anexo of peca.anexos) {
                    const filePath = path.join(process.cwd(), 'public', anexo.url)
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath)
                        totalSize += stats.size
                        attachments.push({
                            filename: anexo.nome,
                            path: filePath,
                            size: stats.size
                        })
                    }
                }
            }
        }

        const attachmentChunks: any[][] = []
        let currentChunk: any[] = []
        let currentChunkSize = 0

        for (const att of attachments) {
            if (currentChunkSize + att.size > MAX_ATTACHMENT_SIZE && currentChunk.length > 0) {
                attachmentChunks.push(currentChunk)
                currentChunk = []
                currentChunkSize = 0
            }
            currentChunk.push(att)
            currentChunkSize += att.size
        }
        if (currentChunk.length > 0) {
            attachmentChunks.push(currentChunk)
        }


        const deptoMap: Record<string, string> = {
            'ADMINISTRATIVO': 'Administrativo',
            'VENDAS': 'Vendas',
            'ENGENHARIA': 'Engenharia',
            'COMPRAS': 'Compras',
            'PCP': 'PCP',
            'QUALIDADE': 'Qualidade'
        }
        const senderDepto = sender?.department ? (deptoMap[sender.department] || sender.department) : 'Compras'

        // 5. Preparar E-mail Base
        let defaultSubject = `Solicitação de Orçamento - ${pecas.length} item(ns)`
        const opsUnicas = [...new Map(pecas.filter(p => p.op).map(p => [p.op?.id, p.op])).values()]
        
        if (opsUnicas.length > 0) {
            const stringsOP = opsUnicas.map(op => `${op.codigoMaquina} (${op.numeroOP})`)
            defaultSubject = `Solicitação de Orçamento - ${stringsOP.join(' / ')}`
        }
        
        const finalSubject = overrideSubject || defaultSubject
        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Solicitação de Orçamento</h2>
                <p>Olá,</p>
                <p>Gostaríamos de solicitar um orçamento para os itens listados abaixo.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qtd</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Material</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pecasTableBody}
                    </tbody>
                </table>
                
                <p style="margin-top: 20px;">Os desenhos técnicos seguem em anexo para análise.</p>
                
                <p>Ficamos no aguardo de sua proposta técnica e comercial (favor informar impostos e custos de frete, se houver).</p>
                <br>
                <p>Att...</p>
                <p style="margin-bottom: 5px;">
                    <strong>${sender?.name || 'Sistema SOMEH'}</strong> | ${senderDepto}<br>
                    &#9742; (47) 3202-7221<br>
                    &#127758; <a href="http://www.someh.com.br" style="color: #333; text-decoration: underline;">www.someh.com.br</a>
                </p>
                
                <div style="margin-top: 15px;">
                    <img src="cid:banner_assinatura" alt="SOMEH Redes Sociais" style="max-width: 100%; height: auto;" />
                </div>
            </div>
        `
        const finalHtml = overrideHtml || defaultHtml

        // Se for apenas PREVIEW, retornar os dados montados
        if (preview) {
            return {
                preview: true,
                to: fornecedores.map(f => f.email).filter(e => e).join(', '),
                subject: finalSubject,
                html: finalHtml,
                attachmentsCount: attachments.length,
                attachmentsNames: attachments.map(a => a.filename)
            }
        }

        // 6. Enviar os e-mails
        if (!sender?.mailHost || !sender?.mailUser || !sender?.mailPass) {
            throw new Error('Configuração de SMTP ausente no servidor. Verifique o seu perfil.')
        }

        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransport({
            host: sender.mailHost,
            port: Number(sender.mailPort) || 587,
            secure: sender.mailSecure,
            auth: {
                user: sender.mailUser,
                pass: sender.mailPass,
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        let emailsSent = 0
        const errors = []

        if (!directPurchase) {
            for (const fornecedor of fornecedores) {
                if (!fornecedor.email) {
                    errors.push(`Fornecedor ${fornecedor.nome} não possui e-mail.`)
                    continue
                }

                try {
                    // Personaliza o olá para cada fornecedor (opcional)
                    const htmlPersonalizado = finalHtml.replace('<p>Olá,</p>', `<p>Olá <strong>${fornecedor.contato || fornecedor.nome}</strong>,</p>`)
                    const bannerPath = path.join(process.cwd(), 'assets', 'imagens', 'banner-assinatura.jpg')
                    
                    let partesEnviadas = 0
                    
                    // Se não houver anexos, attachmentChunks estará vazio. Precisamos garantir pelo menos 1 envio se não tiver anexos.
                    const chunksToIterate = attachmentChunks.length > 0 ? attachmentChunks : [[]]

                    for (let i = 0; i < chunksToIterate.length; i++) {
                        const currentChunk = chunksToIterate[i]
                        const mailAttachments = [...currentChunk]
                        
                        if (fs.existsSync(bannerPath)) {
                            mailAttachments.push({
                                filename: 'banner-assinatura.jpg',
                                path: bannerPath,
                                cid: 'banner_assinatura'
                            })
                        }

                        let subjectChunk = finalSubject
                        if (chunksToIterate.length > 1) {
                            subjectChunk += ` (Parte ${i + 1} de ${chunksToIterate.length})`
                        }

                        await transporter.sendMail({
                            from: `"${sender.mailFrom || sender.name}" <${sender.mailUser}>`,
                            to: fornecedor.email,
                            bcc: sender.mailUser,
                            subject: subjectChunk,
                            html: htmlPersonalizado,
                            attachments: mailAttachments
                        })
                        partesEnviadas++
                    }
                    
                    if (partesEnviadas > 0) {
                        emailsSent++
                    }
                } catch (err: any) {
                    console.error(`Erro ao enviar para ${fornecedor.email}:`, err)
                    errors.push(`Erro ao enviar para ${fornecedor.nome}: ${err.message}`)
                }
            }
        }

        // 7. Criar a Requisição de Compra e Vincular os Itens
        let successMessage = ''
        
        if (directPurchase || emailsSent > 0) {
            // Cria a OC como SOLICITADA (direta) ou COTACAO (cotação)
            const statusCompra = directPurchase ? 'SOLICITADA' : 'COTACAO'
            const fornecedorName = directPurchase ? 'Compra Direta / Mercado Livre' : 'Múltiplos / Cotação'
            
            const count = await prisma.compra.count()
            const numero = `REQ-${(count + 1).toString().padStart(4, '0')}`

            // Determina a OP e OS principais (pega da primeira peça para ter referência)
            const pecaBase = pecas.find(p => p.opId)
            const opId = pecaBase?.opId || null
            const osId = pecas.find(p => p.osId)?.osId || null

            await prisma.compra.create({
                data: {
                    numero,
                    opId,
                    osId,
                    fornecedor: fornecedorName,
                    status: statusCompra,
                    valorTotal: 0,
                    itens: {
                        create: pecas.map((p: any) => ({
                            pecaId: p.id,
                            descricao: p.descricao,
                            quantidade: p.quantidade,
                            valorUnitario: 0,
                            valorIPI: 0,
                            valorICMS: 0,
                            custoLiquido: 0
                        }))
                    }
                }
            })

            // Atualizar status das peças para saírem da tela de Cotações
            await prisma.peca.updateMany({
                where: { id: { in: pecaIds } },
                data: { statusSuprimento: 'EM_ORCAMENTO' }
            })
            
            if (directPurchase) {
                successMessage = 'Itens enviados para Requisições com sucesso!'
            } else {
                successMessage = `E-mails enviados com sucesso para ${emailsSent} fornecedor(es).` + (errors.length > 0 ? ` (Com ${errors.length} erro(s))` : '')
            }
        }

        if (!directPurchase && emailsSent === 0) {
            return {
                success: false,
                message: `Nenhum e-mail pôde ser enviado. Erros: ${errors.join(' | ')}`
            }
        }

        return {
            success: true,
            message: successMessage,
            errors: errors.length > 0 ? errors : undefined
        }

    } catch (error: any) {
        console.error('❌ Erro no envio de cotação:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Erro interno do servidor ao gerar cotação'
        })
    }
})
