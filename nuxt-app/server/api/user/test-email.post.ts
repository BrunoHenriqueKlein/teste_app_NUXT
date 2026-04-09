export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { mailHost, mailPort, mailUser, mailPass, mailSecure, mailFrom } = body

    if (!mailHost || !mailUser || !mailPass) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Dados de SMTP incompletos para o teste'
        })
    }

    try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
            host: mailHost,
            port: Number(mailPort || 587),
            secure: mailSecure,
            auth: {
                user: mailUser,
                pass: mailPass,
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        // Verifica a conexão
        await transporter.verify()

        return {
            success: true,
            message: 'Conexão estabelecida com sucesso! Seu servidor de e-mail está pronto.'
        }
    } catch (error: any) {
        console.error('❌ Erro no teste de SMTP:', error)

        let detail = error.message
        if (error.code === 'EAUTH') {
            detail = 'Falha na autenticação. Se você usa Gmail ou Outlook com Verificação em 2 Etapas, você PRECISA usar uma "Senha de App" em vez da sua senha comum.'
        } else if (error.code === 'ESOCKET') {
            detail = 'Erro de conexão (Timeout/Porta errada). Verifique se o servidor e a porta estão corretos.'
        }

        throw createError({
            statusCode: 500,
            statusMessage: detail
        })
    }
})
