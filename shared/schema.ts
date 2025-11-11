import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== AUTENTICAÇÃO ====================
export const usuarios = pgTable("usuarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  cargo: text("cargo").notNull(), // PASTOR, PRESBITERO, TESOUREIRO, DIACONO
  nome: text("nome").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true, criadoEm: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// ==================== MÓDULO PASTORAL ====================
export const membros = pgTable("membros", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cpf: text("cpf"), // Adicionado para LGPD público
  email: text("email"),
  telefone: text("telefone"),
  dataNascimento: date("data_nascimento"),
  endereco: text("endereco"),
  bairro: text("bairro"),
  cidade: text("cidade").notNull().default(""),
  estado: text("estado"),
  cep: text("cep"),
  estadoCivil: text("estado_civil"), // solteiro, casado, viuvo, divorciado
  profissao: text("profissao"),
  dataBatismo: date("data_batismo"),
  dataProfissaoFe: date("data_profissao_fe"),
  familiaId: varchar("familia_id"),
  status: text("status").notNull().default("ativo"), // ativo, inativo, transferido
  fotoUrl: text("foto_url"),
  consentimentoLGPD: boolean("consentimento_lgpd").notNull().default(false),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertMembroSchema = createInsertSchema(membros).omit({ id: true, criadoEm: true });
export type InsertMembro = z.infer<typeof insertMembroSchema>;
export type Membro = typeof membros.$inferSelect;

export const familias = pgTable("familias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertFamiliaSchema = createInsertSchema(familias).omit({ id: true, criadoEm: true });
export type InsertFamilia = z.infer<typeof insertFamiliaSchema>;
export type Familia = typeof familias.$inferSelect;

export const visitantes = pgTable("visitantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cpf: text("cpf"), // Adicionado para LGPD público
  dataNascimento: date("data_nascimento"), // Adicionado para LGPD público
  email: text("email"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  comoConheceu: text("como_conheceu"),
  membroConvidouId: varchar("membro_convidou_id"),
  dataVisita: date("data_visita").notNull(),
  observacoes: text("observacoes"),
  status: text("status").notNull().default("novo"), // novo, em_acompanhamento, membro, inativo
  consentimentoLGPD: boolean("consentimento_lgpd").notNull().default(false),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertVisitanteSchema = createInsertSchema(visitantes).omit({ id: true, criadoEm: true });
export type InsertVisitante = z.infer<typeof insertVisitanteSchema>;
export type Visitante = typeof visitantes.$inferSelect;

export const notasPastorais = pgTable("notas_pastorais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  membroId: varchar("membro_id").notNull(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  nivelSigilo: text("nivel_sigilo").notNull().default("normal"), // normal, confidencial, restrito
  autorId: varchar("autor_id").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertNotaPastoralSchema = createInsertSchema(notasPastorais).omit({ id: true, criadoEm: true });
export type InsertNotaPastoral = z.infer<typeof insertNotaPastoralSchema>;
export type NotaPastoral = typeof notasPastorais.$inferSelect;

// ==================== MÓDULO FINANCEIRO ====================
export const transacoesFinanceiras = pgTable("transacoes_financeiras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(), // receita, despesa
  categoria: text("categoria").notNull(), // dizimo, oferta, despesa_geral, despesa_social
  descricao: text("descricao").notNull(),
  valor: integer("valor").notNull(), // em centavos
  data: date("data").notNull(),
  membroId: varchar("membro_id"),
  centroCusto: text("centro_custo").notNull().default("geral"), // geral, social, missoes, obras
  metodoPagamento: text("metodo_pagamento"), // dinheiro, transferencia, pix, cartao
  comprovante: text("comprovante"),
  observacoes: text("observacoes"),
  criadoPorId: varchar("criado_por_id").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertTransacaoFinanceiraSchema = createInsertSchema(transacoesFinanceiras).omit({ id: true, criadoEm: true });
export type InsertTransacaoFinanceira = z.infer<typeof insertTransacaoFinanceiraSchema>;
export type TransacaoFinanceira = typeof transacoesFinanceiras.$inferSelect;

// ==================== MÓDULO DIACONAL ====================
export const acoesDiaconais = pgTable("acoes_diaconais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(), // cesta_basica, visita, oracao, ajuda_financeira, outro
  descricao: text("descricao").notNull(),
  beneficiario: text("beneficiario").notNull(),
  telefone: text("telefone"),
  endereco: text("endereco"),
  valorGasto: integer("valor_gasto"), // em centavos
  data: date("data").notNull(),
  responsavelId: varchar("responsavel_id").notNull(),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertAcaoDiaconalSchema = createInsertSchema(acoesDiaconais).omit({ id: true, criadoEm: true });
export type InsertAcaoDiaconal = z.infer<typeof insertAcaoDiaconalSchema>;
export type AcaoDiaconal = typeof acoesDiaconais.$inferSelect;

// ==================== MÓDULO BOLETIM DOMINICAL ====================

// Tipos para campos JSONB do boletim
export const itemLiturgiaSchema = z.object({
  tipo: z.enum(['preludio', 'hino', 'leitura', 'oracao', 'cantico', 'mensagem', 'benção', 'amem', 'posludio', 'aviso']),
  conteudo: z.string(),
  numero: z.string().optional(), // Número do hino, por exemplo
  referencia: z.string().optional(), // Referência bíblica, por exemplo
});

export const liturgiaSchema = z.array(itemLiturgiaSchema);

export const pedidoOracaoSchema = z.object({
  categoria: z.enum(['conversao', 'direcao_divina', 'emprego', 'saude', 'igreja', 'outros']),
  descricao: z.string(),
});

export const pedidosOracaoSchema = z.array(pedidoOracaoSchema);

export const aniversarioMembroSchema = z.object({
  nome: z.string(),
  data: z.string(),
});

export const aniversariosCasamentoSchema = z.object({
  casal: z.string(),
  data: z.string(),
  bodas: z.string().optional(), // "25 anos", "Bodas de Prata", etc
});

export const domingoEbdSchema = z.object({
  data: z.string(),
  presentes: z.coerce.number(),
  ausentes: z.coerce.number(),
  visitantes: z.coerce.number(),
  biblias: z.coerce.number(),
});

export const relatorioEbdSchema = z.object({
  matriculados: z.coerce.number(),
  domingos: z.array(domingoEbdSchema),
});

export const semanaOracaoSchema = z.object({
  dataInicio: z.string(),
  dataFim: z.string(),
  programacao: z.array(z.object({
    dia: z.string(),
    horario: z.string(),
    tema: z.string(),
  })),
});

export const boletins = pgTable("boletins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: date("data").notNull(),
  numeroEdicao: integer("numero_edicao").notNull(),
  anoEdicao: integer("ano_edicao").notNull(),
  
  // Informações da semana
  ofertaDia: text("oferta_dia"),
  
  // Semana de Oração (opcional)
  semanaOracao: jsonb("semana_oracao").$type<z.infer<typeof semanaOracaoSchema>>(),
  
  // SAF e Eventos Especiais
  saf: text("saf"),
  eventos: text("eventos").array(),
  
  // Aniversários
  aniversariosMembros: jsonb("aniversarios_membros").$type<z.infer<typeof aniversarioMembroSchema>[]>(),
  aniversariosCasamento: jsonb("aniversarios_casamento").$type<z.infer<typeof aniversariosCasamentoSchema>[]>(),
  
  // Pedidos de Oração estruturados
  pedidosOracao: jsonb("pedidos_oracao").$type<z.infer<typeof pedidosOracaoSchema>>(),
  
  // Relatório EBD
  relatorioEbd: jsonb("relatorio_ebd").$type<z.infer<typeof relatorioEbdSchema>>(),
  
  // Liturgia do Culto
  liturgia: jsonb("liturgia").$type<z.infer<typeof liturgiaSchema>>(),
  
  // Devocional/Mensagem
  tituloMensagem: text("titulo_mensagem").notNull(),
  textoMensagem: text("texto_mensagem"),
  devocional: text("devocional"),
  
  // Avisos gerais
  avisos: text("avisos").array(),
  
  // Controle
  publicado: boolean("publicado").notNull().default(false),
  pdfUrl: text("pdf_url"),
  criadoPorId: varchar("criado_por_id").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertBoletimSchema = createInsertSchema(boletins).omit({ id: true, criadoEm: true }).extend({
  liturgia: liturgiaSchema.optional(),
  pedidosOracao: pedidosOracaoSchema.optional(),
  aniversariosMembros: z.array(aniversarioMembroSchema).optional(),
  aniversariosCasamento: z.array(aniversariosCasamentoSchema).optional(),
  relatorioEbd: relatorioEbdSchema.optional(),
  semanaOracao: semanaOracaoSchema.optional(),
});

export type InsertBoletim = z.infer<typeof insertBoletimSchema>;
export type Boletim = typeof boletins.$inferSelect;
export type ItemLiturgia = z.infer<typeof itemLiturgiaSchema>;
export type PedidoOracao = z.infer<typeof pedidoOracaoSchema>;
export type AniversarioMembro = z.infer<typeof aniversarioMembroSchema>;
export type AniversarioCasamento = z.infer<typeof aniversariosCasamentoSchema>;
export type RelatorioEbd = z.infer<typeof relatorioEbdSchema>;
export type SemanaOracao = z.infer<typeof semanaOracaoSchema>;

// ==================== MÓDULO SECRETARIA DE ATAS ====================
export const reunioes = pgTable("reunioes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(), // conselho, congregacao, diretoria
  data: timestamp("data").notNull(),
  local: text("local").notNull(),
  participantes: text("participantes").array(),
  status: text("status").notNull().default("agendada"), // agendada, realizada, cancelada
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertReuniaoSchema = createInsertSchema(reunioes).omit({ id: true, criadoEm: true });
export type InsertReuniao = z.infer<typeof insertReuniaoSchema>;
export type Reuniao = typeof reunioes.$inferSelect;

export const atas = pgTable("atas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reuniaoId: varchar("reuniao_id").notNull(),
  conteudo: text("conteudo").notNull(),
  aprovada: boolean("aprovada").notNull().default(false),
  dataAprovacao: timestamp("data_aprovacao"),
  aprovadoPorId: varchar("aprovado_por_id"),
  pdfUrl: text("pdf_url"),
  bloqueada: boolean("bloqueada").notNull().default(false),
  secretarioId: varchar("secretario_id").notNull(),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertAtaSchema = createInsertSchema(atas).omit({ id: true, criadoEm: true });
export type InsertAta = z.infer<typeof insertAtaSchema>;
export type Ata = typeof atas.$inferSelect;

// ==================== MÓDULO LGPD ====================
export const solicitacoesLGPD = pgTable("solicitacoes_lgpd", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: text("tipo").notNull(), // acesso, exportacao, exclusao, retificacao
  status: text("status").notNull().default("pendente"), // pendente, em_andamento, concluida, recusada
  tipoTitular: text("tipo_titular").notNull(), // membro, visitante
  titularId: varchar("titular_id").notNull(),
  titularNome: text("titular_nome").notNull(),
  titularEmail: text("titular_email").notNull(),
  motivo: text("motivo"),
  justificativaRecusa: text("justificativa_recusa"),
  responsavelId: varchar("responsavel_id"),
  dataAtendimento: timestamp("data_atendimento"),
  arquivoExportacao: text("arquivo_exportacao"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertSolicitacaoLGPDSchema = createInsertSchema(solicitacoesLGPD).omit({ id: true, criadoEm: true });
export type InsertSolicitacaoLGPD = z.infer<typeof insertSolicitacaoLGPDSchema>;
export type SolicitacaoLGPD = typeof solicitacoesLGPD.$inferSelect;

export const logsConsentimento = pgTable("logs_consentimento", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoTitular: text("tipo_titular").notNull(), // membro, visitante
  titularId: varchar("titular_id").notNull(),
  titularNome: text("titular_nome").notNull(),
  acao: text("acao").notNull(), // concedido, revogado
  consentimentoAnterior: boolean("consentimento_anterior").notNull(),
  consentimentoNovo: boolean("consentimento_novo").notNull(),
  usuarioId: varchar("usuario_id"),
  ipAddress: text("ip_address"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertLogConsentimentoSchema = createInsertSchema(logsConsentimento).omit({ id: true, criadoEm: true });
export type InsertLogConsentimento = z.infer<typeof insertLogConsentimentoSchema>;
export type LogConsentimento = typeof logsConsentimento.$inferSelect;

export const logsAuditoria = pgTable("logs_auditoria", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modulo: text("modulo").notNull(), // pastoral, financeiro, diaconal, boletim, atas, lgpd, auth
  acao: text("acao").notNull(), // criar, editar, deletar, visualizar, exportar, aprovar
  descricao: text("descricao").notNull(),
  registroId: varchar("registro_id"),
  usuarioId: varchar("usuario_id").notNull(),
  usuarioNome: text("usuario_nome").notNull(),
  usuarioCargo: text("usuario_cargo").notNull(),
  ipAddress: text("ip_address"),
  dadosAnteriores: jsonb("dados_anteriores"),
  dadosNovos: jsonb("dados_novos"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertLogAuditoriaSchema = createInsertSchema(logsAuditoria).omit({ id: true, criadoEm: true });
export type InsertLogAuditoria = z.infer<typeof insertLogAuditoriaSchema>;
export type LogAuditoria = typeof logsAuditoria.$inferSelect;

// Tipos para exportação de dados LGPD
export interface DadosTitularExport {
  tipoTitular: "membro" | "visitante";
  dadosPessoais: Partial<Membro> | Partial<Visitante>;
  familia?: Partial<Familia>;
  notasPastorais?: Array<Omit<NotaPastoral, "conteudo"> & { temConteudo: boolean }>;
  transacoesFinanceiras?: Partial<TransacaoFinanceira>[];
  acoesDiaconais?: Partial<AcaoDiaconal>[];
  logsConsentimento?: LogConsentimento[];
  dataExportacao: string;
}

export interface ResultadoExclusaoTitular {
  sucesso: boolean;
  titularId: string;
  tipoTitular: "membro" | "visitante";
  registrosExcluidos: {
    dadosPrincipais: boolean;
    notasPastorais?: number;
    transacoes?: number;
    acoesDiaconais?: number;
    logsConsentimento?: number;
  };
  motivo?: string;
  solicitacaoId?: string;
  dataExclusao: string;
}

// ==================== TIPOS AUXILIARES ====================
export type Cargo = "PASTOR" | "PRESBITERO" | "TESOUREIRO" | "DIACONO";

export const CARGOS: Cargo[] = ["PASTOR", "PRESBITERO", "TESOUREIRO", "DIACONO"];

// ==================== LGPD PÚBLICO - VERIFICAÇÃO ====================
export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hashedCodigo: text("hashed_codigo").notNull(), // Código hasheado (bcrypt)
  tipoTitular: text("tipo_titular").notNull(), // membro, visitante
  titularId: varchar("titular_id").notNull(),
  telefone: text("telefone"), // Telefone que recebeu o SMS
  email: text("email"), // Email que recebeu o código (fallback)
  canal: text("canal").notNull(), // sms, email
  tentativasValidacao: integer("tentativas_validacao").notNull().default(0),
  validado: boolean("validado").notNull().default(false),
  sessionToken: varchar("session_token"), // Token opaco para autenticar operações
  sessionExpiresAt: timestamp("session_expires_at"), // Expira em 30 minutos após validação
  expiresAt: timestamp("expires_at").notNull(), // Expira em 10 minutos
  validadoEm: timestamp("validado_em"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertVerificationTokenSchema = createInsertSchema(verificationTokens).omit({ id: true, criadoEm: true });
export type InsertVerificationToken = z.infer<typeof insertVerificationTokenSchema>;
export type VerificationToken = typeof verificationTokens.$inferSelect;

export const lgpdAccessLogs = pgTable("lgpd_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoTitular: text("tipo_titular").notNull(), // membro, visitante
  titularId: varchar("titular_id").notNull(),
  titularNome: text("titular_nome").notNull(),
  acao: text("acao").notNull(), // solicitar_codigo, validar_codigo, exportar_dados, solicitar_exclusao
  canalVerificacao: text("canal_verificacao"), // sms, email
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sucesso: boolean("sucesso").notNull().default(true),
  motivoFalha: text("motivo_falha"),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertLgpdAccessLogSchema = createInsertSchema(lgpdAccessLogs).omit({ id: true, criadoEm: true });
export type InsertLgpdAccessLog = z.infer<typeof insertLgpdAccessLogSchema>;
export type LgpdAccessLog = typeof lgpdAccessLogs.$inferSelect;

export const PERMISSOES_POR_CARGO: Record<Cargo, {
  pastoral: "total" | "leitura" | "nenhum";
  financeiro: "total" | "leitura" | "nenhum";
  diaconal: "total" | "leitura" | "nenhum";
  boletim: "total" | "leitura" | "nenhum";
  atas: "total" | "leitura" | "nenhum";
  lgpd: "total" | "leitura" | "nenhum";
}> = {
  PASTOR: {
    pastoral: "total",
    financeiro: "total",
    diaconal: "total",
    boletim: "total",
    atas: "total",
    lgpd: "total",
  },
  PRESBITERO: {
    pastoral: "total",
    financeiro: "leitura",
    diaconal: "leitura",
    boletim: "total",
    atas: "total",
    lgpd: "leitura",
  },
  TESOUREIRO: {
    pastoral: "leitura",
    financeiro: "total",
    diaconal: "leitura",
    boletim: "leitura",
    atas: "leitura",
    lgpd: "nenhum",
  },
  DIACONO: {
    pastoral: "leitura",
    financeiro: "nenhum",
    diaconal: "total",
    boletim: "leitura",
    atas: "leitura",
    lgpd: "nenhum",
  },
};
