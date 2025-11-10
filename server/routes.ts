import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUsuarioSchema,
  insertMembroSchema,
  insertFamiliaSchema,
  insertVisitanteSchema,
  insertNotaPastoralSchema,
  insertTransacaoFinanceiraSchema,
  insertAcaoDiaconalSchema,
  insertBoletimSchema,
  insertReuniaoSchema,
  insertAtaSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTENTICAÇÃO ====================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha, cargo } = req.body;
      
      const usuario = await storage.getUsuarioPorEmail(email);
      
      if (!usuario || usuario.senha !== senha || usuario.cargo !== cargo) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!usuario.ativo) {
        return res.status(403).json({ message: "Usuário inativo" });
      }

      // Retornar usuário sem a senha
      const { senha: _, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // ==================== MEMBROS ====================
  app.get("/api/membros", async (req, res) => {
    try {
      const membros = await storage.getMembros();
      res.json(membros);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar membros" });
    }
  });

  app.get("/api/membros/:id", async (req, res) => {
    try {
      const membro = await storage.getMembro(req.params.id);
      if (!membro) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      res.json(membro);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar membro" });
    }
  });

  app.post("/api/membros", async (req, res) => {
    try {
      const dados = insertMembroSchema.parse(req.body);
      const membro = await storage.criarMembro(dados);
      res.status(201).json(membro);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/membros/:id", async (req, res) => {
    try {
      const membro = await storage.atualizarMembro(req.params.id, req.body);
      if (!membro) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      res.json(membro);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar membro" });
    }
  });

  app.delete("/api/membros/:id", async (req, res) => {
    try {
      const deletado = await storage.deletarMembro(req.params.id);
      if (!deletado) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar membro" });
    }
  });

  // ==================== FAMÍLIAS ====================
  app.get("/api/familias", async (req, res) => {
    try {
      const familias = await storage.getFamilias();
      res.json(familias);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar famílias" });
    }
  });

  app.post("/api/familias", async (req, res) => {
    try {
      const dados = insertFamiliaSchema.parse(req.body);
      const familia = await storage.criarFamilia(dados);
      res.status(201).json(familia);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // ==================== VISITANTES ====================
  app.get("/api/visitantes", async (req, res) => {
    try {
      const visitantes = await storage.getVisitantes();
      res.json(visitantes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar visitantes" });
    }
  });

  app.get("/api/visitantes/:id", async (req, res) => {
    try {
      const visitante = await storage.getVisitante(req.params.id);
      if (!visitante) {
        return res.status(404).json({ message: "Visitante não encontrado" });
      }
      res.json(visitante);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar visitante" });
    }
  });

  app.post("/api/visitantes", async (req, res) => {
    try {
      const dados = insertVisitanteSchema.parse(req.body);
      const visitante = await storage.criarVisitante(dados);
      res.status(201).json(visitante);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/visitantes/:id", async (req, res) => {
    try {
      const visitante = await storage.atualizarVisitante(req.params.id, req.body);
      if (!visitante) {
        return res.status(404).json({ message: "Visitante não encontrado" });
      }
      res.json(visitante);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar visitante" });
    }
  });

  app.delete("/api/visitantes/:id", async (req, res) => {
    try {
      const deletado = await storage.deletarVisitante(req.params.id);
      if (!deletado) {
        return res.status(404).json({ message: "Visitante não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar visitante" });
    }
  });

  // ==================== NOTAS PASTORAIS ====================
  app.get("/api/notas-pastorais", async (req, res) => {
    try {
      const { membroId } = req.query;
      if (membroId) {
        const notas = await storage.getNotasPorMembro(membroId as string);
        return res.json(notas);
      }
      const notas = await storage.getNotasPastorais();
      res.json(notas);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar notas pastorais" });
    }
  });

  app.post("/api/notas-pastorais", async (req, res) => {
    try {
      const dados = insertNotaPastoralSchema.parse(req.body);
      const nota = await storage.criarNotaPastoral(dados);
      res.status(201).json(nota);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // ==================== TRANSAÇÕES FINANCEIRAS ====================
  app.get("/api/transacoes", async (req, res) => {
    try {
      const transacoes = await storage.getTransacoes();
      res.json(transacoes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.get("/api/transacoes/:id", async (req, res) => {
    try {
      const transacao = await storage.getTransacao(req.params.id);
      if (!transacao) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      res.json(transacao);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar transação" });
    }
  });

  app.post("/api/transacoes", async (req, res) => {
    try {
      const dados = insertTransacaoFinanceiraSchema.parse(req.body);
      const transacao = await storage.criarTransacao(dados);
      res.status(201).json(transacao);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // ==================== AÇÕES DIACONAIS ====================
  app.get("/api/acoes-diaconais", async (req, res) => {
    try {
      const acoes = await storage.getAcoesDiaconais();
      res.json(acoes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ações diaconais" });
    }
  });

  app.get("/api/acoes-diaconais/:id", async (req, res) => {
    try {
      const acao = await storage.getAcaoDiaconal(req.params.id);
      if (!acao) {
        return res.status(404).json({ message: "Ação não encontrada" });
      }
      res.json(acao);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ação" });
    }
  });

  app.post("/api/acoes-diaconais", async (req, res) => {
    try {
      const dados = insertAcaoDiaconalSchema.parse(req.body);
      const acao = await storage.criarAcaoDiaconal(dados);

      // Se houver valor gasto, criar despesa no financeiro automaticamente
      if (dados.valorGasto && dados.valorGasto > 0) {
        await storage.criarTransacao({
          tipo: "despesa",
          categoria: "despesa_social",
          descricao: `Ação Diaconal: ${dados.descricao}`,
          valor: dados.valorGasto,
          data: dados.data,
          membroId: null,
          centroCusto: "social",
          metodoPagamento: "dinheiro",
          comprovante: null,
          observacoes: `Vinculado à ação diaconal #${acao.id}`,
          criadoPorId: dados.responsavelId,
        });
      }

      res.status(201).json(acao);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // ==================== BOLETINS ====================
  app.get("/api/boletins", async (req, res) => {
    try {
      const boletins = await storage.getBoletins();
      res.json(boletins);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar boletins" });
    }
  });

  app.get("/api/boletins/:id", async (req, res) => {
    try {
      const boletim = await storage.getBoletim(req.params.id);
      if (!boletim) {
        return res.status(404).json({ message: "Boletim não encontrado" });
      }
      res.json(boletim);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar boletim" });
    }
  });

  app.post("/api/boletins", async (req, res) => {
    try {
      const dados = insertBoletimSchema.parse(req.body);
      const boletim = await storage.criarBoletim(dados);
      res.status(201).json(boletim);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/boletins/:id", async (req, res) => {
    try {
      const boletim = await storage.atualizarBoletim(req.params.id, req.body);
      if (!boletim) {
        return res.status(404).json({ message: "Boletim não encontrado" });
      }
      res.json(boletim);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar boletim" });
    }
  });

  // ==================== REUNIÕES ====================
  app.get("/api/reunioes", async (req, res) => {
    try {
      const reunioes = await storage.getReunioes();
      res.json(reunioes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar reuniões" });
    }
  });

  app.get("/api/reunioes/:id", async (req, res) => {
    try {
      const reuniao = await storage.getReuniao(req.params.id);
      if (!reuniao) {
        return res.status(404).json({ message: "Reunião não encontrada" });
      }
      res.json(reuniao);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar reunião" });
    }
  });

  app.post("/api/reunioes", async (req, res) => {
    try {
      const dados = insertReuniaoSchema.parse(req.body);
      const reuniao = await storage.criarReuniao(dados);
      res.status(201).json(reuniao);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  // ==================== ATAS ====================
  app.get("/api/atas", async (req, res) => {
    try {
      const atas = await storage.getAtas();
      res.json(atas);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar atas" });
    }
  });

  app.get("/api/atas/:id", async (req, res) => {
    try {
      const ata = await storage.getAta(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata não encontrada" });
      }
      res.json(ata);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ata" });
    }
  });

  app.post("/api/atas", async (req, res) => {
    try {
      const dados = insertAtaSchema.parse(req.body);
      const ata = await storage.criarAta(dados);
      res.status(201).json(ata);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.post("/api/atas/:id/aprovar", async (req, res) => {
    try {
      const { aprovadoPorId } = req.body;
      const ata = await storage.aprovarAta(req.params.id, aprovadoPorId);
      if (!ata) {
        return res.status(404).json({ message: "Ata não encontrada" });
      }
      res.json(ata);
    } catch (error) {
      res.status(500).json({ message: "Erro ao aprovar ata" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
