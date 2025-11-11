import { Resend } from "resend";
import type { Boletim } from "@shared/schema";

interface EnviarEmailParams {
  destinatarios: string[];
  assunto: string;
  html: string;
  pdfUrl?: string;
}

interface ResultadoEnvio {
  sucesso: boolean;
  mensagem: string;
  erro?: string;
}

// Inicializa Resend com a chave da API (se disponível)
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log("✅ Resend configurado com sucesso");
  } else {
    console.warn("⚠️  RESEND_API_KEY não configurada - emails serão simulados");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Resend:", error);
}

/**
 * Envia um email usando Resend
 * Se o Resend não estiver configurado, simula o envio (modo fallback)
 */
export async function enviarEmail({
  destinatarios,
  assunto,
  html,
  pdfUrl,
}: EnviarEmailParams): Promise<ResultadoEnvio> {
  // Validação básica
  if (!destinatarios || destinatarios.length === 0) {
    return {
      sucesso: false,
      mensagem: "Nenhum destinatário especificado",
      erro: "INVALID_RECIPIENTS",
    };
  }

  // Modo fallback: simula envio quando Resend não está configurado
  if (!resend) {
    console.log("📧 [SIMULAÇÃO] Email seria enviado para:", destinatarios);
    console.log("📋 Assunto:", assunto);
    console.log("📄 PDF URL:", pdfUrl || "Nenhum anexo");
    
    return {
      sucesso: true,
      mensagem: `Email simulado com sucesso para ${destinatarios.length} destinatário(s). Configure RESEND_API_KEY para envio real.`,
    };
  }

  // Envio real via Resend
  try {
    const { data, error } = await resend.emails.send({
      from: "IPB Emaús <noreply@ipbemaus.com.br>", // Ajustar com domínio verificado
      to: destinatarios,
      subject: assunto,
      html,
      // Se houver PDF, incluir link no corpo (anexo requer processamento adicional)
    });

    if (error) {
      console.error("❌ Erro ao enviar email via Resend:", error);
      return {
        sucesso: false,
        mensagem: "Falha ao enviar email",
        erro: error.message || String(error),
      };
    }

    console.log("✅ Email enviado com sucesso:", data?.id);
    return {
      sucesso: true,
      mensagem: `Email enviado com sucesso para ${destinatarios.length} destinatário(s)`,
    };
  } catch (error: any) {
    console.error("❌ Exceção ao enviar email:", error);
    
    return {
      sucesso: false,
      mensagem: "Falha ao enviar email",
      erro: error.message,
    };
  }
}

/**
 * Gera o HTML do email para envio do boletim dominical
 */
export function gerarHtmlBoletim(boletim: Boletim, pdfUrl?: string): string {
  const dataFormatada = new Date(boletim.data + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Boletim Dominical</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #1e3a8a;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #1e3a8a;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          color: #64748b;
          margin: 10px 0 0 0;
        }
        .content {
          margin: 20px 0;
        }
        .content h2 {
          color: #1e3a8a;
          font-size: 18px;
          margin-top: 20px;
        }
        .content p {
          margin: 10px 0;
        }
        .download-button {
          display: inline-block;
          background-color: #1e3a8a;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
          text-align: center;
        }
        .download-button:hover {
          background-color: #2563eb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Igreja Presbiteriana do Brasil Emaús</h1>
          <p>Boletim Dominical - Edição nº ${boletim.numeroEdicao}/${boletim.anoEdicao}</p>
          <p>${dataFormatada}</p>
        </div>

        <div class="content">
          <h2>${boletim.tituloMensagem}</h2>
          ${boletim.textoMensagem ? `<p><em>${boletim.textoMensagem}</em></p>` : ""}

          ${
            pdfUrl
              ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" class="download-button">
              Baixar Boletim Completo (PDF)
            </a>
          </div>
          `
              : ""
          }

          <p>Que a Palavra de Deus ilumine nossos corações neste domingo!</p>
        </div>

        <div class="footer">
          <p>Igreja Presbiteriana do Brasil Emaús</p>
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envia o boletim dominical por email
 */
export async function enviarBoletimPorEmail(
  boletim: Boletim,
  destinatarios: string[],
  pdfUrl?: string
): Promise<ResultadoEnvio> {
  const dataFormatada = new Date(boletim.data + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const assunto = `Boletim Dominical - ${dataFormatada} - ${boletim.tituloMensagem}`;
  const html = gerarHtmlBoletim(boletim, pdfUrl);

  return await enviarEmail({
    destinatarios,
    assunto,
    html,
    pdfUrl,
  });
}
