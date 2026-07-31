import { defineEventHandler, createError, readBody } from 'h3'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event: any) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { preview, htmlEditado, subjectEditado, toEditado } = body

    const roteiroIdStr = event.context.params?.id
    const roteiroId = parseInt(roteiroIdStr as string)

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (isNaN(roteiroId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'ID do Roteiro inválido'
        })
    }

    try {
        // 1. Buscar dados do Roteiro
        const roteiro = await prisma.roteiro.findUnique({
            where: { id: roteiroId },
            include: {
                fornecedor: true,
                op: true,
                itens: {
                    include: {
                        peca: true
                    }
                }
            }
        })

        if (!roteiro) throw new Error('Roteiro não encontrado')
        if (!roteiro.fornecedor) throw new Error('Este roteiro não possui um fornecedor definido')

        const forn = roteiro.fornecedor
        const sender = await prisma.user.findUnique({ where: { id: userId } })

        const deptoMap: Record<string, string> = {
            'ADMINISTRATIVO': 'Administrativo',
            'VENDAS': 'Vendas',
            'ENGENHARIA': 'Engenharia',
            'COMPRAS': 'Compras',
            'PCP': 'PCP',
            'QUALIDADE': 'Qualidade'
        }
        const senderDepto = sender?.department ? (deptoMap[sender.department] || sender.department) : 'Departamento'

        // MODO PREVIEW: Gerar HTML e dados
        if (preview) {
            const pecasTable = roteiro.itens.map((item: any) => {
                const imgUrl = item.imagemUrl || item.peca?.imagem
                let imgTag = '-'
                if (imgUrl) {
                    imgTag = `<img src="${imgUrl}" alt="Foto" width="100" height="75" style="display: block; width: 100px; height: 75px; object-fit: contain; border-radius: 4px;" />`
                }

                return `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${imgTag}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.codigo || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.descricao || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantidade}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.tratamento || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.peca.detalheTratamento || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.pesoIndividual ? Number(item.pesoIndividual).toFixed(1) + ' kg' : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.areaSuperficial ? Number(item.areaSuperficial).toFixed(1) : '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.dimensoesExternas || '-'}</td>
                </tr>
                `
            }).join('')

            const finalSubject = `Solicitação de Orçamento - Roteiro ${roteiro.numero}`
            const defaultHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Solicitação de Orçamento</h2>
                    <p>Olá <strong>${forn.contato || forn.nome}</strong>,</p>
                    <p>Gostaríamos de solicitar um orçamento para os itens listados abaixo, referentes ao <strong>Roteiro ${roteiro.numero}</strong>.</p>
                    
                    <div style="margin-top: 20px; margin-bottom: 20px;">
                        <strong>Observações:</strong>
                        <p style="margin-top: 8px; padding: 12px; border-left: 4px solid #1a73e8; background-color: #f8f9fa; color: #333; font-style: italic;">
                            Tipo de Roteiro: <strong>${roteiro.tipo}</strong><br/>
                            ${roteiro.observacoes ? `Detalhes adicionais: ${roteiro.observacoes}` : ''}
                        </p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Foto</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Código</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Descrição</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qtd</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tratamento</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cor / Detalhe</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Peso Un.</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Área (m²)</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dimensões</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pecasTable}
                        </tbody>
                    </table>

                    <p style="margin-top: 20px;">Ficamos no aguardo de sua proposta técnica e comercial.</p>
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

            return { 
                preview: true, 
                emailData: {
                    fornecedorNome: forn.nome,
                    to: forn.email,
                    subject: finalSubject,
                    html: defaultHtml
                }
            }
        }

        // MODO DISPARO REAL
        let finalHtml = htmlEditado;
        const bannerPath = path.join(process.cwd(), 'assets', 'imagens', 'banner-assinatura.jpg')
        
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

            const attachments = []
            if (fs.existsSync(bannerPath)) {
                attachments.push({
                    filename: 'banner-assinatura.jpg',
                    path: bannerPath,
                    cid: 'banner_assinatura'
                })
            }

            // Anexar as imagens das peças como CIDs e substituir no HTML final
            for (const item of roteiro.itens) {
                const imgUrl = item.imagemUrl || item.peca?.imagem
                if (imgUrl && finalHtml.includes(imgUrl)) {
                    finalHtml = finalHtml.split(imgUrl).join(`cid:img_${item.id}`)
                    const filePath = path.join(process.cwd(), 'public', imgUrl)
                    if (fs.existsSync(filePath)) {
                        attachments.push({
                            filename: `foto_${item.id}.jpg`,
                            path: filePath,
                            cid: `img_${item.id}`
                        })
                    }
                }
            }

            try {
                await transporter.sendMail({
                    from: `"${sender.mailFrom || sender.name}" <${sender.mailUser}>`,
                    to: toEditado || forn.email,
                    bcc: sender.mailUser,
                    subject: subjectEditado,
                    html: finalHtml,
                    attachments: attachments
                })
            } catch (mailError: any) {
                console.error(`❌ Erro no disparo SMTP para ${forn.nome}:`, mailError)
                throw new Error('Falha de SMTP: ' + mailError.message)
            }
        } else {
            throw new Error('Credenciais de e-mail do usuário não configuradas.')
        }

        // 2. Atualizar Roteiro informando que está Aguardando Orçamento
        await prisma.roteiro.update({
            where: { id: roteiro.id },
            data: { status: 'AGUARDANDO_ORCAMENTO' } 
        })

        try {
            const { logAction } = await import('../../../utils/logger')
            await logAction(
                'Solicitação de Orçamento de Roteiro',
                `Solicitado orçamento do roteiro ${roteiro.numero} para o fornecedor: ${forn.nome}.`,
                userId
            )
        } catch (e) {
            console.error('Erro ao registrar log de orçamento:', e)
        }

        return {
            success: true,
            message: 'E-mail enviado com sucesso e Roteiro atualizado!'
        }

    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mail de roteiro:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao processar e-mail: ' + error.message
        })
    }
})
