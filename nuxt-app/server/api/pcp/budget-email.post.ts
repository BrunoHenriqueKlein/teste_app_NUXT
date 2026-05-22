import { defineEventHandler, createError, readBody } from 'h3'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { osId, fornecedorId, preview, subject: overrideSubject, html: overrideHtml } = body

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (!osId || !fornecedorId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID da OS e do Fornecedor são obrigatórios'
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

        // 2. Buscar dados do Fornecedor
        const fornecedor = await prisma.fornecedor.findUnique({
            where: { id: parseInt(fornecedorId) }
        })

        if (!fornecedor || !fornecedor.email) {
            throw new Error('Fornecedor não encontrado ou sem e-mail cadastrado')
        }

        // 2.1 Buscar configurações de e-mail do remetente
        const sender = await prisma.user.findUnique({
            where: { id: userId }
        })

        // Validação removida daqui para permitir a criação da Requisição mesmo sem SMTP

        // 3. Preparar lista de peças e anexos
        const pecasTable = os.itens.map((item: any) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.codigo}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.descricao}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.peca.quantidade}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.material || '-'}</td>
            </tr>
        `).join('')

        const attachments = []
        for (const item of os.itens) {
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

        const deptoMap: Record<string, string> = {
            'ADMINISTRATIVO': 'Administrativo',
            'VENDAS': 'Vendas',
            'ENGENHARIA': 'Engenharia',
            'COMPRAS': 'Compras',
            'PCP': 'PCP',
            'QUALIDADE': 'Qualidade'
        }
        const senderDepto = sender?.department ? (deptoMap[sender.department] || sender.department) : 'Departamento'

        // 5. Preparar E-mail Final
        const finalSubject = overrideSubject || `Solicitação de Orçamento - ${os.op.codigoMaquina} (${os.op.numeroOP}) - ${os.numero}`
        const defaultHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Solicitação de Orçamento</h2>
                <p>Olá <strong>${fornecedor.contato || fornecedor.nome}</strong>,</p>
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
        const finalHtml = overrideHtml || defaultHtml

        // Se for apenas PREVIEW, retornar os dados montados
        if (preview) {
            return {
                preview: true,
                to: fornecedor.email,
                subject: finalSubject,
                html: finalHtml,
                attachmentsCount: attachments.length,
                attachmentsNames: attachments.map(a => a.filename)
            }
        }

        // 6. Criar Requisição de Compras no Banco (apenas se já não existir uma aberta)
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

        // 7. Atualizar OS informando que está Aguardando (Orçamento)
        await prisma.ordemServico.update({
            where: { id: os.id },
            data: { status: 'AGUARDANDO' } 
        })

        // 7.1. Adicionar o banner da assinatura como anexo embutido (CID)
        const bannerPath = path.join(process.cwd(), 'assets', 'imagens', 'banner-assinatura.jpg')
        if (fs.existsSync(bannerPath)) {
            attachments.push({
                filename: 'banner-assinatura.jpg',
                path: bannerPath,
                cid: 'banner_assinatura' // ID usado no HTML src="cid:banner_assinatura"
            })
        }

        let emailOk = false
        let userMessage = ''

        // 8. Tentar enviar e-mail se as credenciais estiverem disponíveis
        if (sender?.mailHost && sender?.mailUser && sender?.mailPass) {
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

            try {
                await transporter.sendMail({
                    from: `"${sender.mailFrom || sender.name}" <${sender.mailUser}>`,
                    to: fornecedor.email,
                    bcc: sender.mailUser, // Envia cópia oculta para o próprio remetente para registrar envio
                    subject: finalSubject,
                    html: finalHtml,
                    attachments
                })
                emailOk = true
                userMessage = 'E-mail enviado e Requisição gerada.'
            } catch (mailError: any) {
                console.error('❌ Erro no disparo SMTP:', mailError)
                emailOk = false
                userMessage = `Requisição gerada! Porém Falha no E-mail SMTP: ${mailError.message}`
            }
        } else {
            emailOk = false
            userMessage = 'Requisição no sistema gerada com sucesso! (E-mail não disparado pois as credenciais de SMTP não estão configuradas no seu perfil)'
        }

        return {
            success: true,
            emailEnviado: emailOk,
            message: userMessage,
            compraId: targetCompra.id
        }

    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mail de orçamento:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao enviar e-mail: ' + error.message
        })
    }
})
