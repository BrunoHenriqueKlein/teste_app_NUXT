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

        const finalHtml = `
            <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <p>Prezados, bom dia!</p>
                <p>Segue em anexo nosso <strong>Pedido de Compra (${compra.numero})</strong> referente à solicitação cotada.</p>
                <p>Por favor, confira a imagem e os documentos em anexo.</p>
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

        // Adicionar OC como PDF
        if (poImageBase64) {
            // Remove the data URI prefix if it exists
            const base64Data = poImageBase64.includes('base64,') ? poImageBase64.split('base64,')[1] : poImageBase64;
            attachments.push({
                filename: `${compra.numero}.pdf`,
                content: Buffer.from(base64Data, 'base64'),
                contentType: 'application/pdf'
            })
        }
        
        // Adiciona os anexos da compra (orçamentos vencedores)
        if (compra.anexos && compra.anexos.length > 0) {
            const anexosParaEnviar = compra.anexos.filter(a => anexosSelecionados.includes(a.id))
            anexosParaEnviar.forEach((anexo: any) => {
                const anexoPath = path.join(process.cwd(), 'public', anexo.url)
                if (fs.existsSync(anexoPath)) {
                    attachments.push({
                        filename: anexo.nome,
                        path: anexoPath
                    })
                }
            })
        }

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
