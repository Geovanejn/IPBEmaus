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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Usuários
  getUsuario(id: string): Promise<Usuario | undefined>;
  getUsuarioPorEmail(email: string): Promise<Usuario | undefined>;
  criarUsuario(usuario: InsertUsuario): Promise<Usuario>;
  
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
}

export class MemStorage implements IStorage {
  private usuarios: Map<string, Usuario>;
  private membros: Map<string, Membro>;
  private familias: Map<string, Familia>;
  private visitantes: Map<string, Visitante>;
  private notasPastorais: Map<string, NotaPastoral>;
  private transacoes: Map<string, TransacaoFinanceira>;
  private acoesDiaconais: Map<string, AcaoDiaconal>;
  private boletins: Map<string, Boletim>;
  private reunioes: Map<string, Reuniao>;
  private atas: Map<string, Ata>;

  constructor() {
    this.usuarios = new Map();
    this.membros = new Map();
    this.familias = new Map();
    this.visitantes = new Map();
    this.notasPastorais = new Map();
    this.transacoes = new Map();
    this.acoesDiaconais = new Map();
    this.boletins = new Map();
    this.reunioes = new Map();
    this.atas = new Map();
    
    this.popularDadosIniciais();
  }

  private popularDadosIniciais() {
    // Usuários de teste (senha: "123456" para todos)
    const usuarios: Usuario[] = [
      {
        id: "u1",
        email: "pastor@ipbemaus.org",
        senha: "123456",
        cargo: "PASTOR",
        nome: "Rev. João Silva",
        ativo: true,
        criadoEm: new Date(),
      },
      {
        id: "u2",
        email: "presbitero@ipbemaus.org",
        senha: "123456",
        cargo: "PRESBITERO",
        nome: "Pb. Pedro Santos",
        ativo: true,
        criadoEm: new Date(),
      },
      {
        id: "u3",
        email: "tesoureiro@ipbemaus.org",
        senha: "123456",
        cargo: "TESOUREIRO",
        nome: "Maria Oliveira",
        ativo: true,
        criadoEm: new Date(),
      },
      {
        id: "u4",
        email: "diacono@ipbemaus.org",
        senha: "123456",
        cargo: "DIACONO",
        nome: "Dc. Carlos Costa",
        ativo: true,
        criadoEm: new Date(),
      },
    ];
    usuarios.forEach(u => this.usuarios.set(u.id, u));

    // Famílias
    const familiaId1 = "fam1";
    this.familias.set(familiaId1, {
      id: familiaId1,
      nome: "Família Silva Santos",
      endereco: "Rua das Flores, 123 - Centro - São Paulo/SP",
      criadoEm: new Date(),
    });

    // Membros
    const membros: Membro[] = [
      {
        id: "m1",
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
        familiaId: familiaId1,
        status: "ativo",
        fotoUrl: null,
        consentimentoLGPD: true,
        criadoEm: new Date(),
      },
      {
        id: "m2",
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
        familiaId: familiaId1,
        status: "ativo",
        fotoUrl: null,
        consentimentoLGPD: true,
        criadoEm: new Date(),
      },
      {
        id: "m3",
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
        familiaId: null,
        status: "ativo",
        fotoUrl: null,
        consentimentoLGPD: true,
        criadoEm: new Date(),
      },
    ];
    membros.forEach(m => this.membros.set(m.id, m));

    // Visitantes
    const visitantes: Visitante[] = [
      {
        id: "v1",
        nome: "Carlos Alberto Souza",
        email: "carlos.souza@email.com",
        telefone: "(11) 99876-5432",
        endereco: "Rua Nova, 456",
        comoConheceu: "Convite de membro",
        membroConvidouId: "m1",
        dataVisita: "2024-11-03",
        observacoes: "Interessado em conhecer a igreja",
        status: "em_acompanhamento",
        consentimentoLGPD: true,
        criadoEm: new Date(),
      },
      {
        id: "v2",
        nome: "Beatriz Oliveira",
        email: "bia.oliveira@email.com",
        telefone: "(11) 99876-5433",
        endereco: "Av. São João, 789",
        comoConheceu: "Redes sociais",
        membroConvidouId: null,
        dataVisita: "2024-11-05",
        observacoes: "Primeira visita",
        status: "novo",
        consentimentoLGPD: true,
        criadoEm: new Date(),
      },
    ];
    visitantes.forEach(v => this.visitantes.set(v.id, v));

    // Transações
    const transacoes: TransacaoFinanceira[] = [
      {
        id: "t1",
        tipo: "receita",
        categoria: "dizimo",
        descricao: "Dízimo - Maria Silva Santos",
        valor: 50000,
        data: "2024-11-03",
        membroId: "m1",
        centroCusto: "geral",
        metodoPagamento: "transferencia",
        comprovante: null,
        observacoes: null,
        criadoPorId: "u3",
        criadoEm: new Date(),
      },
      {
        id: "t2",
        tipo: "receita",
        categoria: "oferta",
        descricao: "Oferta de Missões",
        valor: 120000,
        data: "2024-11-03",
        membroId: null,
        centroCusto: "missoes",
        metodoPagamento: "dinheiro",
        comprovante: null,
        observacoes: "Culto dominical",
        criadoPorId: "u3",
        criadoEm: new Date(),
      },
      {
        id: "t3",
        tipo: "despesa",
        categoria: "despesa_geral",
        descricao: "Energia Elétrica - Outubro",
        valor: 85000,
        data: "2024-11-01",
        membroId: null,
        centroCusto: "geral",
        metodoPagamento: "transferencia",
        comprovante: null,
        observacoes: null,
        criadoPorId: "u3",
        criadoEm: new Date(),
      },
    ];
    transacoes.forEach(t => this.transacoes.set(t.id, t));

    // Ações Diaconais
    const acoes: AcaoDiaconal[] = [
      {
        id: "ad1",
        tipo: "cesta_basica",
        descricao: "Distribuição de cesta básica para família carente",
        beneficiario: "Família Silva",
        telefone: "(11) 98765-1111",
        endereco: "Rua das Acácias, 45 - Jardim São Paulo",
        valorGasto: 15000,
        data: "2024-11-01",
        responsavelId: "u4",
        observacoes: "Família com 5 pessoas, incluindo 3 crianças",
        criadoEm: new Date(),
      },
      {
        id: "ad2",
        tipo: "visita",
        descricao: "Visita a irmão enfermo",
        beneficiario: "João Pedro Oliveira",
        telefone: "(11) 98765-2222",
        endereco: "Rua Esperança, 123 - Apto 45",
        valorGasto: null,
        data: "2024-11-02",
        responsavelId: "u4",
        observacoes: "Oração e leitura bíblica realizada",
        criadoEm: new Date(),
      },
    ];
    acoes.forEach(a => this.acoesDiaconais.set(a.id, a));
  }

  // Usuários
  async getUsuario(id: string): Promise<Usuario | undefined> {
    return this.usuarios.get(id);
  }

  async getUsuarioPorEmail(email: string): Promise<Usuario | undefined> {
    return Array.from(this.usuarios.values()).find(u => u.email === email);
  }

  async criarUsuario(insertUsuario: InsertUsuario): Promise<Usuario> {
    const id = randomUUID();
    const usuario: Usuario = { ...insertUsuario, id, ativo: true, criadoEm: new Date() };
    this.usuarios.set(id, usuario);
    return usuario;
  }

  // Membros
  async getMembros(): Promise<Membro[]> {
    return Array.from(this.membros.values());
  }

  async getMembro(id: string): Promise<Membro | undefined> {
    return this.membros.get(id);
  }

  async criarMembro(insertMembro: InsertMembro): Promise<Membro> {
    const id = randomUUID();
    const membro: Membro = { ...insertMembro, id, criadoEm: new Date() };
    this.membros.set(id, membro);
    return membro;
  }

  async atualizarMembro(id: string, dados: Partial<Membro>): Promise<Membro | undefined> {
    const membro = this.membros.get(id);
    if (!membro) return undefined;
    const atualizado = { ...membro, ...dados };
    this.membros.set(id, atualizado);
    return atualizado;
  }

  async deletarMembro(id: string): Promise<boolean> {
    return this.membros.delete(id);
  }

  // Famílias
  async getFamilias(): Promise<Familia[]> {
    return Array.from(this.familias.values());
  }

  async getFamilia(id: string): Promise<Familia | undefined> {
    return this.familias.get(id);
  }

  async criarFamilia(insertFamilia: InsertFamilia): Promise<Familia> {
    const id = randomUUID();
    const familia: Familia = { ...insertFamilia, id, criadoEm: new Date() };
    this.familias.set(id, familia);
    return familia;
  }

  // Visitantes
  async getVisitantes(): Promise<Visitante[]> {
    return Array.from(this.visitantes.values());
  }

  async getVisitante(id: string): Promise<Visitante | undefined> {
    return this.visitantes.get(id);
  }

  async criarVisitante(insertVisitante: InsertVisitante): Promise<Visitante> {
    const id = randomUUID();
    const visitante: Visitante = { ...insertVisitante, id, criadoEm: new Date() };
    this.visitantes.set(id, visitante);
    return visitante;
  }

  async atualizarVisitante(id: string, dados: Partial<Visitante>): Promise<Visitante | undefined> {
    const visitante = this.visitantes.get(id);
    if (!visitante) return undefined;
    const atualizado = { ...visitante, ...dados };
    this.visitantes.set(id, atualizado);
    return atualizado;
  }

  async deletarVisitante(id: string): Promise<boolean> {
    return this.visitantes.delete(id);
  }

  // Notas Pastorais
  async getNotasPastorais(): Promise<NotaPastoral[]> {
    return Array.from(this.notasPastorais.values());
  }

  async getNotasPorMembro(membroId: string): Promise<NotaPastoral[]> {
    return Array.from(this.notasPastorais.values()).filter(n => n.membroId === membroId);
  }

  async criarNotaPastoral(insertNota: InsertNotaPastoral): Promise<NotaPastoral> {
    const id = randomUUID();
    const nota: NotaPastoral = { ...insertNota, id, criadoEm: new Date() };
    this.notasPastorais.set(id, nota);
    return nota;
  }

  // Transações
  async getTransacoes(): Promise<TransacaoFinanceira[]> {
    return Array.from(this.transacoes.values());
  }

  async getTransacao(id: string): Promise<TransacaoFinanceira | undefined> {
    return this.transacoes.get(id);
  }

  async criarTransacao(insertTransacao: InsertTransacaoFinanceira): Promise<TransacaoFinanceira> {
    const id = randomUUID();
    const transacao: TransacaoFinanceira = { ...insertTransacao, id, criadoEm: new Date() };
    this.transacoes.set(id, transacao);
    return transacao;
  }

  // Ações Diaconais
  async getAcoesDiaconais(): Promise<AcaoDiaconal[]> {
    return Array.from(this.acoesDiaconais.values());
  }

  async getAcaoDiaconal(id: string): Promise<AcaoDiaconal | undefined> {
    return this.acoesDiaconais.get(id);
  }

  async criarAcaoDiaconal(insertAcao: InsertAcaoDiaconal): Promise<AcaoDiaconal> {
    const id = randomUUID();
    const acao: AcaoDiaconal = { ...insertAcao, id, criadoEm: new Date() };
    this.acoesDiaconais.set(id, acao);
    return acao;
  }

  // Boletins
  async getBoletins(): Promise<Boletim[]> {
    return Array.from(this.boletins.values());
  }

  async getBoletim(id: string): Promise<Boletim | undefined> {
    return this.boletins.get(id);
  }

  async criarBoletim(insertBoletim: InsertBoletim): Promise<Boletim> {
    const id = randomUUID();
    const boletim: Boletim = { ...insertBoletim, id, criadoEm: new Date() };
    this.boletins.set(id, boletim);
    return boletim;
  }

  async atualizarBoletim(id: string, dados: Partial<Boletim>): Promise<Boletim | undefined> {
    const boletim = this.boletins.get(id);
    if (!boletim) return undefined;
    const atualizado = { ...boletim, ...dados };
    this.boletins.set(id, atualizado);
    return atualizado;
  }

  // Reuniões
  async getReunioes(): Promise<Reuniao[]> {
    return Array.from(this.reunioes.values());
  }

  async getReuniao(id: string): Promise<Reuniao | undefined> {
    return this.reunioes.get(id);
  }

  async criarReuniao(insertReuniao: InsertReuniao): Promise<Reuniao> {
    const id = randomUUID();
    const reuniao: Reuniao = { ...insertReuniao, id, criadoEm: new Date() };
    this.reunioes.set(id, reuniao);
    return reuniao;
  }

  // Atas
  async getAtas(): Promise<Ata[]> {
    return Array.from(this.atas.values());
  }

  async getAta(id: string): Promise<Ata | undefined> {
    return this.atas.get(id);
  }

  async criarAta(insertAta: InsertAta): Promise<Ata> {
    const id = randomUUID();
    const ata: Ata = { ...insertAta, id, criadoEm: new Date() };
    this.atas.set(id, ata);
    return ata;
  }

  async aprovarAta(id: string, aprovadoPorId: string): Promise<Ata | undefined> {
    const ata = this.atas.get(id);
    if (!ata) return undefined;
    const aprovada: Ata = {
      ...ata,
      aprovada: true,
      dataAprovacao: new Date(),
      aprovadoPorId,
      bloqueada: true,
    };
    this.atas.set(id, aprovada);
    return aprovada;
  }
}

export const storage = new MemStorage();
