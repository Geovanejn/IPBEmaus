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
export const boletins = pgTable("boletins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: date("data").notNull(),
  numeroEdicao: integer("numero_edicao").notNull(),
  anoEdicao: integer("ano_edicao").notNull(),
  
  // Informações da semana
  ofertaDia: text("oferta_dia"),
  
  // Semana de Oração (opcional)
  semanaOracao: jsonb("semana_oracao"), // { dataInicio, dataFim, programacao: [{dia, horario, tema}] }
  
  // SAF e Eventos Especiais
  saf: text("saf"),
  eventos: text("eventos").array(),
  
  // Aniversários
  aniversariosMembros: jsonb("aniversarios_membros"), // [{nome, data, tipo}] - será populado automaticamente
  aniversariosCasamento: jsonb("aniversarios_casamento"), // [{nomes, data, bodas}]
  
  // Pedidos de Oração (será estruturado na FASE 2)
  pedidosOracao: text("pedidos_oracao").array(),
  
  // Relatório EBD
  relatorioEbd: jsonb("relatorio_ebd"), // { matriculados, domingos: [{data, presentes, ausentes, visitantes, biblias}] }
  
  // Liturgia do Culto
  liturgia: jsonb("liturgia"), // Array de itens na ordem: [{tipo: 'preludio|hino|leitura|oracao|etc', conteudo}]
  
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

export const insertBoletimSchema = createInsertSchema(boletins).omit({ id: true, criadoEm: true });
export type InsertBoletim = z.infer<typeof insertBoletimSchema>;
export type Boletim = typeof boletins.$inferSelect;

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

// ==================== TIPOS AUXILIARES ====================
export type Cargo = "PASTOR" | "PRESBITERO" | "TESOUREIRO" | "DIACONO";

export const CARGOS: Cargo[] = ["PASTOR", "PRESBITERO", "TESOUREIRO", "DIACONO"];

export const PERMISSOES_POR_CARGO: Record<Cargo, {
  pastoral: "total" | "leitura" | "nenhum";
  financeiro: "total" | "leitura" | "nenhum";
  diaconal: "total" | "leitura" | "nenhum";
  boletim: "total" | "leitura" | "nenhum";
  atas: "total" | "leitura" | "nenhum";
}> = {
  PASTOR: {
    pastoral: "total",
    financeiro: "total",
    diaconal: "total",
    boletim: "total",
    atas: "total",
  },
  PRESBITERO: {
    pastoral: "total",
    financeiro: "leitura",
    diaconal: "leitura",
    boletim: "total",
    atas: "total",
  },
  TESOUREIRO: {
    pastoral: "leitura",
    financeiro: "total",
    diaconal: "leitura",
    boletim: "leitura",
    atas: "leitura",
  },
  DIACONO: {
    pastoral: "leitura",
    financeiro: "nenhum",
    diaconal: "total",
    boletim: "leitura",
    atas: "leitura",
  },
};
