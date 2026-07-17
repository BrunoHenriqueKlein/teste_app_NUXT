import { defineEventHandler, createError, readBody } from 'h3'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { compraItemIds, fornecedorIds, preview, subject: overrideSubject, html: overrideHtml, directPurchase } = body

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (!compraItemIds || !compraItemIds.length) {
        throw createError({ statusCode: 400, statusMessage: 'Nenhuma requisição de estoque selecionada.' })
    }
    
    if (!directPurchase && (!fornecedorIds || !fornecedorIds.length)) {
        throw createError({ statusCode: 400, statusMessage: 'É necessário selecionar fornecedores.' })
    }

    try {
        // 1. Buscar os itens de compra selecionados
        const itensSelecionados = await prisma.compraItem.findMany({
            where: { id: { in: compraItemIds } },
            include: { 
                estoque: true,
                compra: true
            }
        })

        if (!itensSelecionados || itensSelecionados.length === 0) {
            throw new Error('Nenhum item selecionado válido encontrado')
        }

        // Agrupar itens por Compra (para exibir no e-mail)
        const comprasMap = new Map()
        for (const item of itensSelecionados) {
            if (!comprasMap.has(item.compraId)) {
                comprasMap.set(item.compraId, {
                    numero: item.compra.numero,
                    itens: []
                })
            }
            comprasMap.get(item.compraId).itens.push(item)
        }
        
        const comprasAgrupadas = Array.from(comprasMap.values())

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
        let pecasTableBody = ''
        let totalItems = 0
        for (const compra of comprasAgrupadas) {
            pecasTableBody += `
                <tr>
                    <td colspan="3" style="background-color: #e0e0e0; font-weight: bold; padding: 8px;">
                        Requisição Interna #${compra.numero}
                    </td>
                </tr>
            `
            for (const item of compra.itens) {
                totalItems++
                pecasTableBody += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${item.estoque?.codigo || '-'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${item.descricao}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.estoque?.material || '-'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantidade}</td>
                    </tr>
                `
            }
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
        const numerosReq = comprasAgrupadas.map(c => `[${c.numero}]`).join(' ')
        let defaultSubject = `Solicitação de Orçamento (Estoque) ${numerosReq}`
        const finalSubject = overrideSubject || defaultSubject
        
        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Solicitação de Orçamento de Materiais</h2>
                <p>Olá,</p>
                <p>Gostaríamos de solicitar um orçamento para reposição de nosso estoque, conforme itens listados abaixo.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Material</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qtd</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pecasTableBody}
                    </tbody>
                </table>
                
                <p style="margin-top: 20px;">Ficamos no aguardo de sua proposta técnica e comercial (favor informar impostos e custos de frete, se houver).</p>
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

        if (preview) {
            return {
                preview: true,
                to: fornecedores.map(f => f.email).filter(e => e).join(', '),
                subject: finalSubject,
                html: finalHtml,
                attachmentsCount: 0
            }
        }

        // 6. Enviar os e-mails (apenas se não for compra direta)
        let emailsSent = 0
        const errors = []

        if (!directPurchase) {
            if (!sender?.mailHost || !sender?.mailUser || !sender?.mailPass) {
                throw new Error('Configuração de SMTP ausente no servidor. Verifique o seu perfil.')
            }

            const nodemailer = await import('nodemailer')
            const path = await import('path')
            const fs = await import('fs')
            
            const transporter = nodemailer.createTransport({
                host: sender.mailHost,
                port: Number(sender.mailPort) || 587,
                secure: sender.mailSecure,
                auth: { user: sender.mailUser, pass: sender.mailPass },
                tls: { rejectUnauthorized: false }
            })

            for (const fornecedor of fornecedores) {
                if (!fornecedor.email) {
                    errors.push(`Fornecedor ${fornecedor.nome} não possui e-mail.`)
                    continue
                }

                try {
                    const htmlPersonalizado = finalHtml.replace('<p>Olá,</p>', `<p>Olá <strong>${fornecedor.contato || fornecedor.nome}</strong>,</p>`)
                    
                    const bannerPath = path.join(process.cwd(), 'assets', 'imagens', 'banner-assinatura.jpg')
                    const mailAttachments = []
                    if (fs.existsSync(bannerPath)) {
                        mailAttachments.push({
                            filename: 'banner-assinatura.jpg',
                            path: bannerPath,
                            cid: 'banner_assinatura'
                        })
                    }
                    
                    await transporter.sendMail({
                        from: `"${sender.mailFrom || sender.name}" <${sender.mailUser}>`,
                        to: fornecedor.email,
                        bcc: sender.mailUser,
                        subject: finalSubject,
                        html: htmlPersonalizado,
                        attachments: mailAttachments
                    })
                    emailsSent++
                } catch (err: any) {
                    console.error(`Erro ao enviar para ${fornecedor.email}:`, err)
                    errors.push(`Erro ao enviar para ${fornecedor.nome}: ${err.message}`)
                }
            }
        } else {
            // Se for compra direta, apenas simulamos que o e-mail foi "enviado" 
            // para que o fluxo prossiga e atualize o status no banco.
            emailsSent = 1
        }

        // 7. Atualizar status e/ou dividir a Requisição
        const novoStatus = directPurchase ? 'SOLICITADA' : 'COTACAO'
        const novoForn = directPurchase ? 'Compra Direta' : 'Múltiplos / Cotação'

        if (emailsSent > 0) {
            const compraIdsProcessar = Array.from(comprasMap.keys())

            for (const cId of compraIdsProcessar) {
                const compraOriginal = await prisma.compra.findUnique({
                    where: { id: cId },
                    include: { itens: true }
                })

                if (!compraOriginal) continue

                const itensDestaCompra = comprasMap.get(cId).itens
                
                if (itensDestaCompra.length === compraOriginal.itens.length) {
                    // Todos os itens selecionados, apenas atualiza
                    await prisma.compra.update({
                        where: { id: cId },
                        data: {
                            status: novoStatus,
                            fornecedor: novoForn
                        }
                    })
                } else {
                    // Seleção parcial: cria nova Compra e move os itens
                    const randomSuffix = Math.floor(100 + Math.random() * 900)
                    const newNumero = `${compraOriginal.numero}-${randomSuffix}`

                    await prisma.compra.create({
                        data: {
                            numero: newNumero,
                            status: novoStatus,
                            fornecedor: novoForn,
                            isEstoque: true,
                            valorTotal: 0,
                            itens: {
                                connect: itensDestaCompra.map(i => ({ id: i.id }))
                            }
                        }
                    })
                }
            }
        }

        if (emailsSent === 0) {
            return {
                success: false,
                message: `Nenhum e-mail pôde ser enviado. Erros: ${errors.join(' | ')}`
            }
        }

        try {
            const { logAction } = await import('../../utils/logger')
            const logMsg = directPurchase 
                ? `Compra Direta de Estoque gerada para ${compraItemIds.length} itens.`
                : `Cotação de Estoque para ${compraItemIds.length} itens enviada para ${emailsSent} fornecedores.`
                
            await logAction('Cotação de Estoque', logMsg, userId)
        } catch (e) {
            console.error('Erro ao registrar log:', e)
        }

        return {
            success: true,
            message: `E-mails enviados com sucesso para ${emailsSent} fornecedor(es).` + (errors.length > 0 ? ` (Com ${errors.length} erro(s))` : ''),
            errors: errors.length > 0 ? errors : undefined
        }

    } catch (error: any) {
        console.error('❌ Erro no envio de cotação de estoque:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Erro interno do servidor ao gerar cotação'
        })
    }
})
