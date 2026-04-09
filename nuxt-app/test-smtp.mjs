
import nodemailer from 'nodemailer';

async function test() {
    console.log('Iniciando teste de conexão para brunohklein@outlook.com...');

    const transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: 'brunohklein@outlook.com',
            pass: 'zMDJ}mVHT1Oka6%b'
        },
        tls: {
            rejectUnauthorized: false
        },
        debug: true,
        logger: true
    });

    try {
        console.log('Verificando transporter...');
        await transporter.verify();
        console.log('✅ SUCESSO: Autenticação concluída!');
    } catch (error) {
        console.error('❌ ERRO DE AUTENTICAÇÃO:', error.message);
        if (error.code === 'EAUTH') {
            console.log('Dica: Verifique se a Senha de App está correta e se o SMTP está habilitado no Outlook.');
        }
    }
}

test();
