import twilio from 'twilio';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ipbemaus.org';

let twilioClient: ReturnType<typeof twilio> | null = null;
let resendClient: Resend | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('📱 Twilio SMS configurado');
} else {
  console.warn('⚠️ Twilio não configurado - SMS não disponível');
}

if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY);
  console.log('📧 Resend Email configurado');
} else {
  console.warn('⚠️ Resend não configurado - Email não disponível');
}

export interface VerificationCodeResult {
  success: boolean;
  codigo: string; // Código em texto plano (para enviar)
  hashedCodigo: string; // Código hasheado (para armazenar)
  canal: 'sms' | 'email';
  telefone?: string;
  email?: string;
  erro?: string;
}

export function gerarCodigoVerificacao(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashearCodigo(codigo: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(codigo, salt);
}

export async function compararCodigo(codigo: string, hashedCodigo: string): Promise<boolean> {
  return bcrypt.compare(codigo, hashedCodigo);
}

export function normalizarTelefone(telefone: string): string {
  // Remove tudo exceto dígitos
  const digitos = telefone.replace(/\D/g, '');
  
  // Se não tem código do país, adiciona +55 (Brasil)
  if (digitos.length === 10 || digitos.length === 11) {
    return `+55${digitos}`;
  }
  
  // Se já tem código do país mas sem +
  if (digitos.length > 11 && !telefone.startsWith('+')) {
    return `+${digitos}`;
  }
  
  return telefone;
}

export async function enviarCodigoSMS(
  telefone: string,
  codigo: string,
  titularNome: string
): Promise<{ success: boolean; erro?: string }> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    return {
      success: false,
      erro: 'Serviço de SMS não configurado',
    };
  }

  try {
    const telefoneNormalizado = normalizarTelefone(telefone);
    
    const mensagem = `IPB Emaús - Portal LGPD

Olá, ${titularNome.split(' ')[0]}!

Seu código de verificação é: ${codigo}

Este código expira em 10 minutos.

Se você não solicitou este código, ignore esta mensagem.`;

    await twilioClient.messages.create({
      body: mensagem,
      from: TWILIO_PHONE_NUMBER,
      to: telefoneNormalizado,
    });

    console.log(`✅ SMS enviado para ${telefoneNormalizado.replace(/(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3')}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar SMS:', error.message);
    return {
      success: false,
      erro: error.message || 'Erro ao enviar SMS',
    };
  }
}

export async function enviarCodigoEmail(
  email: string,
  codigo: string,
  titularNome: string
): Promise<{ success: boolean; erro?: string }> {
  if (!resendClient) {
    return {
      success: false,
      erro: 'Serviço de email não configurado',
    };
  }

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de Verificação - IPB Emaús</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Portal LGPD - IPB Emaús</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Olá, <strong>${titularNome.split(' ')[0]}</strong>!</p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
            Você solicitou acesso ao Portal LGPD para exercer seus direitos sobre seus dados pessoais.
          </p>
          
          <div style="background: #f7f7f7; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Seu código de verificação é:</p>
            <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${codigo}
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #856404;">
              ⏱️ <strong>Atenção:</strong> Este código expira em <strong>10 minutos</strong>.
            </p>
          </div>
          
          <p style="font-size: 13px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Se você não solicitou este código, por favor ignore este email. Seus dados estão seguros.
          </p>
          
          <p style="font-size: 13px; color: #999; margin-top: 10px;">
            Em caso de dúvidas, entre em contato com a secretaria da igreja.
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Igreja Presbiteriana do Brasil - Emaús</p>
          <p style="margin: 5px 0 0 0;">Este é um email automático. Por favor, não responda.</p>
        </div>
      </body>
      </html>
    `;

    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Código de Verificação LGPD - IPB Emaús`,
      html: htmlContent,
    });

    console.log(`✅ Email enviado para ${email}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error.message);
    return {
      success: false,
      erro: error.message || 'Erro ao enviar email',
    };
  }
}

export async function enviarCodigoVerificacao(params: {
  titularNome: string;
  telefone?: string;
  email?: string;
}): Promise<VerificationCodeResult> {
  const { titularNome, telefone, email } = params;

  const codigo = gerarCodigoVerificacao();
  const hashedCodigo = await hashearCodigo(codigo);

  // Prioridade: SMS > Email
  if (telefone) {
    const resultadoSMS = await enviarCodigoSMS(telefone, codigo, titularNome);
    
    if (resultadoSMS.success) {
      return {
        success: true,
        codigo,
        hashedCodigo,
        canal: 'sms',
        telefone: normalizarTelefone(telefone),
      };
    }
    
    // Fallback para email se SMS falhar e email estiver disponível
    if (email) {
      console.log('⚠️ SMS falhou, tentando email como fallback...');
      const resultadoEmail = await enviarCodigoEmail(email, codigo, titularNome);
      
      if (resultadoEmail.success) {
        return {
          success: true,
          codigo,
          hashedCodigo,
          canal: 'email',
          email,
        };
      }
      
      return {
        success: false,
        codigo: '',
        hashedCodigo: '',
        canal: 'email',
        erro: `Falha no SMS: ${resultadoSMS.erro}. Falha no Email: ${resultadoEmail.erro}`,
      };
    }
    
    return {
      success: false,
      codigo: '',
      hashedCodigo: '',
      canal: 'sms',
      erro: resultadoSMS.erro,
    };
  }

  // Apenas email disponível
  if (email) {
    const resultadoEmail = await enviarCodigoEmail(email, codigo, titularNome);
    
    if (resultadoEmail.success) {
      return {
        success: true,
        codigo,
        hashedCodigo,
        canal: 'email',
        email,
      };
    }
    
    return {
      success: false,
      codigo: '',
      hashedCodigo: '',
      canal: 'email',
      erro: resultadoEmail.erro,
    };
  }

  return {
    success: false,
    codigo: '',
    hashedCodigo: '',
    canal: 'email',
    erro: 'Nenhum contato (telefone ou email) disponível',
  };
}
