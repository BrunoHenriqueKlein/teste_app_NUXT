import { defineEventHandler, createError, readBody } from 'h3'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'

export default defineEventHandler(async (event) => {
    const prisma = event.context.prisma
    const body = await readBody(event)
    const { osId, fornecedorId } = body

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

        // 4. Configurar Nodemailer (usando variáveis de ambiente)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        })

        // 5. Enviar E-mail
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Sistema SOMEH'}" <${process.env.EMAIL_USER}>`,
            to: fornecedor.email,
            subject: `Solicitação de Orçamento - OS ${os.numero} - OP ${os.op.numeroOP}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Solicitação de Orçamento</h2>
                    <p>Olá <strong>${fornecedor.contato || fornecedor.nome}</strong>,</p>
                    <p>Gostaríamos de solicitar um orçamento para os itens listados abaixo, referentes à <strong>OS ${os.numero}</strong> da <strong>OP ${os.op.numeroOP}</strong>.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
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
                    <p>Atenciosamente,</p>
                    <p><strong>Departamento de Compras/PCP</strong><br>Sistema SOMEH</p>
                </div>
            `,
            attachments
        }

        await transporter.sendMail(mailOptions)

        // 6. Atualizar OS informando que foi enviado para orçamento (opcional)
        // await prisma.ordemServico.update({ where: { id: os.id }, data: { status: 'EM_ORCAMENTO' } })

        return { success: true, message: 'Solicitação enviada com sucesso!' }

    } catch (error: any) {
        console.error('❌ Erro ao enviar e-mail de orçamento:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Falha ao enviar e-mail: ' + error.message
        })
    }
})
