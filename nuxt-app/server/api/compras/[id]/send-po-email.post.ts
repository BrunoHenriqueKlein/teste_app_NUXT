import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const compraId = getRouterParam(event, 'id')

    const userId = event.context.user?.id
    if (!userId) {
        throw createError({ statusCode: 401, statusMessage: 'Usuário não autenticado' })
    }

    if (!compraId) {
        throw createError({ statusCode: 400, statusMessage: 'ID da Compra é obrigatório' })
    }

    try {
        // 1. Buscar dados da Compra
        const compra = await prisma.compra.findUnique({
            where: { id: parseInt(compraId) },
            include: {
                fornecedorRef: true,
                op: true,
                os: {
                    include: {
                        op: true
                    }
                },
                itens: {
                    include: {
                        peca: true
                    }
                },
                anexos: true
            }
        })

        if (!compra) throw new Error('Ordem de Compra não encontrada')
        if (!compra.fornecedorRef || !compra.fornecedorRef.email) {
            throw new Error('Fornecedor não encontrado ou sem e-mail cadastrado no sistema.')
        }

        // 2. Buscar remetente (Usuário Logado) e Credenciais SMTP
        const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                department: true,
                mailHost: true,
                mailPort: true,
                mailSecure: true,
                mailUser: true,
                mailPass: true,
                mailFrom: true
            }
        })

        if (!sender?.mailHost || !sender?.mailUser || !sender?.mailPass) {
            throw new Error('As credenciais SMTP não estão configuradas no seu perfil.')
        }

        const body = await readBody(event)
        const poImageBase64 = body?.poImageBase64
        const anexosSelecionados = body?.anexosSelecionados || []

        const maquina = compra.os?.op?.codigoMaquina || compra.op?.codigoMaquina || 'S/ MÁQUINA'
        const numeroOP = compra.os?.op?.numeroOP || compra.op?.numeroOP || 'S/ OP'
        const numeroOS = compra.os?.numero ? ` - ${compra.os.numero}` : ''
        const finalSubject = `Solicitação de Compra - ${compra.numero} - ${maquina} (${numeroOP})${numeroOS}`

        const deptoMap: Record<string, string> = {
            'ADMINISTRATIVO': 'Administrativo',
            'VENDAS': 'Vendas',
            'ENGENHARIA': 'Engenharia',
            'COMPRAS': 'Compras',
            'PCP': 'PCP',
            'QUALIDADE': 'Qualidade'
        }
        const senderDepto = sender?.department ? (deptoMap[sender.department] || sender.department) : 'Departamento'

        const autoSend = body?.autoSend === true
        let itemsHtml = ''
        if (!poImageBase64) {
            itemsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Código</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Descrição</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: center;">Qtd</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">V. Unitário</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compra.itens.map(i => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">${i.peca?.codigo || '-'}</td>
                                <td style="border: 1px solid #ddd; padding: 6px;">${i.descricao}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${i.quantidade}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">R$ ${(Number(i.valorUnitario) || 0).toFixed(2)}</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">R$ ${((Number(i.valorUnitario) || 0) * i.quantidade).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right; padding: 6px; font-weight: bold;">Valor Total do Pedido:</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">R$ ${(Number(compra.valorTotal) || 0).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            `
        }

        const finalHtml = `
            <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <p>Prezados, bom dia!</p>
                <p>Segue nosso <strong>Pedido de Compra (${compra.numero})</strong> referente à solicitação cotada.</p>
                ${poImageBase64 ? '<p>Por favor, confira o PDF do pedido e os documentos em anexo.</p>' : '<p>Confira abaixo os itens solicitados e os documentos em anexo.</p>'}
                ${itemsHtml}
                <br>
                <p>Qualquer dúvida, estamos à disposição.</p>
                <br>
                <p>Att...</p>
                <p style="margin-bottom: 5px;">
                    <strong>${sender?.name || 'Sistema SOMEH'}</strong> | ${senderDepto}<br>
                    &#9742; (47) 3202-7221<br>
                    &#127758; <a href="http://www.someh.com.br" style="color: #333; text-decoration: underline;">www.someh.com.br</a>
                </p>
                
                <div style="margin-top: 15px;">
                    <img src="cid:banner-assinatura" alt="SOMEH Redes Sociais" style="max-width: 100%; height: auto;" />
                </div>
            </div>
        `

        // 6. Preparar Anexos (Assinatura + Orçamentos)
        const attachments: any[] = []
        const imagePath = path.resolve(process.cwd(), 'assets/imagens/banner-assinatura.jpg')
        if (fs.existsSync(imagePath)) {
            attachments.push({
                filename: 'banner-assinatura.jpg',
                path: imagePath,
                cid: 'banner-assinatura'
            })
        }

        // Adicionar OC como PDF e Salvar fisicamente para a Engenharia
        if (poImageBase64) {
            // Remove the data URI prefix if it exists
            const base64Data = poImageBase64.includes('base64,') ? poImageBase64.split('base64,')[1] : poImageBase64;
            const pdfBuffer = Buffer.from(base64Data, 'base64')
            
            attachments.push({
                filename: `${compra.numero}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            })
            
            // Salvar no disco para vincular na engenharia (BOM)
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'compras')
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true })
            }
            const filename = `OC-${compra.numero.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}.pdf`
            const filePath = path.join(uploadsDir, filename)
            fs.writeFileSync(filePath, pdfBuffer)
            
            // Vincular na Peça
            for (const item of compra.itens) {
                if (item.pecaId) {
                    // Verifica se já não foi salvo nesta peça
                    const existe = await prisma.pecaAnexo.findFirst({
                        where: { pecaId: item.pecaId, nome: `Pedido de Compra - ${compra.numero}.pdf` }
                    })
                    if (!existe) {
                        await prisma.pecaAnexo.create({
                            data: {
                                pecaId: item.pecaId,
                                nome: `Pedido de Compra - ${compra.numero}.pdf`,
                                url: `/uploads/compras/${filename}`
                            }
                        })
                    }
                }
            }
        }
        
        // Adiciona os anexos da compra (orçamentos vencedores)
        let anexosParaEnviar: any[] = []
        if (autoSend && compra.anexos && compra.anexos.length > 0) {
            anexosParaEnviar = compra.anexos
        } else if (anexosSelecionados && anexosSelecionados.length > 0) {
            anexosParaEnviar = await prisma.compraAnexo.findMany({
                where: { id: { in: anexosSelecionados } }
            })
        }

        anexosParaEnviar.forEach((anexo: any) => {
            const anexoPath = path.join(process.cwd(), 'public', anexo.url)
            if (fs.existsSync(anexoPath)) {
                attachments.push({
                    filename: anexo.nome,
                    path: anexoPath
                })
            }
        })

        // 7. Enviar o e-mail via SMTP
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

        await transporter.sendMail({
            from: `"${sender.mailFrom || sender.nome}" <${sender.mailUser}>`,
            to: compra.fornecedorRef.email,
            bcc: sender.mailUser, // Copia oculta para o comprador
            subject: finalSubject,
            html: finalHtml,
            attachments
        })

        return {
            success: true,
            message: 'Ordem de Compra enviada por e-mail com sucesso.'
        }

    } catch (error: any) {
        console.error('❌ Erro ao enviar OC:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao enviar OC: ' + error.message
        })
    }
})
