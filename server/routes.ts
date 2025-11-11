import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { upload } from "./upload";
import { gerarPDFBoletim, gerarPDFAta } from "./pdf";
import { enviarBoletimPorEmail } from "./email";
import multer from "multer";
import fs from "fs";
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
      const { email, senha } = req.body;
      
      const usuario = await storage.getUsuarioPorEmail(email);
      
      if (!usuario || usuario.senha !== senha) {
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

  // ==================== USUÁRIOS ====================
  app.get("/api/usuarios", async (req, res) => {
    try {
      const usuarios = await storage.getUsuarios();
      // Remover senhas de todos os usuários antes de retornar
      const usuariosSemSenha = usuarios.map(({ senha, ...usuario }) => usuario);
      res.json(usuariosSemSenha);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.get("/api/usuarios/:id", async (req, res) => {
    try {
      const usuario = await storage.getUsuario(req.params.id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { senha, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  app.post("/api/usuarios", async (req, res) => {
    try {
      const dados = insertUsuarioSchema.parse(req.body);
      const usuario = await storage.criarUsuario(dados);
      const { senha, ...usuarioSemSenha } = usuario;
      res.status(201).json(usuarioSemSenha);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Dados inválidos" });
    }
  });

  app.patch("/api/usuarios/:id", async (req, res) => {
    try {
      const { senha, ...dadosSemSenha } = req.body;
      const usuario = await storage.atualizarUsuario(req.params.id, dadosSemSenha);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { senha: _, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.patch("/api/usuarios/:id/senha", async (req, res) => {
    try {
      const { novaSenha } = req.body;
      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
      }
      const atualizado = await storage.atualizarSenhaUsuario(req.params.id, novaSenha);
      if (!atualizado) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ message: "Senha atualizada com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar senha" });
    }
  });

  app.delete("/api/usuarios/:id", async (req, res) => {
    try {
      const desativado = await storage.desativarUsuario(req.params.id);
      if (!desativado) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json({ message: "Usuário desativado com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao desativar usuário" });
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
  app.get("/api/transacoes-financeiras", async (req, res) => {
    try {
      const transacoes = await storage.getTransacoes();
      res.json(transacoes);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.get("/api/transacoes-financeiras/:id", async (req, res) => {
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

  app.post("/api/transacoes-financeiras", async (req, res) => {
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

  app.post("/api/boletins/:id/gerar-pdf", async (req, res) => {
    try {
      const boletim = await storage.getBoletim(req.params.id);
      if (!boletim) {
        return res.status(404).json({ message: "Boletim não encontrado" });
      }

      const membros = await storage.getMembros();
      const visitantes = await storage.getVisitantes();

      const dataBoletim = new Date(boletim.data + 'T12:00:00');
      const inicioSemana = new Date(dataBoletim);
      inicioSemana.setDate(dataBoletim.getDate() - 7);
      const fimSemana = new Date(dataBoletim);
      fimSemana.setDate(dataBoletim.getDate() + 7);

      const aniversariantesSemana = membros.filter((m) => {
        if (!m.dataNascimento) return false;
        const dataNasc = new Date(m.dataNascimento + 'T12:00:00');
        const mesNasc = dataNasc.getMonth();
        const diaNasc = dataNasc.getDate();
        const anoAtual = dataBoletim.getFullYear();
        const dataAniversario = new Date(anoAtual, mesNasc, diaNasc);
        return dataAniversario >= inicioSemana && dataAniversario <= fimSemana;
      });

      const visitantesRecentes = visitantes.filter((v) => {
        const dataVisita = new Date(v.dataVisita + 'T12:00:00');
        const diasAtras = 7;
        const dataLimite = new Date(dataBoletim);
        dataLimite.setDate(dataBoletim.getDate() - diasAtras);
        return dataVisita >= dataLimite && dataVisita <= dataBoletim;
      });

      const pdfUrl = await gerarPDFBoletim(boletim, aniversariantesSemana, visitantesRecentes);

      await storage.atualizarBoletim(req.params.id, { pdfUrl });

      res.json({ pdfUrl, message: "PDF gerado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao gerar PDF do boletim:", error);
      res.status(500).json({ message: "Erro ao gerar PDF do boletim" });
    }
  });

  app.post("/api/boletins/:id/enviar-email", async (req, res) => {
    try {
      const { destinatarios } = req.body;

      if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
        return res.status(400).json({ message: "Lista de destinatários é obrigatória" });
      }

      const boletim = await storage.getBoletim(req.params.id);
      if (!boletim) {
        return res.status(404).json({ message: "Boletim não encontrado" });
      }

      const resultado = await enviarBoletimPorEmail(boletim, destinatarios, boletim.pdfUrl || undefined);

      if (resultado.sucesso) {
        res.json({
          message: resultado.mensagem,
          destinatarios: destinatarios.length,
        });
      } else {
        res.status(500).json({
          message: resultado.mensagem,
          erro: resultado.erro,
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar email do boletim:", error);
      res.status(500).json({ message: "Erro ao enviar email do boletim" });
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

  app.post("/api/atas/:id/gerar-pdf", async (req, res) => {
    try {
      const ata = await storage.getAta(req.params.id);
      if (!ata) {
        return res.status(404).json({ message: "Ata não encontrada" });
      }

      const reuniao = await storage.getReuniao(ata.reuniaoId);
      if (!reuniao) {
        return res.status(404).json({ message: "Reunião não encontrada" });
      }

      const usuarios = await storage.getUsuarios();
      const secretario = usuarios.find(u => u.id === ata.secretarioId);
      if (!secretario) {
        return res.status(404).json({ message: "Secretário não encontrado" });
      }

      const pdfUrl = await gerarPDFAta(ata, reuniao, { nome: secretario.nome });

      await storage.atualizarAta(ata.id, { pdfUrl });

      res.json({ pdfUrl, message: "PDF gerado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao gerar PDF da ata:", error);
      res.status(500).json({ message: "Erro ao gerar PDF da ata" });
    }
  });

  // ==================== UPLOAD DE ARQUIVOS ====================
  app.post("/api/upload", (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'Arquivo muito grande. Tamanho máximo: 5MB' 
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            message: 'Campo de arquivo inesperado' 
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }
      
      try {
        const { fileTypeFromFile } = await import('file-type');
        const detectedType = await fileTypeFromFile(req.file.path);
        
        const allowedMimeTypes: Record<string, string[]> = {
          'foto': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          'comprovante': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
          'pdf': ['application/pdf'],
        };
        
        const typeParam = req.query.type as string;
        const allowed = allowedMimeTypes[typeParam] || allowedMimeTypes['comprovante'];
        
        if (!detectedType || !allowed.includes(detectedType.mime)) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            message: `Tipo de arquivo inválido. Esperado: ${allowed.join(', ')}, mas recebido: ${detectedType?.mime || 'desconhecido'}` 
          });
        }
      } catch (validationError) {
        if (req.file?.path) {
          fs.unlinkSync(req.file.path);
        }
        console.error('Erro ao validar arquivo:', validationError);
        return res.status(500).json({ message: 'Erro ao validar arquivo' });
      }
      
      const fileUrl = `/uploads/${req.query.type || 'outros'}/${req.file.filename}`;
      res.json({ 
        message: 'Arquivo enviado com sucesso',
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    });
  });

  // ==================== RELATÓRIOS ====================
  app.get("/api/relatorios/pastoral", async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      const membros = await storage.getMembros();
      const visitantes = await storage.getVisitantes();
      
      // Filtrar membros criados no período se houver filtro
      let membrosFiltrados = membros;
      let visitantesFiltrados = visitantes;
      
      if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio as string);
        const fim = new Date(dataFim as string);
        
        membrosFiltrados = membros.filter(m => {
          const dataCriacao = new Date(m.criadoEm);
          return dataCriacao >= inicio && dataCriacao <= fim;
        });
        
        visitantesFiltrados = visitantes.filter(v => {
          const dataVisita = new Date(v.dataVisita);
          return dataVisita >= inicio && dataVisita <= fim;
        });
      }
      
      // Estatísticas
      const totalMembros = membros.length;
      const membrosAtivos = membros.filter(m => m.status === "ativo").length;
      const novosMembrosPeriodo = membrosFiltrados.length;
      
      // Aniversariantes do mês
      const mesAtual = new Date().getMonth();
      const aniversariantesMes = membros.filter(m => {
        if (!m.dataNascimento) return false;
        const dataNasc = new Date(m.dataNascimento);
        return dataNasc.getMonth() === mesAtual;
      });
      
      // Visitantes por status
      const visitantesPorStatus = {
        novo: visitantes.filter(v => v.status === "novo").length,
        em_acompanhamento: visitantes.filter(v => v.status === "em_acompanhamento").length,
        membro: visitantes.filter(v => v.status === "membro").length,
        inativo: visitantes.filter(v => v.status === "inativo").length,
      };
      
      res.json({
        periodo: { dataInicio, dataFim },
        resumo: {
          totalMembros,
          membrosAtivos,
          novosMembrosPeriodo,
          totalVisitantes: visitantes.length,
          aniversariantesMes: aniversariantesMes.length,
        },
        visitantesPorStatus,
        novosMembros: membrosFiltrados.map(m => ({
          nome: m.nome,
          email: m.email,
          telefone: m.telefone,
          dataCriacao: m.criadoEm,
          status: m.status,
        })),
        visitantesRecentes: visitantesFiltrados.map(v => ({
          nome: v.nome,
          dataVisita: v.dataVisita,
          status: v.status,
          telefone: v.telefone,
        })),
        aniversariantes: aniversariantesMes.map(m => ({
          nome: m.nome,
          dataNascimento: m.dataNascimento,
          telefone: m.telefone,
        })),
      });
    } catch (error) {
      console.error("Erro ao gerar relatório pastoral:", error);
      res.status(500).json({ message: "Erro ao gerar relatório pastoral" });
    }
  });

  app.get("/api/relatorios/financeiro", async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      const transacoes = await storage.getTransacoes();
      
      // Filtrar transações no período
      let transacoesFiltradas = transacoes;
      if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio as string);
        const fim = new Date(dataFim as string);
        
        transacoesFiltradas = transacoes.filter((t: any) => {
          const dataTransacao = new Date(t.data);
          return dataTransacao >= inicio && dataTransacao <= fim;
        });
      }
      
      // Calcular totais
      const receitas = transacoesFiltradas.filter((t: any) => t.tipo === "receita");
      const despesas = transacoesFiltradas.filter((t: any) => t.tipo === "despesa");
      
      const totalReceitas = receitas.reduce((acc: number, t: any) => acc + t.valor, 0);
      const totalDespesas = despesas.reduce((acc: number, t: any) => acc + t.valor, 0);
      const saldo = totalReceitas - totalDespesas;
      
      // Receitas por categoria
      const receitasPorCategoria = receitas.reduce((acc: any, t: any) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {});
      
      // Despesas por categoria
      const despesasPorCategoria = despesas.reduce((acc: any, t: any) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {});
      
      // Por centro de custo
      const porCentroCusto = transacoesFiltradas.reduce((acc: any, t: any) => {
        if (!acc[t.centroCusto]) {
          acc[t.centroCusto] = { receitas: 0, despesas: 0 };
        }
        if (t.tipo === "receita") {
          acc[t.centroCusto].receitas += t.valor;
        } else {
          acc[t.centroCusto].despesas += t.valor;
        }
        return acc;
      }, {});
      
      res.json({
        periodo: { dataInicio, dataFim },
        resumo: {
          totalReceitas,
          totalDespesas,
          saldo,
          totalTransacoes: transacoesFiltradas.length,
        },
        receitasPorCategoria,
        despesasPorCategoria,
        porCentroCusto,
        transacoes: transacoesFiltradas.map((t: any) => ({
          id: t.id,
          tipo: t.tipo,
          categoria: t.categoria,
          descricao: t.descricao,
          valor: t.valor,
          data: t.data,
          centroCusto: t.centroCusto,
          metodoPagamento: t.metodoPagamento,
        })),
      });
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      res.status(500).json({ message: "Erro ao gerar relatório financeiro" });
    }
  });

  app.get("/api/relatorios/diaconal", async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      const acoes = await storage.getAcoesDiaconais();
      
      // Filtrar ações no período
      let acoesFiltradas = acoes;
      if (dataInicio && dataFim) {
        const inicio = new Date(dataInicio as string);
        const fim = new Date(dataFim as string);
        
        acoesFiltradas = acoes.filter(a => {
          const dataAcao = new Date(a.data);
          return dataAcao >= inicio && dataAcao <= fim;
        });
      }
      
      // Estatísticas
      const acoesPorTipo = acoesFiltradas.reduce((acc: any, a) => {
        acc[a.tipo] = (acc[a.tipo] || 0) + 1;
        return acc;
      }, {});
      
      const valorTotalGasto = acoesFiltradas.reduce((acc, a) => {
        return acc + (a.valorGasto || 0);
      }, 0);
      
      // Lista de beneficiários únicos
      const beneficiariosUnicos = new Set(acoesFiltradas.map(a => a.beneficiario));
      
      res.json({
        periodo: { dataInicio, dataFim },
        resumo: {
          totalAcoes: acoesFiltradas.length,
          valorTotalGasto,
          beneficiariosAtendidos: beneficiariosUnicos.size,
        },
        acoesPorTipo,
        acoes: acoesFiltradas.map(a => ({
          id: a.id,
          tipo: a.tipo,
          descricao: a.descricao,
          beneficiario: a.beneficiario,
          telefone: a.telefone,
          valorGasto: a.valorGasto,
          data: a.data,
        })),
      });
    } catch (error) {
      console.error("Erro ao gerar relatório diaconal:", error);
      res.status(500).json({ message: "Erro ao gerar relatório diaconal" });
    }
  });

  app.get("/api/relatorios/export/:tipo", async (req, res) => {
    try {
      const { tipo } = req.params;
      const { dataInicio, dataFim } = req.query;
      
      let csvData = "";
      let filename = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (tipo === "pastoral") {
        const membros = await storage.getMembros();
        csvData = "Nome,Email,Telefone,Data Nascimento,Status,Data Cadastro\n";
        membros.forEach(m => {
          csvData += `"${m.nome}","${m.email || ""}","${m.telefone || ""}","${m.dataNascimento || ""}","${m.status}","${m.criadoEm}"\n`;
        });
      } else if (tipo === "financeiro") {
        const transacoes = await storage.getTransacoes();
        csvData = "Data,Tipo,Categoria,Descrição,Valor (R$),Centro de Custo,Método Pagamento\n";
        transacoes.forEach((t: any) => {
          const valorReais = (t.valor / 100).toFixed(2);
          csvData += `"${t.data}","${t.tipo}","${t.categoria}","${t.descricao}","${valorReais}","${t.centroCusto}","${t.metodoPagamento || ""}"\n`;
        });
      } else if (tipo === "diaconal") {
        const acoes = await storage.getAcoesDiaconais();
        csvData = "Data,Tipo,Descrição,Beneficiário,Telefone,Valor Gasto (R$)\n";
        acoes.forEach(a => {
          const valorReais = a.valorGasto ? (a.valorGasto / 100).toFixed(2) : "0.00";
          csvData += `"${a.data}","${a.tipo}","${a.descricao}","${a.beneficiario}","${a.telefone || ""}","${valorReais}"\n`;
        });
      } else {
        return res.status(400).json({ message: "Tipo de relatório inválido" });
      }
      
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send("\uFEFF" + csvData); // BOM para UTF-8
    } catch (error) {
      console.error("Erro ao exportar relatório:", error);
      res.status(500).json({ message: "Erro ao exportar relatório" });
    }
  });

  // ==================== LGPD ====================
  
  // Solicitações LGPD
  app.get("/api/lgpd/solicitacoes", async (req, res) => {
    try {
      const { status, tipo, titularId, responsavelId } = req.query;
      const solicitacoes = await storage.getSolicitacoesLGPD({
        status: status as string,
        tipo: tipo as string,
        titularId: titularId as string,
        responsavelId: responsavelId as string,
      });
      res.json(solicitacoes);
    } catch (error) {
      console.error("Erro ao listar solicitações LGPD:", error);
      res.status(500).json({ message: "Erro ao listar solicitações LGPD" });
    }
  });

  app.get("/api/lgpd/solicitacoes/:id", async (req, res) => {
    try {
      const solicitacao = await storage.getSolicitacaoLGPD(req.params.id);
      if (!solicitacao) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.json(solicitacao);
    } catch (error) {
      console.error("Erro ao buscar solicitação LGPD:", error);
      res.status(500).json({ message: "Erro ao buscar solicitação LGPD" });
    }
  });

  app.post("/api/lgpd/solicitacoes", async (req, res) => {
    try {
      const solicitacao = await storage.criarSolicitacaoLGPD(req.body);
      res.status(201).json(solicitacao);
    } catch (error) {
      console.error("Erro ao criar solicitação LGPD:", error);
      res.status(500).json({ message: "Erro ao criar solicitação LGPD" });
    }
  });

  app.patch("/api/lgpd/solicitacoes/:id", async (req, res) => {
    try {
      const solicitacao = await storage.atualizarSolicitacaoLGPD(req.params.id, req.body);
      if (!solicitacao) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.json(solicitacao);
    } catch (error) {
      console.error("Erro ao atualizar solicitação LGPD:", error);
      res.status(500).json({ message: "Erro ao atualizar solicitação LGPD" });
    }
  });

  app.post("/api/lgpd/solicitacoes/:id/processar", async (req, res) => {
    try {
      const { status, responsavelId, justificativaRecusa, arquivoExportacao } = req.body;
      const solicitacao = await storage.transitionSolicitacaoLGPDStatus(req.params.id, status, {
        responsavelId,
        justificativaRecusa,
        arquivoExportacao,
      });
      if (!solicitacao) {
        return res.status(404).json({ message: "Solicitação não encontrada" });
      }
      res.json(solicitacao);
    } catch (error) {
      console.error("Erro ao processar solicitação LGPD:", error);
      res.status(500).json({ message: "Erro ao processar solicitação LGPD" });
    }
  });

  // Exportar dados de titular
  app.get("/api/lgpd/exportar-titular/:tipoTitular/:titularId", async (req, res) => {
    try {
      const { tipoTitular, titularId } = req.params;
      if (tipoTitular !== "membro" && tipoTitular !== "visitante") {
        return res.status(400).json({ message: "Tipo de titular inválido" });
      }
      
      const dados = await storage.exportarDadosTitular(tipoTitular as "membro" | "visitante", titularId);
      
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="dados-${tipoTitular}-${titularId}.json"`);
      res.json(dados);
    } catch (error) {
      console.error("Erro ao exportar dados do titular:", error);
      res.status(500).json({ message: "Erro ao exportar dados do titular" });
    }
  });

  // Executar exclusão de titular
  app.delete("/api/lgpd/excluir-titular/:tipoTitular/:titularId", async (req, res) => {
    try {
      const { tipoTitular, titularId } = req.params;
      const { cascade, motivo, solicitacaoId } = req.body;
      
      if (tipoTitular !== "membro" && tipoTitular !== "visitante") {
        return res.status(400).json({ message: "Tipo de titular inválido" });
      }
      
      const resultado = await storage.executarExclusaoTitular(tipoTitular as "membro" | "visitante", titularId, {
        cascade,
        motivo,
        solicitacaoId,
      });
      
      res.json(resultado);
    } catch (error) {
      console.error("Erro ao excluir titular:", error);
      res.status(500).json({ message: "Erro ao excluir titular" });
    }
  });

  // Logs de Consentimento
  app.post("/api/lgpd/logs-consentimento", async (req, res) => {
    try {
      const log = await storage.registrarLogConsentimento(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error("Erro ao registrar log de consentimento:", error);
      res.status(500).json({ message: "Erro ao registrar log de consentimento" });
    }
  });

  app.get("/api/lgpd/logs-consentimento/:tipoTitular/:titularId", async (req, res) => {
    try {
      const { tipoTitular, titularId } = req.params;
      if (tipoTitular !== "membro" && tipoTitular !== "visitante") {
        return res.status(400).json({ message: "Tipo de titular inválido" });
      }
      
      const logs = await storage.getLogsConsentimentoPorTitular(tipoTitular as "membro" | "visitante", titularId);
      res.json(logs);
    } catch (error) {
      console.error("Erro ao buscar logs de consentimento:", error);
      res.status(500).json({ message: "Erro ao buscar logs de consentimento" });
    }
  });

  // Logs de Auditoria
  app.post("/api/lgpd/logs-auditoria", async (req, res) => {
    try {
      const log = await storage.registrarLogAuditoria(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
      res.status(500).json({ message: "Erro ao registrar log de auditoria" });
    }
  });

  app.get("/api/lgpd/logs-auditoria", async (req, res) => {
    try {
      const { modulo, acao, usuarioId, registroId } = req.query;
      const logs = await storage.getLogsAuditoria({
        modulo: modulo as string,
        acao: acao as string,
        usuarioId: usuarioId as string,
        registroId: registroId as string,
      });
      res.json(logs);
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      res.status(500).json({ message: "Erro ao buscar logs de auditoria" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
