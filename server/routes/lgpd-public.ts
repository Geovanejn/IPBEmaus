import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { enviarCodigoVerificacao, compararCodigo } from "../notifications";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// ==================== SCHEMAS DE VALIDAÇÃO ====================

const solicitarCodigoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
  telefone: z.string().optional(),
});

const validarCodigoSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "Código deve conter 6 dígitos"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use YYYY-MM-DD)"),
});

// ==================== RATE LIMITERS ====================

// 3 solicitações de código por hora por IP
const solicitarCodigoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: { 
    error: "Muitas solicitações de código. Por favor, aguarde antes de tentar novamente."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Conta todas as requisições
});

// 5 tentativas de validação por hora por IP
const validarCodigoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: {
    error: "Muitas tentativas de validação. Por favor, aguarde antes de tentar novamente."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================

interface LgpdSession {
  titularId: string;
  tipoTitular: "membro" | "visitante";
  tokenId: string;
}

declare global {
  namespace Express {
    interface Request {
      lgpdSession?: LgpdSession;
    }
  }
}

async function validarSessionToken(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionToken = req.headers['x-lgpd-session'] as string || req.cookies?.lgpdSession;
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: "Sessão não encontrada. Por favor, valide seu código primeiro." 
      });
    }
    
    const token = await storage.buscarSessionToken(sessionToken);
    
    if (!token || !token.validado) {
      return res.status(401).json({ 
        error: "Sessão inválida ou expirada. Por favor, solicite um novo código." 
      });
    }
    
    if (!token.sessionExpiresAt || new Date() > new Date(token.sessionExpiresAt)) {
      return res.status(401).json({ 
        error: "Sessão expirada. Por favor, solicite um novo código." 
      });
    }
    
    req.lgpdSession = {
      titularId: token.titularId,
      tipoTitular: token.tipoTitular as "membro" | "visitante",
      tokenId: token.id,
    };
    
    next();
  } catch (error) {
    console.error("Erro ao validar session token:", error);
    res.status(500).json({ error: "Erro ao validar sessão" });
  }
}

// ==================== HELPERS ====================

function obterClienteInfo(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim(),
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}

function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

// ==================== ROTAS PÚBLICAS LGPD ====================

export function registerPublicLgpdRoutes(app: Express) {
  
  // ==================== SOLICITAR CÓDIGO DE VERIFICAÇÃO ====================
  app.post("/api/lgpd/solicitar-codigo", solicitarCodigoLimiter, async (req, res) => {
    const { ipAddress, userAgent } = obterClienteInfo(req);
    
    try {
      // Validar entrada
      const validacao = solicitarCodigoSchema.safeParse(req.body);
      
      if (!validacao.success) {
        return res.status(400).json({ 
          error: "Dados inválidos. Verifique as informações fornecidas." 
        });
      }
      
      const { nome, cpf, dataNascimento, telefone } = validacao.data;
      
      // Normalizar CPF
      const cpfNormalizado = normalizarCPF(cpf);
      
      // Buscar titular
      const resultado = await storage.buscarTitularPorIdentidade({
        nome,
        cpf: cpfNormalizado,
        dataNascimento,
      });
      
      // Resposta genérica para evitar enumeração
      if (!resultado) {
        // Registrar tentativa de acesso com titular não encontrado
        await storage.registrarLgpdAccessLog({
          tipoTitular: "membro", // Arbitrário, pois não encontrou
          titularId: "unknown",
          titularNome: nome,
          acao: "solicitar_codigo",
          canalVerificacao: telefone ? "sms" : "email",
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: "titular_nao_encontrado",
        });
        
        // Retornar sucesso genérico
        return res.json({
          message: "Se os dados estiverem corretos, você receberá um código de verificação em breve.",
        });
      }
      
      const { tipo, titular } = resultado;
      
      // Verificar se já existe código válido (não reemitir)
      const tokenExistente = await storage.buscarVerificationToken("", titular.id);
      
      if (tokenExistente) {
        // Já existe código válido não expirado
        await storage.registrarLgpdAccessLog({
          tipoTitular: tipo,
          titularId: titular.id,
          titularNome: titular.nome,
          acao: "solicitar_codigo",
          canalVerificacao: tokenExistente.canal as "sms" | "email",
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: "codigo_ja_enviado",
        });
        
        return res.json({
          message: "Se os dados estiverem corretos, você receberá um código de verificação em breve.",
        });
      }
      
      // Enviar código
      const resultadoEnvio = await enviarCodigoVerificacao({
        titularNome: titular.nome,
        telefone: titular.telefone || telefone,
        email: titular.email,
      });
      
      if (!resultadoEnvio.success) {
        await storage.registrarLgpdAccessLog({
          tipoTitular: tipo,
          titularId: titular.id,
          titularNome: titular.nome,
          acao: "solicitar_codigo",
          canalVerificacao: resultadoEnvio.canal,
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: `erro_envio: ${resultadoEnvio.erro}`,
        });
        
        return res.status(500).json({
          error: "Erro ao enviar código. Por favor, tente novamente mais tarde.",
        });
      }
      
      // Salvar token hasheado no banco
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      await storage.criarVerificationToken({
        hashedCodigo: resultadoEnvio.hashedCodigo,
        tipoTitular: tipo,
        titularId: titular.id,
        telefone: resultadoEnvio.telefone ?? undefined,
        email: resultadoEnvio.email,
        canal: resultadoEnvio.canal,
        expiresAt,
      });
      
      // Registrar log de sucesso
      await storage.registrarLgpdAccessLog({
        tipoTitular: tipo,
        titularId: titular.id,
        titularNome: titular.nome,
        acao: "solicitar_codigo",
        canalVerificacao: resultadoEnvio.canal,
        ipAddress,
        userAgent,
        sucesso: true,
      });
      
      // Retornar sucesso genérico
      res.json({
        message: "Se os dados estiverem corretos, você receberá um código de verificação em breve.",
        canal: resultadoEnvio.canal, // Informar qual canal foi usado
      });
      
    } catch (error) {
      console.error("Erro ao solicitar código:", error);
      res.status(500).json({ 
        error: "Erro ao processar solicitação. Por favor, tente novamente." 
      });
    }
  });
  
  // ==================== VALIDAR CÓDIGO ====================
  app.post("/api/lgpd/validar-codigo", validarCodigoLimiter, async (req, res) => {
    const { ipAddress, userAgent } = obterClienteInfo(req);
    
    try {
      // Validar entrada
      const validacao = validarCodigoSchema.safeParse(req.body);
      
      if (!validacao.success) {
        return res.status(400).json({ 
          error: "Dados inválidos. Verifique as informações fornecidas." 
        });
      }
      
      const { codigo, cpf, dataNascimento } = validacao.data;
      
      // Normalizar CPF
      const cpfNormalizado = normalizarCPF(cpf);
      
      // Buscar titular (precisa do nome, mas não temos aqui)
      // Alternativa: buscar token pelo CPF e dataNascimento diretamente
      // Vou usar uma abordagem mais direta buscando tokens válidos
      
      // Buscar todos os tokens não validados e não expirados
      const agora = new Date();
      
      // Buscar em membros
      const membros = await storage.getMembros();
      const membro = membros.find(m => 
        m.cpf === cpfNormalizado && m.dataNascimento === dataNascimento
      );
      
      // Buscar em visitantes
      const visitantes = await storage.getVisitantes();
      const visitante = visitantes.find(v => 
        v.cpf === cpfNormalizado && v.dataNascimento === dataNascimento
      );
      
      const titular = membro || visitante;
      const tipo = membro ? "membro" : "visitante";
      
      if (!titular) {
        // Resposta genérica
        return res.status(401).json({ 
          error: "Código inválido ou expirado." 
        });
      }
      
      // Buscar token
      const token = await storage.buscarVerificationToken(codigo, titular.id);
      
      if (!token) {
        await storage.registrarLgpdAccessLog({
          tipoTitular: tipo as "membro" | "visitante",
          titularId: titular.id,
          titularNome: titular.nome,
          acao: "validar_codigo",
          canalVerificacao: "sms",
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: "codigo_nao_encontrado_ou_expirado",
        });
        
        return res.status(401).json({ 
          error: "Código inválido ou expirado." 
        });
      }
      
      // Verificar tentativas (máximo 3)
      if (token.tentativasValidacao >= 3) {
        await storage.registrarLgpdAccessLog({
          tipoTitular: tipo as "membro" | "visitante",
          titularId: titular.id,
          titularNome: titular.nome,
          acao: "validar_codigo",
          canalVerificacao: token.canal as "sms" | "email",
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: "tentativas_excedidas",
        });
        
        return res.status(429).json({ 
          error: "Número máximo de tentativas excedido. Solicite um novo código." 
        });
      }
      
      // Comparar código hasheado
      const codigoValido = await compararCodigo(codigo, token.hashedCodigo);
      
      if (!codigoValido) {
        // Incrementar tentativas
        await storage.incrementarTentativasValidacao(token.id);
        
        await storage.registrarLgpdAccessLog({
          tipoTitular: tipo as "membro" | "visitante",
          titularId: titular.id,
          titularNome: titular.nome,
          acao: "validar_codigo",
          canalVerificacao: token.canal as "sms" | "email",
          ipAddress,
          userAgent,
          sucesso: false,
          motivoFalha: "codigo_incorreto",
        });
        
        return res.status(401).json({ 
          error: "Código inválido ou expirado." 
        });
      }
      
      // Código válido! Marcar como validado e gerar session token
      const tokenValidado = await storage.validarVerificationToken(token.id);
      
      if (!tokenValidado || !tokenValidado.sessionToken) {
        return res.status(500).json({ 
          error: "Erro ao validar código. Por favor, tente novamente." 
        });
      }
      
      // Registrar log de sucesso
      await storage.registrarLgpdAccessLog({
        tipoTitular: tipo as "membro" | "visitante",
        titularId: titular.id,
        titularNome: titular.nome,
        acao: "validar_codigo",
        canalVerificacao: token.canal as "sms" | "email",
        ipAddress,
        userAgent,
        sucesso: true,
      });
      
      // Retornar session token
      res.json({
        message: "Código validado com sucesso!",
        sessionToken: tokenValidado.sessionToken,
        expiresAt: tokenValidado.sessionExpiresAt,
        titular: {
          nome: titular.nome,
          tipo,
        },
      });
      
    } catch (error) {
      console.error("Erro ao validar código:", error);
      res.status(500).json({ 
        error: "Erro ao processar validação. Por favor, tente novamente." 
      });
    }
  });
  
  // ==================== EXPORTAR DADOS ====================
  app.get("/api/lgpd/exportar-dados", validarSessionToken, async (req, res) => {
    const { ipAddress, userAgent } = obterClienteInfo(req);
    const { titularId, tipoTitular, tokenId } = req.lgpdSession!;
    
    try {
      // Exportar dados
      const dados = await storage.exportarDadosTitular(tipoTitular, titularId);
      
      // Revogar session token após uso
      await storage.revogarSessionToken(tokenId);
      
      // Registrar log
      await storage.registrarLgpdAccessLog({
        tipoTitular,
        titularId,
        titularNome: dados.dadosPessoais.nome ?? "Desconhecido",
        acao: "exportar_dados",
        canalVerificacao: "web",
        ipAddress,
        userAgent,
        sucesso: true,
      });
      
      // Registrar auditoria
      await storage.registrarLogAuditoria({
        descricao: `Titular ${dados.dadosPessoais.nome} (${tipoTitular}) exportou seus dados via portal público`,
        modulo: "LGPD_PUBLICO",
        acao: "EXPORTAR_DADOS",
        usuarioId: "sistema",
        usuarioNome: "Portal LGPD Público",
        usuarioCargo: "SISTEMA",
        registroId: titularId,
      });
      
      res.json(dados);
      
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      
      // Registrar log de erro
      await storage.registrarLgpdAccessLog({
        tipoTitular,
        titularId,
        titularNome: "Erro",
        acao: "exportar_dados",
        canalVerificacao: "web",
        ipAddress,
        userAgent,
        sucesso: false,
        motivoFalha: `erro_interno: ${error}`,
      });
      
      res.status(500).json({ 
        error: "Erro ao exportar dados. Por favor, tente novamente." 
      });
    }
  });
  
  // ==================== SOLICITAR EXCLUSÃO ====================
  app.post("/api/lgpd/solicitar-exclusao", validarSessionToken, async (req, res) => {
    const { ipAddress, userAgent } = obterClienteInfo(req);
    const { titularId, tipoTitular, tokenId } = req.lgpdSession!;
    
    try {
      const { motivo } = req.body;
      
      // Buscar dados do titular para o nome
      const titular = tipoTitular === "membro" 
        ? await storage.getMembro(titularId)
        : await storage.getVisitante(titularId);
      
      if (!titular) {
        return res.status(404).json({ 
          error: "Titular não encontrado." 
        });
      }
      
      // Criar solicitação de exclusão
      const solicitacao = await storage.criarSolicitacaoLGPD({
        tipo: "exclusao",
        status: "pendente",
        tipoTitular,
        titularId,
        titularNome: titular.nome,
        titularEmail: titular.email || "",
        motivo,
        origem: "portal_publico",
      });
      
      // Revogar session token após uso
      await storage.revogarSessionToken(tokenId);
      
      // Registrar log
      await storage.registrarLgpdAccessLog({
        tipoTitular,
        titularId,
        titularNome: titular.nome,
        acao: "solicitar_exclusao",
        canalVerificacao: "web",
        ipAddress,
        userAgent,
        sucesso: true,
      });
      
      // Registrar auditoria
      await storage.registrarLogAuditoria({
        descricao: `Titular ${titular.nome} (${tipoTitular}) solicitou exclusão dos dados via portal público. Motivo: ${motivo || 'Não informado'}`,
        modulo: "LGPD_PUBLICO",
        acao: "SOLICITAR_EXCLUSAO",
        usuarioId: "sistema",
        usuarioNome: "Portal LGPD Público",
        usuarioCargo: "SISTEMA",
        registroId: solicitacao.id,
      });
      
      res.json({
        message: "Solicitação de exclusão registrada com sucesso!",
        solicitacao: {
          id: solicitacao.id,
          status: solicitacao.status,
          criadaEm: solicitacao.criadoEm,
        },
      });
      
    } catch (error) {
      console.error("Erro ao solicitar exclusão:", error);
      
      // Registrar log de erro
      await storage.registrarLgpdAccessLog({
        tipoTitular,
        titularId,
        titularNome: "Erro",
        acao: "solicitar_exclusao",
        canalVerificacao: "web",
        ipAddress,
        userAgent,
        sucesso: false,
        motivoFalha: `erro_interno: ${error}`,
      });
      
      res.status(500).json({ 
        error: "Erro ao solicitar exclusão. Por favor, tente novamente." 
      });
    }
  });
}
