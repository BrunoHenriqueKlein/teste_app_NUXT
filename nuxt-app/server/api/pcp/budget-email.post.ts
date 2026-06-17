import { defineEventHandler, createError, readBody } from 'h3'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { osId, itemFornecedorMap, preview, emails } = body

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (!osId || !itemFornecedorMap || Object.keys(itemFornecedorMap).length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OS e mapeamento de peças/fornecedor são obrigatórios'
        })
    }

    try {
        // 1. Buscar dados da OS e Peças
        const os = await prisma.ordemServico.findUnique({
            where: { id: parseInt(osId) },
            include: {
                op: true,
                itens: {
                    include: {
                        peca: {
                            include: {
                                anexos: true
                            }
                        }
                    }
                }
            }
        })

        if (!os) throw new Error('Ordem de Serviço não encontrada')

        // Agrupar itens por fornecedor
        const fornecedorItens: Record<number, any[]> = {}
        for (const item of os.itens) {
            const fId = itemFornecedorMap[item.pecaId]
            if (fId) {
                if (!fornecedorItens[fId]) fornecedorItens[fId] = []
                fornecedorItens[fId].push(item)
            }
        }

        // Buscar todos os fornecedores envolvidos
        const fornecedores = await prisma.fornecedor.findMany({
            where: { id: { in: Object.keys(fornecedorItens).map(Number) } }
        })

        const sender = await prisma.user.findUnique({
            where: { id: userId }
        })

        const deptoMap: Record<string, string> = {
            'ADMINISTRATIVO': 'Administrativo',
            'VENDAS': 'Vendas',
            'ENGENHARIA': 'Engenharia',
            'COMPRAS': 'Compras',
            'PCP': 'PCP',
            'QUALIDADE': 'Qualidade'
        }
        const senderDepto = sender?.department ? (deptoMap[sender.department] || sender.department) : 'Departamento'

        // MODO PREVIEW: Gerar HTML e dados para o Carrossel
        if (preview) {
            const previews = []

            for (const forn of fornecedores) {
                const itensForn = fornecedorItens[forn.id] || []
                
                const pecasTable = itensForn.map((item: any) => `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.codigo}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.descricao}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.peca.quantidade}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.material || '-'}</td>
                    </tr>
                `).join('')

                const attachments = []
                for (const item of itensForn) {
                    if (item.peca.anexos && item.peca.anexos.length > 0) {
                        for (const anexo of item.peca.anexos) {
                            const filePath = path.join(process.cwd(), 'public', anexo.url)
                            if (fs.existsSync(filePath)) {
                                attachments.push({
                                    filename: anexo.nome,
                                    path: filePath
                                })
                            }
                        }
                    }
                }

                const finalSubject = `Solicitação de Orçamento - ${os.op.codigoMaquina} (${os.op.numeroOP}) - ${os.numero}`
                const defaultHtml = `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h2>Solicitação de Orçamento</h2>
                        <p>Olá <strong>${forn.contato || forn.nome}</strong>,</p>
                        <p>Gostaríamos de solicitar um orçamento para os itens listados abaixo, referentes à <strong>Máquina ${os.op.codigoMaquina} (OP ${os.op.numeroOP}) - OS ${os.numero}</strong>.</p>
                        
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
                                ${pecasTable}
                            </tbody>
                        </table>

                        <p style="margin-top: 20px;">Os desenhos técnicos seguem em anexo para análise.</p>
                        <p>Ficamos no aguardo de sua proposta técnica e comercial.</p>
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

                previews.push({
                    fornecedorId: forn.id,
                    fornecedorNome: forn.nome,
                    to: forn.email,
                    subject: finalSubject,
                    html: defaultHtml,
                    attachmentsCount: attachments.length,
                    attachmentsNames: attachments.map(a => a.filename)
                })
            }

            return { preview: true, emails: previews }
        }

        // MODO DISPARO REAL
        // 1. Criar Requisição de Compras no Banco (apenas se já não existir uma aberta) abrangendo TODAS as peças da OS
        let targetCompra = await prisma.compra.findFirst({
            where: {
                osId: os.id,
                status: { in: ['SOLICITADA', 'COTACAO'] }
            }
        })

        if (!targetCompra) {
            const count = await prisma.compra.count()
            const numeroReq = `REQ-OS-${os.numero.split('-').pop()}-${(count + 1).toString().padStart(3, '0')}`

            targetCompra = await prisma.compra.create({
                data: {
                    numero: numeroReq,
                    opId: os.opId,
                    osId: os.id,
                    fornecedor: 'Múltiplos / Cotação',
                    status: 'SOLICITADA',
                    itens: {
                        create: os.itens.map((item: any) => ({
                            pecaId: item.pecaId,
                            descricao: `SERVIÇO: ${os.tipo} - Peça: ${item.peca.codigo}`,
                            quantidade: item.peca.quantidade,
                            valorUnitario: 0
                        }))
                    }
                }
            })
        }

        // 2. Atualizar OS informando que está Aguardando (Orçamento)
        await prisma.ordemServico.update({
            where: { id: os.id },
            data: { status: 'AGUARDANDO' } 
        })

        const bannerPath = path.join(process.cwd(), 'assets', 'imagens', 'banner-assinatura.jpg')
        let totalEnviados = 0
        let errosEnvio = []

        // 3. Tentar enviar e-mail se as credenciais estiverem disponíveis
        if (sender?.mailHost && sender?.mailUser && sender?.mailPass && emails && emails.length > 0) {
            const nodemailer = await import('nodemailer')
            const transporter = nodemailer.default.createTransport({
                host: sender.mailHost,
                port: Number(sender.mailPort || 587),
                secure: sender.mailSecure,
                auth: {
                    user: sender.mailUser,
                    pass: sender.mailPass,
                },
                tls: { rejectUnauthorized: false }
            })

            // Disparar cada e-mail editado pelo usuário
            for (const emailData of emails) {
                const forn = fornecedores.find(f => f.id === emailData.fornecedorId)
                if (!forn || !forn.email) continue

                const itensForn = fornecedorItens[forn.id] || []
                const attachments = []

                if (fs.existsSync(bannerPath)) {
                    attachments.push({
                        filename: 'banner-assinatura.jpg',
                        path: bannerPath,
                        cid: 'banner_assinatura'
                    })
                }

                for (const item of itensForn) {
                    if (item.peca.anexos && item.peca.anexos.length > 0) {
                        for (const anexo of item.peca.anexos) {
                            const filePath = path.join(process.cwd(), 'public', anexo.url)
                            if (fs.existsSync(filePath)) {
                                attachments.push({
                                    filename: anexo.nome,
                                    path: filePath
                                })
                            }
                        }
                    }
                }

                try {
                    await transporter.sendMail({
                        from: `"${sender.mailFrom || sender.name}" <${sender.mailUser}>`,
                        to: forn.email,
                        bcc: sender.mailUser,
                        subject: emailData.subject,
                        html: emailData.html,
                        attachments
                    })
                    totalEnviados++
                } catch (mailError: any) {
                    console.error(`❌ Erro no disparo SMTP para ${forn.nome}:`, mailError)
                    errosEnvio.push(`Falha para ${forn.nome}`)
                }
            }
        }

        let userMessage = 'Requisição no sistema gerada com sucesso!'
        if (totalEnviados > 0) {
            userMessage += ` Foram disparados ${totalEnviados} e-mails de orçamento.`
        }
        if (errosEnvio.length > 0) {
            userMessage += ` (Houve erro no envio para alguns fornecedores)`
        }

        return {
            success: true,
            emailEnviado: totalEnviados > 0,
            message: userMessage,
            compraId: targetCompra.id
        }

    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mails de orçamento:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao processar orçamento: ' + error.message
        })
    }
})
