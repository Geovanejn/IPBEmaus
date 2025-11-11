import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import ws from "ws";
import * as schema from "@shared/schema";
import {
  type Usuario, type InsertUsuario,
  type Membro, type InsertMembro,
  type Familia, type InsertFamilia,
  type Visitante, type InsertVisitante,
  type NotaPastoral, type InsertNotaPastoral,
  type TransacaoFinanceira, type InsertTransacaoFinanceira,
  type AcaoDiaconal, type InsertAcaoDiaconal,
  type Boletim, type InsertBoletim,
  type Reuniao, type InsertReuniao,
  type Ata, type InsertAta,
  type SolicitacaoLGPD, type InsertSolicitacaoLGPD,
  type LogConsentimento, type InsertLogConsentimento,
  type LogAuditoria, type InsertLogAuditoria,
  type DadosTitularExport,
  type ResultadoExclusaoTitular,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision the database?");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

export interface IStorage {
  // Usuários
  getUsuarios(): Promise<Usuario[]>;
  getUsuario(id: string): Promise<Usuario | undefined>;
  getUsuarioPorEmail(email: string): Promise<Usuario | undefined>;
  criarUsuario(usuario: InsertUsuario): Promise<Usuario>;
  atualizarUsuario(id: string, usuario: Partial<Usuario>): Promise<Usuario | undefined>;
  atualizarSenhaUsuario(id: string, novaSenha: string): Promise<boolean>;
  desativarUsuario(id: string): Promise<boolean>;
  
  // Membros
  getMembros(): Promise<Membro[]>;
  getMembro(id: string): Promise<Membro | undefined>;
  criarMembro(membro: InsertMembro): Promise<Membro>;
  atualizarMembro(id: string, membro: Partial<Membro>): Promise<Membro | undefined>;
  deletarMembro(id: string): Promise<boolean>;
  
  // Famílias
  getFamilias(): Promise<Familia[]>;
  getFamilia(id: string): Promise<Familia | undefined>;
  criarFamilia(familia: InsertFamilia): Promise<Familia>;
  
  // Visitantes
  getVisitantes(): Promise<Visitante[]>;
  getVisitante(id: string): Promise<Visitante | undefined>;
  criarVisitante(visitante: InsertVisitante): Promise<Visitante>;
  atualizarVisitante(id: string, visitante: Partial<Visitante>): Promise<Visitante | undefined>;
  deletarVisitante(id: string): Promise<boolean>;
  
  // Notas Pastorais
  getNotasPastorais(): Promise<NotaPastoral[]>;
  getNotasPorMembro(membroId: string): Promise<NotaPastoral[]>;
  criarNotaPastoral(nota: InsertNotaPastoral): Promise<NotaPastoral>;
  
  // Transações Financeiras
  getTransacoes(): Promise<TransacaoFinanceira[]>;
  getTransacao(id: string): Promise<TransacaoFinanceira | undefined>;
  criarTransacao(transacao: InsertTransacaoFinanceira): Promise<TransacaoFinanceira>;
  
  // Ações Diaconais
  getAcoesDiaconais(): Promise<AcaoDiaconal[]>;
  getAcaoDiaconal(id: string): Promise<AcaoDiaconal | undefined>;
  criarAcaoDiaconal(acao: InsertAcaoDiaconal): Promise<AcaoDiaconal>;
  
  // Boletins
  getBoletins(): Promise<Boletim[]>;
  getBoletim(id: string): Promise<Boletim | undefined>;
  criarBoletim(boletim: InsertBoletim): Promise<Boletim>;
  atualizarBoletim(id: string, boletim: Partial<Boletim>): Promise<Boletim | undefined>;
  
  // Reuniões
  getReunioes(): Promise<Reuniao[]>;
  getReuniao(id: string): Promise<Reuniao | undefined>;
  criarReuniao(reuniao: InsertReuniao): Promise<Reuniao>;
  
  // Atas
  getAtas(): Promise<Ata[]>;
  getAta(id: string): Promise<Ata | undefined>;
  criarAta(ata: InsertAta): Promise<Ata>;
  aprovarAta(id: string, aprovadoPorId: string): Promise<Ata | undefined>;
  
  // LGPD - Solicitações
  criarSolicitacaoLGPD(solicitacao: InsertSolicitacaoLGPD): Promise<SolicitacaoLGPD>;
  getSolicitacoesLGPD(params?: { status?: string; tipo?: string; titularId?: string; responsavelId?: string }): Promise<SolicitacaoLGPD[]>;
  getSolicitacaoLGPD(id: string): Promise<SolicitacaoLGPD | undefined>;
  atualizarSolicitacaoLGPD(id: string, dados: Partial<SolicitacaoLGPD>): Promise<SolicitacaoLGPD | undefined>;
  transitionSolicitacaoLGPDStatus(id: string, status: string, metadata: { responsavelId?: string; justificativaRecusa?: string; arquivoExportacao?: string }): Promise<SolicitacaoLGPD | undefined>;
  exportarDadosTitular(tipoTitular: "membro" | "visitante", titularId: string): Promise<DadosTitularExport>;
  executarExclusaoTitular(tipoTitular: "membro" | "visitante", titularId: string, opts?: { cascade?: boolean; motivo?: string; solicitacaoId?: string }): Promise<ResultadoExclusaoTitular>;
  
  // LGPD - Logs de Consentimento
  registrarLogConsentimento(log: InsertLogConsentimento): Promise<LogConsentimento>;
  getLogsConsentimentoPorTitular(tipoTitular: "membro" | "visitante", titularId: string): Promise<LogConsentimento[]>;
  
  // LGPD - Logs de Auditoria
  registrarLogAuditoria(log: InsertLogAuditoria): Promise<LogAuditoria>;
  getLogsAuditoria(params?: { modulo?: string; acao?: string; usuarioId?: string; registroId?: string }): Promise<LogAuditoria[]>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  async ensureInitialized() {
    if (this.initialized) return;
    await this.popularDadosIniciais();
    this.initialized = true;
  }

  private async popularDadosIniciais() {
    const existingUsers = await db.select().from(schema.usuarios).limit(1);
    if (existingUsers.length > 0) {
      return;
    }

    const usuarios = [
      {
        email: "pastor@ipbemaus.org",
        senha: "123456",
        cargo: "PASTOR" as const,
        nome: "Rev. João Silva",
        ativo: true,
      },
      {
        email: "presbitero@ipbemaus.org",
        senha: "123456",
        cargo: "PRESBITERO" as const,
        nome: "Pb. Pedro Santos",
        ativo: true,
      },
      {
        email: "tesoureiro@ipbemaus.org",
        senha: "123456",
        cargo: "TESOUREIRO" as const,
        nome: "Maria Oliveira",
        ativo: true,
      },
      {
        email: "diacono@ipbemaus.org",
        senha: "123456",
        cargo: "DIACONO" as const,
        nome: "Dc. Carlos Costa",
        ativo: true,
      },
    ];

    const insertedUsuarios = await db.insert(schema.usuarios).values(usuarios).returning();

    const familia = await db.insert(schema.familias).values({
      nome: "Família Silva Santos",
      endereco: "Rua das Flores, 123 - Centro - São Paulo/SP",
    }).returning();

    const membros = [
      {
        nome: "Maria Silva Santos",
        email: "maria.silva@email.com",
        telefone: "(11) 98765-4321",
        dataNascimento: "1985-03-15",
        endereco: "Rua das Flores, 123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        estadoCivil: "casado",
        profissao: "Professora",
        dataBatismo: "2010-05-20",
        dataProfissaoFe: "2010-05-20",
        familiaId: familia[0].id,
        status: "ativo",
        consentimentoLGPD: true,
      },
      {
        nome: "João Santos Silva",
        email: "joao.santos@email.com",
        telefone: "(11) 98765-4322",
        dataNascimento: "1982-07-22",
        endereco: "Rua das Flores, 123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567",
        estadoCivil: "casado",
        profissao: "Engenheiro",
        dataBatismo: "2010-05-20",
        dataProfissaoFe: "2010-05-20",
        familiaId: familia[0].id,
        status: "ativo",
        consentimentoLGPD: true,
      },
      {
        nome: "Ana Paula Costa",
        email: "ana.costa@email.com",
        telefone: "(11) 98765-4323",
        dataNascimento: "1990-11-10",
        endereco: "Av. Paulista, 500",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01311-000",
        estadoCivil: "solteiro",
        profissao: "Médica",
        dataBatismo: "2015-08-15",
        dataProfissaoFe: "2015-08-15",
        status: "ativo",
        consentimentoLGPD: true,
      },
    ];

    const insertedMembros = await db.insert(schema.membros).values(membros).returning();

    await db.insert(schema.visitantes).values([
      {
        nome: "Carlos Alberto Souza",
        email: "carlos.souza@email.com",
        telefone: "(11) 99876-5432",
        endereco: "Rua Nova, 456",
        comoConheceu: "Convite de membro",
        membroConvidouId: insertedMembros[0].id,
        dataVisita: "2024-11-03",
        observacoes: "Interessado em conhecer a igreja",
        status: "em_acompanhamento",
        consentimentoLGPD: true,
      },
      {
        nome: "Beatriz Oliveira",
        email: "bia.oliveira@email.com",
        telefone: "(11) 99876-5433",
        endereco: "Av. São João, 789",
        comoConheceu: "Redes sociais",
        dataVisita: "2024-11-05",
        observacoes: "Primeira visita",
        status: "novo",
        consentimentoLGPD: true,
      },
    ]);

    await db.insert(schema.transacoesFinanceiras).values([
      {
        tipo: "receita",
        categoria: "dizimo",
        descricao: "Dízimo - Maria Silva Santos",
        valor: 50000,
        data: "2024-11-03",
        membroId: insertedMembros[0].id,
        centroCusto: "geral",
        metodoPagamento: "transferencia",
        criadoPorId: insertedUsuarios[2].id,
      },
      {
        tipo: "receita",
        categoria: "oferta",
        descricao: "Oferta de Missões",
        valor: 120000,
        data: "2024-11-03",
        centroCusto: "missoes",
        metodoPagamento: "dinheiro",
        observacoes: "Culto dominical",
        criadoPorId: insertedUsuarios[2].id,
      },
      {
        tipo: "despesa",
        categoria: "despesa_geral",
        descricao: "Energia Elétrica - Outubro",
        valor: 85000,
        data: "2024-11-01",
        centroCusto: "geral",
        metodoPagamento: "transferencia",
        criadoPorId: insertedUsuarios[2].id,
      },
    ]);

    await db.insert(schema.acoesDiaconais).values([
      {
        tipo: "cesta_basica",
        descricao: "Distribuição de cesta básica para família carente",
        beneficiario: "Família Silva",
        telefone: "(11) 98765-1111",
        endereco: "Rua das Acácias, 45 - Jardim São Paulo",
        valorGasto: 15000,
        data: "2024-11-01",
        responsavelId: insertedUsuarios[3].id,
        observacoes: "Família com 5 pessoas, incluindo 3 crianças",
      },
      {
        tipo: "visita",
        descricao: "Visita a irmão enfermo",
        beneficiario: "João Pedro Oliveira",
        telefone: "(11) 98765-2222",
        endereco: "Rua Esperança, 123 - Apto 45",
        data: "2024-11-02",
        responsavelId: insertedUsuarios[3].id,
        observacoes: "Oração e leitura bíblica realizada",
      },
    ]);
  }

  async getUsuarios(): Promise<Usuario[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.usuarios);
  }

  async getUsuario(id: string): Promise<Usuario | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(schema.usuarios).where(eq(schema.usuarios.id, id)).limit(1);
    return result[0];
  }

  async getUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email)).limit(1);
    return result[0];
  }

  async atualizarUsuario(id: string, dados: Partial<Usuario>): Promise<Usuario | undefined> {
    await this.ensureInitialized();
    const result = await db
      .update(schema.usuarios)
      .set(dados)
      .where(eq(schema.usuarios.id, id))
      .returning();
    return result[0];
  }

  async atualizarSenhaUsuario(id: string, novaSenha: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db
      .update(schema.usuarios)
      .set({ senha: novaSenha })
      .where(eq(schema.usuarios.id, id))
      .returning();
    return result.length > 0;
  }

  async desativarUsuario(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db
      .update(schema.usuarios)
      .set({ ativo: false })
      .where(eq(schema.usuarios.id, id))
      .returning();
    return result.length > 0;
  }

  async criarUsuario(insertUsuario: InsertUsuario): Promise<Usuario> {
    const result = await db.insert(schema.usuarios).values(insertUsuario).returning();
    return result[0];
  }

  async getMembros(): Promise<Membro[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.membros);
  }

  async getMembro(id: string): Promise<Membro | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(schema.membros).where(eq(schema.membros.id, id)).limit(1);
    return result[0];
  }

  async criarMembro(insertMembro: InsertMembro): Promise<Membro> {
    const result = await db.insert(schema.membros).values(insertMembro).returning();
    return result[0];
  }

  async atualizarMembro(id: string, dados: Partial<Membro>): Promise<Membro | undefined> {
    const result = await db.update(schema.membros).set(dados).where(eq(schema.membros.id, id)).returning();
    return result[0];
  }

  async deletarMembro(id: string): Promise<boolean> {
    const result = await db.delete(schema.membros).where(eq(schema.membros.id, id)).returning();
    return result.length > 0;
  }

  async getFamilias(): Promise<Familia[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.familias);
  }

  async getFamilia(id: string): Promise<Familia | undefined> {
    const result = await db.select().from(schema.familias).where(eq(schema.familias.id, id)).limit(1);
    return result[0];
  }

  async criarFamilia(insertFamilia: InsertFamilia): Promise<Familia> {
    const result = await db.insert(schema.familias).values(insertFamilia).returning();
    return result[0];
  }

  async getVisitantes(): Promise<Visitante[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.visitantes);
  }

  async getVisitante(id: string): Promise<Visitante | undefined> {
    const result = await db.select().from(schema.visitantes).where(eq(schema.visitantes.id, id)).limit(1);
    return result[0];
  }

  async criarVisitante(insertVisitante: InsertVisitante): Promise<Visitante> {
    const result = await db.insert(schema.visitantes).values(insertVisitante).returning();
    return result[0];
  }

  async atualizarVisitante(id: string, dados: Partial<Visitante>): Promise<Visitante | undefined> {
    const result = await db.update(schema.visitantes).set(dados).where(eq(schema.visitantes.id, id)).returning();
    return result[0];
  }

  async deletarVisitante(id: string): Promise<boolean> {
    const result = await db.delete(schema.visitantes).where(eq(schema.visitantes.id, id)).returning();
    return result.length > 0;
  }

  async getNotasPastorais(): Promise<NotaPastoral[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.notasPastorais);
  }

  async getNotasPorMembro(membroId: string): Promise<NotaPastoral[]> {
    return await db.select().from(schema.notasPastorais).where(eq(schema.notasPastorais.membroId, membroId));
  }

  async criarNotaPastoral(insertNota: InsertNotaPastoral): Promise<NotaPastoral> {
    const result = await db.insert(schema.notasPastorais).values(insertNota).returning();
    return result[0];
  }

  async getTransacoes(): Promise<TransacaoFinanceira[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.transacoesFinanceiras);
  }

  async getTransacao(id: string): Promise<TransacaoFinanceira | undefined> {
    const result = await db.select().from(schema.transacoesFinanceiras).where(eq(schema.transacoesFinanceiras.id, id)).limit(1);
    return result[0];
  }

  async criarTransacao(insertTransacao: InsertTransacaoFinanceira): Promise<TransacaoFinanceira> {
    const result = await db.insert(schema.transacoesFinanceiras).values(insertTransacao).returning();
    return result[0];
  }

  async getAcoesDiaconais(): Promise<AcaoDiaconal[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.acoesDiaconais);
  }

  async getAcaoDiaconal(id: string): Promise<AcaoDiaconal | undefined> {
    const result = await db.select().from(schema.acoesDiaconais).where(eq(schema.acoesDiaconais.id, id)).limit(1);
    return result[0];
  }

  async criarAcaoDiaconal(insertAcao: InsertAcaoDiaconal): Promise<AcaoDiaconal> {
    const result = await db.insert(schema.acoesDiaconais).values(insertAcao).returning();
    return result[0];
  }

  async getBoletins(): Promise<Boletim[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.boletins);
  }

  async getBoletim(id: string): Promise<Boletim | undefined> {
    const result = await db.select().from(schema.boletins).where(eq(schema.boletins.id, id)).limit(1);
    return result[0];
  }

  async criarBoletim(insertBoletim: InsertBoletim): Promise<Boletim> {
    const result = await db.insert(schema.boletins).values(insertBoletim).returning();
    return result[0];
  }

  async atualizarBoletim(id: string, dados: Partial<Boletim>): Promise<Boletim | undefined> {
    const result = await db.update(schema.boletins).set(dados).where(eq(schema.boletins.id, id)).returning();
    return result[0];
  }

  async getReunioes(): Promise<Reuniao[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.reunioes);
  }

  async getReuniao(id: string): Promise<Reuniao | undefined> {
    const result = await db.select().from(schema.reunioes).where(eq(schema.reunioes.id, id)).limit(1);
    return result[0];
  }

  async criarReuniao(insertReuniao: InsertReuniao): Promise<Reuniao> {
    const result = await db.insert(schema.reunioes).values(insertReuniao).returning();
    return result[0];
  }

  async getAtas(): Promise<Ata[]> {
    await this.ensureInitialized();
    return await db.select().from(schema.atas);
  }

  async getAta(id: string): Promise<Ata | undefined> {
    const result = await db.select().from(schema.atas).where(eq(schema.atas.id, id)).limit(1);
    return result[0];
  }

  async criarAta(insertAta: InsertAta): Promise<Ata> {
    const result = await db.insert(schema.atas).values(insertAta).returning();
    return result[0];
  }

  async aprovarAta(id: string, aprovadoPorId: string): Promise<Ata | undefined> {
    const result = await db.update(schema.atas).set({
      aprovada: true,
      dataAprovacao: new Date(),
      aprovadoPorId,
      bloqueada: true,
    }).where(eq(schema.atas.id, id)).returning();
    return result[0];
  }

  async atualizarAta(id: string, dados: Partial<Ata>): Promise<Ata | undefined> {
    const result = await db.update(schema.atas)
      .set(dados)
      .where(eq(schema.atas.id, id))
      .returning();
    return result[0];
  }

  async criarSolicitacaoLGPD(insertSolicitacao: InsertSolicitacaoLGPD): Promise<SolicitacaoLGPD> {
    const result = await db.insert(schema.solicitacoesLGPD).values(insertSolicitacao).returning();
    return result[0];
  }

  async getSolicitacoesLGPD(params?: { status?: string; tipo?: string; titularId?: string; responsavelId?: string }): Promise<SolicitacaoLGPD[]> {
    await this.ensureInitialized();
    
    const conditions = [];
    if (params?.status) conditions.push(eq(schema.solicitacoesLGPD.status, params.status));
    if (params?.tipo) conditions.push(eq(schema.solicitacoesLGPD.tipo, params.tipo));
    if (params?.titularId) conditions.push(eq(schema.solicitacoesLGPD.titularId, params.titularId));
    if (params?.responsavelId) conditions.push(eq(schema.solicitacoesLGPD.responsavelId, params.responsavelId));
    
    if (conditions.length === 1) {
      return await db.select().from(schema.solicitacoesLGPD).where(conditions[0]);
    } else if (conditions.length > 1) {
      return await db.select().from(schema.solicitacoesLGPD).where(and(...conditions));
    }
    
    return await db.select().from(schema.solicitacoesLGPD);
  }

  async getSolicitacaoLGPD(id: string): Promise<SolicitacaoLGPD | undefined> {
    const result = await db.select().from(schema.solicitacoesLGPD).where(eq(schema.solicitacoesLGPD.id, id)).limit(1);
    return result[0];
  }

  async atualizarSolicitacaoLGPD(id: string, dados: Partial<SolicitacaoLGPD>): Promise<SolicitacaoLGPD | undefined> {
    const result = await db.update(schema.solicitacoesLGPD).set(dados).where(eq(schema.solicitacoesLGPD.id, id)).returning();
    return result[0];
  }

  async transitionSolicitacaoLGPDStatus(id: string, status: string, metadata: { responsavelId?: string; justificativaRecusa?: string; arquivoExportacao?: string }): Promise<SolicitacaoLGPD | undefined> {
    const updateData: Partial<SolicitacaoLGPD> = {
      status,
      dataAtendimento: new Date(),
    };
    
    if (metadata.responsavelId) updateData.responsavelId = metadata.responsavelId;
    if (metadata.justificativaRecusa) updateData.justificativaRecusa = metadata.justificativaRecusa;
    if (metadata.arquivoExportacao) updateData.arquivoExportacao = metadata.arquivoExportacao;
    
    const result = await db.update(schema.solicitacoesLGPD).set(updateData).where(eq(schema.solicitacoesLGPD.id, id)).returning();
    return result[0];
  }

  async exportarDadosTitular(tipoTitular: "membro" | "visitante", titularId: string): Promise<DadosTitularExport> {
    let dadosPessoais: any;
    let familia: any;
    
    if (tipoTitular === "membro") {
      const membro = await db.select().from(schema.membros).where(eq(schema.membros.id, titularId)).limit(1);
      if (!membro[0]) throw new Error("Membro não encontrado");
      dadosPessoais = membro[0];
      
      if (membro[0].familiaId) {
        const fam = await db.select().from(schema.familias).where(eq(schema.familias.id, membro[0].familiaId)).limit(1);
        familia = fam[0];
      }
    } else {
      const visitante = await db.select().from(schema.visitantes).where(eq(schema.visitantes.id, titularId)).limit(1);
      if (!visitante[0]) throw new Error("Visitante não encontrado");
      dadosPessoais = visitante[0];
    }
    
    const notasPastorais = await db.select().from(schema.notasPastorais).where(eq(schema.notasPastorais.membroId, titularId));
    const notasFormatadas = notasPastorais.map(nota => ({
      id: nota.id,
      membroId: nota.membroId,
      titulo: nota.titulo,
      temConteudo: !!nota.conteudo,
      nivelSigilo: nota.nivelSigilo,
      autorId: nota.autorId,
      criadoEm: nota.criadoEm,
    }));
    
    const transacoes = await db.select().from(schema.transacoesFinanceiras).where(eq(schema.transacoesFinanceiras.membroId, titularId));
    const acoes = await db.select().from(schema.acoesDiaconais);
    const logsConsentimento = await db.select().from(schema.logsConsentimento).where(eq(schema.logsConsentimento.titularId, titularId));
    
    return {
      tipoTitular,
      dadosPessoais,
      familia,
      notasPastorais: notasFormatadas,
      transacoesFinanceiras: transacoes,
      acoesDiaconais: acoes,
      logsConsentimento,
      dataExportacao: new Date().toISOString(),
    };
  }

  async executarExclusaoTitular(tipoTitular: "membro" | "visitante", titularId: string, opts?: { cascade?: boolean; motivo?: string; solicitacaoId?: string }): Promise<ResultadoExclusaoTitular> {
    const cascade = opts?.cascade ?? true;
    const resultado: ResultadoExclusaoTitular = {
      sucesso: false,
      titularId,
      tipoTitular,
      registrosExcluidos: {
        dadosPrincipais: false,
      },
      motivo: opts?.motivo,
      solicitacaoId: opts?.solicitacaoId,
      dataExclusao: new Date().toISOString(),
    };
    
    try {
      if (cascade) {
        const notasDeletadas = await db.delete(schema.notasPastorais).where(eq(schema.notasPastorais.membroId, titularId));
        resultado.registrosExcluidos.notasPastorais = notasDeletadas.rowCount || 0;
        
        const transacoesDeletadas = await db.delete(schema.transacoesFinanceiras).where(eq(schema.transacoesFinanceiras.membroId, titularId));
        resultado.registrosExcluidos.transacoes = transacoesDeletadas.rowCount || 0;
        
        const logsDeletados = await db.delete(schema.logsConsentimento).where(eq(schema.logsConsentimento.titularId, titularId));
        resultado.registrosExcluidos.logsConsentimento = logsDeletados.rowCount || 0;
      }
      
      if (tipoTitular === "membro") {
        await db.delete(schema.membros).where(eq(schema.membros.id, titularId));
      } else {
        await db.delete(schema.visitantes).where(eq(schema.visitantes.id, titularId));
      }
      
      resultado.registrosExcluidos.dadosPrincipais = true;
      resultado.sucesso = true;
    } catch (error) {
      console.error("Erro ao executar exclusão:", error);
    }
    
    return resultado;
  }

  async registrarLogConsentimento(insertLog: InsertLogConsentimento): Promise<LogConsentimento> {
    const result = await db.insert(schema.logsConsentimento).values(insertLog).returning();
    return result[0];
  }

  async getLogsConsentimentoPorTitular(tipoTitular: "membro" | "visitante", titularId: string): Promise<LogConsentimento[]> {
    return await db.select().from(schema.logsConsentimento)
      .where(eq(schema.logsConsentimento.titularId, titularId));
  }

  async registrarLogAuditoria(insertLog: InsertLogAuditoria): Promise<LogAuditoria> {
    const result = await db.insert(schema.logsAuditoria).values(insertLog).returning();
    return result[0];
  }

  async getLogsAuditoria(params?: { modulo?: string; acao?: string; usuarioId?: string; registroId?: string }): Promise<LogAuditoria[]> {
    await this.ensureInitialized();
    
    const conditions = [];
    if (params?.modulo) conditions.push(eq(schema.logsAuditoria.modulo, params.modulo));
    if (params?.acao) conditions.push(eq(schema.logsAuditoria.acao, params.acao));
    if (params?.usuarioId) conditions.push(eq(schema.logsAuditoria.usuarioId, params.usuarioId));
    if (params?.registroId) conditions.push(eq(schema.logsAuditoria.registroId, params.registroId));
    
    if (conditions.length === 1) {
      return await db.select().from(schema.logsAuditoria).where(conditions[0]);
    } else if (conditions.length > 1) {
      return await db.select().from(schema.logsAuditoria).where(and(...conditions));
    }
    
    return await db.select().from(schema.logsAuditoria);
  }
}

export const storage = new DatabaseStorage();
