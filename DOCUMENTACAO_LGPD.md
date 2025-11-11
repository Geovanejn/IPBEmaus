# Documentação Completa do Sistema LGPD - IPB Emaús

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
4. [Componentes Frontend](#componentes-frontend)
5. [Rotas Backend](#rotas-backend)
6. [Sistema de Segurança](#sistema-de-segurança)
7. [Logs e Auditoria](#logs-e-auditoria)
8. [Estrutura de Dados](#estrutura-de-dados)
9. [Integração com Outros Módulos](#integração-com-outros-módulos)
10. [Manutenção e Troubleshooting](#manutenção-e-troubleshooting)

---

## 🎯 Visão Geral

O Sistema LGPD do IPB Emaús foi desenvolvido para garantir conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), permitindo que titulares de dados (membros e visitantes) exerçam seus direitos de:

- **Acesso**: Visualizar quais dados pessoais estão armazenados
- **Portabilidade**: Exportar seus dados em formato estruturado (JSON)
- **Exclusão**: Solicitar a remoção permanente de seus dados

### Principais Características

✅ **Portal Público**: Acesso sem autenticação via código de verificação  
✅ **Painel Administrativo**: Gestão centralizada de solicitações (apenas PASTOR)  
✅ **Verificação em 2 Fatores**: Código de 6 dígitos via SMS ou e-mail  
✅ **Rate Limiting**: Proteção contra abuso de solicitações  
✅ **Logs Completos**: Auditoria de todas as ações LGPD  
✅ **Session Tokens**: Sessões temporárias com expiração de 30 minutos  

---

## 🏗️ Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐        ┌──────────────────────┐   │
│  │ Portal LGPD Público │        │   Painel Admin LGPD  │   │
│  │  /portal-lgpd       │        │   /lgpd-admin        │   │
│  │  (Sem autenticação) │        │   (Apenas PASTOR)    │   │
│  └─────────────────────┘        └──────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express + TypeScript)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Rotas Públicas LGPD (/api/lgpd)            │  │
│  │  - POST /solicitar-codigo                            │  │
│  │  - POST /validar-codigo                              │  │
│  │  - GET  /exportar-dados (requer session token)       │  │
│  │  - POST /solicitar-exclusao (requer session token)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Rotas Admin LGPD (/api/lgpd)                │  │
│  │  - GET    /solicitacoes                              │  │
│  │  - POST   /solicitacoes/:id/processar                │  │
│  │  - GET    /exportar-titular/:tipo/:id                │  │
│  │  - DELETE /excluir-titular/:tipo/:id                 │  │
│  │  - GET    /logs-consentimento                        │  │
│  │  - GET    /logs-auditoria                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CAMADA DE DADOS (Storage)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • Verification Tokens (códigos de verificação)            │
│  • Session Tokens (sessões temporárias)                    │
│  • Solicitações LGPD (exportação, exclusão)                │
│  • Logs de Acesso LGPD                                     │
│  • Logs de Consentimento                                   │
│  • Logs de Auditoria                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Camadas do Sistema

#### 1. **Frontend**
- **Portal Público** (`/portal-lgpd`): Acessível sem login
- **Painel Admin** (`/lgpd-admin`): Restrito ao cargo PASTOR

#### 2. **Backend**
- **Rotas Públicas**: Sem autenticação de usuário, usa verificação 2FA
- **Rotas Administrativas**: Requer autenticação com cargo PASTOR
- **Rate Limiters**: Proteção contra abuso (3 códigos/hora, 5 validações/hora)

#### 3. **Storage**
- **MemStorage**: Implementação em memória (desenvolvimento)
- **Preparado para PostgreSQL**: Estrutura compatível com Drizzle ORM

---

## 🔄 Fluxo de Funcionamento

### Fluxo Portal Público - Exportar Dados

```
1. Titular acessa /portal-lgpd
   │
   ▼
2. Preenche formulário (nome, CPF, data nascimento, telefone)
   │
   ▼
3. Sistema valida dados e busca titular no banco
   │
   ├─ Titular encontrado → Envia código 6 dígitos (SMS ou e-mail)
   │                         Salva verification token hasheado
   └─ Titular NÃO encontrado → Resposta genérica (evita enumeração)
   │
   ▼
4. Titular recebe código e insere no portal
   │
   ▼
5. Sistema valida código (máx 3 tentativas, 10 min expiração)
   │
   ├─ Código válido → Gera session token (30 min expiração)
   └─ Código inválido → Incrementa tentativas, bloqueia após 3
   │
   ▼
6. Titular acessa tela de ações (exportar ou excluir)
   │
   ▼
7a. Exportar Dados
    - Busca todos os dados do titular
    - Exporta JSON completo
    - Revoga session token
    - Registra log de auditoria
    
7b. Solicitar Exclusão
    - Cria solicitação com status "pendente"
    - Revoga session token
    - Notifica administradores
    - Aguarda aprovação do PASTOR
```

### Fluxo Painel Admin - Processar Solicitações

```
1. PASTOR acessa /lgpd-admin
   │
   ▼
2. Visualiza lista de solicitações pendentes
   │
   ▼
3. Seleciona solicitação para processar
   │
   ├─ Aprovar Exportação
   │   - Exporta dados do titular
   │   - Marca solicitação como "concluída"
   │   - Registra log de auditoria
   │
   ├─ Aprovar Exclusão
   │   - Exclui permanentemente todos os dados do titular
   │   - Marca solicitação como "concluída"
   │   - Registra log de auditoria
   │
   └─ Recusar Solicitação
       - Exige justificativa obrigatória
       - Marca solicitação como "recusada"
       - Salva motivo da recusa
       - Registra log de auditoria
```

---

## 💻 Componentes Frontend

### 1. Portal LGPD Público (`client/src/pages/portal-lgpd-publico.tsx`)

**Localização**: `/portal-lgpd` (rota pública, sem autenticação)

**Funcionalidades**:
- Stepper de 3 etapas: Solicitar → Validar → Ações
- Normalização automática de CPF
- Validação de formulários
- Feedback visual em tempo real
- Exportação de dados em JSON
- Solicitação de exclusão com motivo opcional

**Estados Principais**:
```typescript
type Step = "solicitar" | "validar" | "acoes";

interface SessionData {
  sessionToken: string;
  expiresAt: string;
  titular: {
    nome: string;
    tipo: "membro" | "visitante";
  };
}
```

**Fluxo de Navegação**:
1. **Etapa "solicitar"**: Formulário com nome, CPF, data nascimento, telefone
2. **Etapa "validar"**: Campo para código de 6 dígitos + botão voltar
3. **Etapa "acoes"**: Cards com opções de exportar ou excluir dados

**Segurança**:
- Session token armazenado em `localStorage` e enviado via header `x-lgpd-session`
- Token revogado após qualquer ação (exportar ou solicitar exclusão)
- Limpeza de formulário após conclusão

---

### 2. Painel Admin LGPD (`client/src/pages/lgpd-admin.tsx`)

**Localização**: `/lgpd-admin` (restrito ao cargo PASTOR)

**Funcionalidades**:
- 3 abas com Tabs do Shadcn:
  - **Solicitações**: Gerenciamento de solicitações LGPD
  - **Logs de Consentimento**: Histórico de alterações de consentimento
  - **Logs de Auditoria**: Todas as ações no sistema

**Aba Solicitações**:
- Lista todas as solicitações (pendente, em andamento, concluída, recusada)
- Botões de ação: Aprovar / Recusar (apenas para pendentes)
- Dialog de confirmação com justificativa obrigatória para recusa
- Badges coloridos para status e tipos

**Aba Logs de Consentimento**:
- Tabela com histórico completo
- Mostra alteração: "Não → Sim" ou "Sim → Não"
- IP do responsável
- Usuário que fez a alteração

**Aba Logs de Auditoria**:
- Filtros por módulo
- Informações do usuário (nome, cargo)
- Descrição detalhada da ação
- Timestamp formatado em pt-BR

**Mutations (React Query)**:
```typescript
// Processar solicitação (aprovar/recusar)
processarSolicitacaoMutation

// Exportar dados de um titular específico
exportarDadosTitularMutation

// Excluir dados de um titular permanentemente
excluirDadosTitularMutation
```

---

## 🔌 Rotas Backend

### Arquivo: `server/routes/lgpd-public.ts`

### Rotas Públicas (sem autenticação de usuário)

#### 1. `POST /api/lgpd/solicitar-codigo`

**Rate Limit**: 3 solicitações por hora por IP

**Request Body**:
```json
{
  "nome": "João da Silva",
  "cpf": "12345678900",          // Apenas dígitos (normalizado no frontend)
  "dataNascimento": "1990-05-15", // Formato YYYY-MM-DD
  "telefone": "11987654321"       // Opcional
}
```

**Validações**:
- Nome: mínimo 3 caracteres
- CPF: exatamente 11 dígitos
- Data nascimento: formato ISO (YYYY-MM-DD)

**Fluxo**:
1. Valida dados com Zod schema
2. Busca titular (membro ou visitante) por CPF + nome + data nascimento
3. Se não encontrado: retorna sucesso genérico (evita enumeração)
4. Se encontrado: 
   - Gera código aleatório de 6 dígitos
   - Hasheia o código (bcrypt)
   - Envia código via SMS (se telefone) ou e-mail
   - Salva verification token no banco
   - Registra log de acesso

**Response**:
```json
{
  "message": "Se os dados estiverem corretos, você receberá um código de verificação em breve.",
  "canal": "sms" // ou "email"
}
```

**Segurança**:
- Resposta genérica para evitar enumeração de usuários
- Código hasheado no banco (nunca armazena plaintext)
- Expiração de 10 minutos
- Log de todas as tentativas (sucesso e falha)

---

#### 2. `POST /api/lgpd/validar-codigo`

**Rate Limit**: 5 tentativas por hora por IP

**Request Body**:
```json
{
  "codigo": "123456",             // 6 dígitos
  "cpf": "12345678900",
  "dataNascimento": "1990-05-15"
}
```

**Fluxo**:
1. Busca titular por CPF + data nascimento
2. Busca verification token do titular
3. Verifica se já excedeu 3 tentativas
4. Compara código hasheado (bcrypt.compare)
5. Se válido:
   - Marca token como validado
   - Gera session token único (30 min expiração)
   - Retorna session token
6. Se inválido:
   - Incrementa contador de tentativas
   - Registra log de falha

**Response (sucesso)**:
```json
{
  "message": "Código validado com sucesso!",
  "sessionToken": "abc123...",
  "expiresAt": "2025-11-11T15:30:00.000Z",
  "titular": {
    "nome": "João da Silva",
    "tipo": "membro"
  }
}
```

**Segurança**:
- Máximo 3 tentativas por código
- Código expira em 10 minutos
- Session token expira em 30 minutos
- Resposta genérica para código inválido

---

#### 3. `GET /api/lgpd/exportar-dados`

**Autenticação**: Requer session token via header `x-lgpd-session`

**Middleware**: `validarSessionToken`

**Fluxo**:
1. Valida session token (não expirado, não revogado)
2. Extrai `titularId` e `tipoTitular` do token
3. Busca todos os dados do titular:
   - Dados pessoais
   - Dados de contato
   - Histórico eclesiástico (se membro)
   - Notas pastorais
   - Transações financeiras
   - Ações diaconais
4. Revoga session token (uso único)
5. Registra log de auditoria
6. Retorna JSON completo

**Response**:
```json
{
  "dadosPessoais": {
    "id": "...",
    "nome": "João da Silva",
    "cpf": "12345678900",
    "dataNascimento": "1990-05-15",
    "email": "joao@example.com",
    "telefone": "11987654321",
    // ... outros campos
  },
  "historicoEclesiastico": { /* ... */ },
  "notasPastorais": [ /* ... */ ],
  "transacoesFinanceiras": [ /* ... */ ],
  "acoesDiaconais": [ /* ... */ ]
}
```

**Importante**:
- Session token é revogado após uso (não pode ser reutilizado)
- Exportação completa de TODOS os dados do titular
- JSON estruturado e legível

---

#### 4. `POST /api/lgpd/solicitar-exclusao`

**Autenticação**: Requer session token via header `x-lgpd-session`

**Request Body**:
```json
{
  "motivo": "Não frequento mais a igreja" // Opcional
}
```

**Fluxo**:
1. Valida session token
2. Busca dados do titular
3. Cria solicitação LGPD com status "pendente"
4. Revoga session token
5. Registra log de auditoria
6. Retorna confirmação

**Response**:
```json
{
  "message": "Solicitação de exclusão registrada com sucesso!",
  "solicitacao": {
    "id": "...",
    "status": "pendente",
    "criadaEm": "2025-11-11T14:00:00.000Z"
  }
}
```

**Importante**:
- Solicitação fica pendente até aprovação do PASTOR
- Titular não pode executar exclusão diretamente (compliance)
- PASTOR deve revisar e aprovar/recusar no painel admin

---

### Rotas Administrativas (cargo PASTOR)

**Arquivo**: `server/routes.ts` (seção LGPD Admin)

#### 5. `GET /api/lgpd/solicitacoes`

**Autenticação**: Requer sessão com cargo PASTOR

**Response**:
```json
[
  {
    "id": "...",
    "tipo": "exportacao", // ou "exclusao"
    "status": "pendente", // ou "em_andamento", "concluida", "recusada"
    "tipoTitular": "membro",
    "titularId": "...",
    "titularNome": "João da Silva",
    "titularEmail": "joao@example.com",
    "motivo": "Não frequento mais",
    "justificativaRecusa": null,
    "criadoEm": "2025-11-11T14:00:00.000Z"
  }
]
```

---

#### 6. `POST /api/lgpd/solicitacoes/:id/processar`

**Request Body**:
```json
{
  "status": "concluida", // ou "recusada"
  "justificativaRecusa": "Dados necessários para registros oficiais" // Obrigatório se recusada
}
```

**Fluxo**:
1. Valida permissão (PASTOR)
2. Atualiza status da solicitação
3. Se recusada: salva justificativa
4. Registra log de auditoria

---

#### 7. `GET /api/lgpd/exportar-titular/:tipo/:id`

**Parâmetros**:
- `tipo`: "membro" ou "visitante"
- `id`: ID do titular

**Uso**: PASTOR exporta dados de um titular específico

---

#### 8. `DELETE /api/lgpd/excluir-titular/:tipo/:id`

**Request Body**:
```json
{
  "solicitacaoId": "..."
}
```

**Fluxo**:
1. Valida permissão (PASTOR)
2. Exclui permanentemente todos os dados do titular
3. Atualiza solicitação para "concluída"
4. Registra log de auditoria

**⚠️ ATENÇÃO**: Ação irreversível! Exclui:
- Dados pessoais
- Notas pastorais
- Transações financeiras relacionadas
- Ações diaconais
- Logs de consentimento

---

#### 9. `GET /api/lgpd/logs-consentimento`

**Response**:
```json
[
  {
    "id": "...",
    "tipoTitular": "membro",
    "titularId": "...",
    "titularNome": "João da Silva",
    "acao": "concedido", // ou "revogado"
    "consentimentoAnterior": false,
    "consentimentoNovo": true,
    "usuarioId": "...",
    "ipAddress": "192.168.1.1",
    "criadoEm": "2025-11-11T14:00:00.000Z"
  }
]
```

---

#### 10. `GET /api/lgpd/logs-auditoria`

**Response**:
```json
[
  {
    "id": "...",
    "modulo": "PASTORAL",
    "acao": "CRIAR_MEMBRO",
    "descricao": "Pastor criou novo membro: João da Silva",
    "registroId": "...",
    "usuarioId": "...",
    "usuarioNome": "Pastor Silva",
    "usuarioCargo": "PASTOR",
    "ipAddress": "192.168.1.1",
    "criadoEm": "2025-11-11T14:00:00.000Z"
  }
]
```

---

## 🔒 Sistema de Segurança

### 1. Rate Limiting

**Implementado com**: `express-rate-limit`

**Limites**:
- **Solicitar código**: 3 requisições/hora por IP
- **Validar código**: 5 requisições/hora por IP

**Comportamento**:
- Conta todas as requisições (sucesso e falha)
- Headers padrão (`RateLimit-*`)
- Mensagem de erro personalizada

**Código**:
```typescript
const solicitarCodigoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: { 
    error: "Muitas solicitações de código. Por favor, aguarde antes de tentar novamente."
  },
});
```

---

### 2. Verificação em 2 Fatores

**Fluxo**:
1. Código aleatório de 6 dígitos gerado
2. Código hasheado com bcrypt antes de salvar
3. Código enviado via SMS ou e-mail
4. Validação compara hash (bcrypt.compare)

**Segurança**:
- Código expira em 10 minutos
- Máximo 3 tentativas de validação
- Código hasheado no banco (nunca plaintext)

**Código**:
```typescript
// Gerar e hashear código
const codigo = Math.floor(100000 + Math.random() * 900000).toString();
const hashedCodigo = await bcrypt.hash(codigo, 10);

// Validar código
const codigoValido = await bcrypt.compare(codigoInput, hashedCodigo);
```

---

### 3. Session Tokens

**Características**:
- Token único gerado após validação de código
- Expiração de 30 minutos
- Uso único (revogado após ação)
- Armazenado no banco para validação

**Estrutura**:
```typescript
interface VerificationToken {
  id: string;
  hashedCodigo: string;
  tipoTitular: "membro" | "visitante";
  titularId: string;
  expiresAt: Date;
  tentativasValidacao: number;
  validado: boolean;
  sessionToken?: string;
  sessionExpiresAt?: Date;
}
```

**Middleware de Validação**:
```typescript
async function validarSessionToken(req, res, next) {
  const sessionToken = req.headers['x-lgpd-session'];
  
  // Busca token no banco
  const token = await storage.buscarSessionToken(sessionToken);
  
  // Valida se existe, está validado e não expirou
  if (!token || !token.validado || new Date() > token.sessionExpiresAt) {
    return res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
  
  // Anexa dados da sessão à request
  req.lgpdSession = {
    titularId: token.titularId,
    tipoTitular: token.tipoTitular,
  };
  
  next();
}
```

---

### 4. Proteção contra Enumeração

**Problema**: Atacante pode descobrir quais CPFs estão cadastrados

**Solução**: Resposta genérica sempre

**Exemplo**:
```typescript
// ❌ MAU (revela se CPF existe)
if (!titular) {
  return res.status(404).json({ error: "CPF não encontrado" });
}

// ✅ BOM (resposta genérica)
if (!titular) {
  return res.json({
    message: "Se os dados estiverem corretos, você receberá um código de verificação em breve."
  });
}
```

---

### 5. Captura de IP

**Helper**:
```typescript
function obterClienteInfo(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] || req.ip || 'unknown')
      .split(',')[0].trim(),
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}
```

**Importante**:
- Suporta `x-forwarded-for` (proxy/load balancer)
- Fallback para `req.ip`
- Registrado em todos os logs

---

## 📊 Logs e Auditoria

### 1. Logs de Acesso LGPD

**Propósito**: Rastrear todas as tentativas de acesso ao portal LGPD

**Campos**:
```typescript
{
  id: string;
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  acao: "solicitar_codigo" | "validar_codigo" | "exportar_dados" | "solicitar_exclusao";
  canalVerificacao: "sms" | "email" | "web";
  ipAddress: string;
  userAgent: string;
  sucesso: boolean;
  motivoFalha?: string; // Se sucesso = false
  criadoEm: Date;
}
```

**Casos de Uso**:
- Detectar tentativas de acesso não autorizado
- Auditar acessos bem-sucedidos
- Investigar problemas reportados

---

### 2. Logs de Consentimento

**Propósito**: Rastrear alterações no consentimento LGPD de titulares

**Campos**:
```typescript
{
  id: string;
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  acao: "concedido" | "revogado";
  consentimentoAnterior: boolean;
  consentimentoNovo: boolean;
  usuarioId: string;
  ipAddress: string;
  criadoEm: Date;
}
```

**Quando Registrar**:
- Ao criar membro/visitante com `consentimento = true`
- Ao atualizar membro/visitante e campo `consentimento` mudar

**Helper**:
```typescript
async function registrarConsentimento(params: {
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  consentimentoAnterior: boolean;
  consentimentoNovo: boolean;
  usuarioId: string;
  ipAddress?: string;
}) {
  try {
    await storage.registrarLogConsentimento({
      ...params,
      acao: params.consentimentoNovo ? "concedido" : "revogado",
    });
  } catch (error) {
    console.error("Erro ao registrar log de consentimento:", error);
    // Não quebra o fluxo principal
  }
}
```

---

### 3. Logs de Auditoria

**Propósito**: Rastrear TODAS as ações no sistema (não apenas LGPD)

**Campos**:
```typescript
{
  id: string;
  modulo: "PASTORAL" | "FINANCEIRO" | "DIACONAL" | "BOLETIM" | "ATAS" | "LGPD_PUBLICO" | "LGPD_ADMIN";
  acao: string; // Ex: "CRIAR_MEMBRO", "ATUALIZAR_TRANSACAO", "EXPORTAR_DADOS"
  descricao: string; // Texto livre descritivo
  registroId?: string; // ID do registro afetado
  usuarioId: string;
  usuarioNome: string;
  usuarioCargo: "PASTOR" | "PRESBÍTERO" | "TESOUREIRO" | "DIÁCONO" | "SISTEMA";
  ipAddress?: string;
  criadoEm: Date;
}
```

**Exemplos**:
```typescript
// Exemplo 1: Titular exportou dados
await storage.registrarLogAuditoria({
  modulo: "LGPD_PUBLICO",
  acao: "EXPORTAR_DADOS",
  descricao: `Titular João da Silva (membro) exportou seus dados via portal público`,
  usuarioId: "sistema",
  usuarioNome: "Portal LGPD Público",
  usuarioCargo: "SISTEMA",
  registroId: titularId,
});

// Exemplo 2: PASTOR aprovou exclusão
await storage.registrarLogAuditoria({
  modulo: "LGPD_ADMIN",
  acao: "APROVAR_EXCLUSAO",
  descricao: `PASTOR aprovou exclusão de dados de João da Silva (membro)`,
  usuarioId: req.session.userId,
  usuarioNome: usuario.nome,
  usuarioCargo: "PASTOR",
  registroId: solicitacaoId,
});
```

---

## 🗄️ Estrutura de Dados

### 1. Verification Tokens

**Tabela/Collection**: `verification_tokens`

```typescript
{
  id: string;                    // UUID
  hashedCodigo: string;          // Código hasheado (bcrypt)
  tipoTitular: "membro" | "visitante";
  titularId: string;
  telefone?: string;
  email?: string;
  canal: "sms" | "email";
  expiresAt: Date;               // Expira em 10 minutos
  tentativasValidacao: number;   // Máximo 3
  validado: boolean;             // False até validar código
  sessionToken?: string;         // Gerado após validação
  sessionExpiresAt?: Date;       // Expira em 30 minutos
  criadoEm: Date;
}
```

**Índices Necessários**:
- `titularId` (busca rápida)
- `sessionToken` (validação de sessão)
- `expiresAt` (limpeza de tokens expirados)

---

### 2. Solicitações LGPD

**Tabela/Collection**: `solicitacoes_lgpd`

```typescript
{
  id: string;
  tipo: "acesso" | "exportacao" | "exclusao";
  status: "pendente" | "em_andamento" | "concluida" | "recusada";
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  titularEmail: string;
  motivo?: string;               // Motivo da solicitação (opcional)
  justificativaRecusa?: string;  // Motivo da recusa (obrigatório se recusada)
  responsavelId?: string;        // ID do PASTOR que processou
  dataAtendimento?: Date;
  arquivoExportacao?: string;    // Path do arquivo exportado (se aplicável)
  criadoEm: Date;
  atualizadoEm: Date;
}
```

**Índices Necessários**:
- `status` (listar pendentes)
- `tipoTitular + titularId` (buscar por titular)

---

### 3. Logs de Acesso LGPD

**Tabela/Collection**: `logs_acesso_lgpd`

```typescript
{
  id: string;
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  acao: "solicitar_codigo" | "validar_codigo" | "exportar_dados" | "solicitar_exclusao";
  canalVerificacao: "sms" | "email" | "web";
  ipAddress: string;
  userAgent: string;
  sucesso: boolean;
  motivoFalha?: string;
  criadoEm: Date;
}
```

**Índices Necessários**:
- `titularId` (histórico por titular)
- `ipAddress` (detectar abuso)
- `criadoEm` (ordenação temporal)

---

### 4. Logs de Consentimento

**Tabela/Collection**: `logs_consentimento`

```typescript
{
  id: string;
  tipoTitular: "membro" | "visitante";
  titularId: string;
  titularNome: string;
  acao: "concedido" | "revogado";
  consentimentoAnterior: boolean;
  consentimentoNovo: boolean;
  usuarioId: string;
  ipAddress?: string;
  criadoEm: Date;
}
```

**Índices Necessários**:
- `titularId` (histórico por titular)
- `criadoEm` (ordenação temporal)

---

### 5. Logs de Auditoria

**Tabela/Collection**: `logs_auditoria`

```typescript
{
  id: string;
  modulo: string;
  acao: string;
  descricao: string;
  registroId?: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioCargo: string;
  ipAddress?: string;
  criadoEm: Date;
}
```

**Índices Necessários**:
- `modulo` (filtrar por módulo)
- `usuarioId` (ações por usuário)
- `criadoEm` (ordenação temporal)

---

## 🔗 Integração com Outros Módulos

### 1. Módulo Pastoral

**Integração**:
- Ao criar/editar membro: registra log de consentimento se campo mudou
- Campo `consentimento` obrigatório no cadastro

**Código**:
```typescript
// Em server/routes.ts - POST /api/membros
const novoMembro = await storage.createMembro(validacao.data);

// Registrar consentimento inicial
if (validacao.data.consentimento) {
  await registrarConsentimento({
    tipoTitular: "membro",
    titularId: novoMembro.id,
    titularNome: novoMembro.nome,
    consentimentoAnterior: false,
    consentimentoNovo: true,
    usuarioId: req.session.userId!,
    ipAddress: req.ip,
  });
}
```

---

### 2. Módulo Financeiro

**Integração**:
- Ao exportar dados: inclui transações financeiras do titular
- Ao excluir titular: remove transações relacionadas

---

### 3. Módulo Diaconal

**Integração**:
- Ao exportar dados: inclui ações diaconais do titular
- Ao excluir titular: remove ações relacionadas

---

### 4. Sistema de Notificações

**Integração**:
- Envio de código via SMS (Twilio)
- Envio de código via e-mail (Resend)

**Arquivo**: `server/notifications.ts`

**Funções**:
```typescript
// Enviar código de verificação
async function enviarCodigoVerificacao(params: {
  titularNome: string;
  telefone?: string;
  email?: string;
}): Promise<{
  success: boolean;
  canal: "sms" | "email";
  hashedCodigo: string;
  telefone?: string;
  email?: string;
  erro?: string;
}>;

// Comparar código hasheado
async function compararCodigo(
  codigo: string, 
  hashedCodigo: string
): Promise<boolean>;
```

---

## 🛠️ Manutenção e Troubleshooting

### Problemas Comuns

#### 1. "Código não está chegando"

**Possíveis Causas**:
- Twilio não configurado (SMS)
- Resend não configurado (e-mail)
- Telefone/e-mail incorreto no cadastro
- Delay na entrega

**Diagnóstico**:
```typescript
// Verificar logs de acesso LGPD
const logs = await storage.getLogsAcessoLgpd();
const falhas = logs.filter(l => !l.sucesso && l.acao === "solicitar_codigo");

// Verificar configuração
console.log("Twilio configurado:", !!process.env.TWILIO_ACCOUNT_SID);
console.log("Resend configurado:", !!process.env.RESEND_API_KEY);
```

**Solução**:
- Verificar variáveis de ambiente
- Verificar logs do servidor
- Testar manualmente com Postman/Insomnia

---

#### 2. "Código inválido" mesmo estando correto

**Possíveis Causas**:
- Código expirado (>10 minutos)
- Tentativas excedidas (>3)
- Hash corrompido

**Diagnóstico**:
```typescript
// Buscar token do titular
const token = await storage.buscarVerificationToken(codigo, titularId);

console.log("Token encontrado:", !!token);
console.log("Tentativas:", token?.tentativasValidacao);
console.log("Expirado:", token && new Date() > new Date(token.expiresAt));
```

**Solução**:
- Solicitar novo código
- Verificar clock do servidor (timezone)

---

#### 3. "Sessão expirada" imediatamente

**Possíveis Causas**:
- Session token não salvo corretamente
- Timezone do servidor incorreto
- Token revogado prematuramente

**Diagnóstico**:
```typescript
// Verificar session token
const token = await storage.buscarSessionToken(sessionToken);

console.log("Token validado:", token?.validado);
console.log("Session expira em:", token?.sessionExpiresAt);
console.log("Agora:", new Date());
```

**Solução**:
- Verificar timezone do servidor
- Aumentar tempo de expiração (30 min → 60 min)

---

#### 4. Solicitações não aparecem no painel admin

**Possíveis Causas**:
- Usuário não tem cargo PASTOR
- Solicitação não foi criada corretamente
- Frontend não está buscando dados

**Diagnóstico**:
```typescript
// Verificar cargo do usuário
console.log("Cargo:", req.user.cargo);

// Verificar solicitações no banco
const solicitacoes = await storage.getSolicitacoesLgpd();
console.log("Total solicitações:", solicitacoes.length);
```

**Solução**:
- Verificar autenticação e permissões
- Verificar console do navegador (erros)
- Verificar network tab (requisições falhadas)

---

### Limpeza de Dados

#### Limpar Tokens Expirados

```typescript
// Executar periodicamente (cron job)
async function limparTokensExpirados() {
  const agora = new Date();
  const tokens = await storage.getVerificationTokens();
  
  const expirados = tokens.filter(t => new Date(t.expiresAt) < agora);
  
  for (const token of expirados) {
    await storage.removerVerificationToken(token.id);
  }
  
  console.log(`${expirados.length} tokens expirados removidos`);
}

// Executar a cada 1 hora
setInterval(limparTokensExpirados, 60 * 60 * 1000);
```

---

#### Limpar Logs Antigos

```typescript
// Manter apenas logs dos últimos 12 meses
async function limparLogsAntigos() {
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  
  await storage.limparLogsAcessoLgpd(umAnoAtras);
  await storage.limparLogsAuditoria(umAnoAtras);
  
  console.log("Logs antigos removidos");
}

// Executar mensalmente
setInterval(limparLogsAntigos, 30 * 24 * 60 * 60 * 1000);
```

---

### Monitoramento

#### Métricas Importantes

1. **Taxa de Sucesso de Códigos**:
   - Proporção de códigos enviados com sucesso vs. falhados
   - Meta: >95%

2. **Taxa de Validação**:
   - Proporção de códigos validados vs. solicitados
   - Meta: >70%

3. **Tempo de Processamento**:
   - Tempo médio entre solicitação e aprovação/recusa
   - Meta: <3 dias

4. **Solicitações Pendentes**:
   - Número de solicitações aguardando análise
   - Meta: <5

---

### Checklist de Deploy

Antes de colocar em produção:

- [ ] Configurar variáveis de ambiente:
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_PHONE_NUMBER`
  - [ ] `RESEND_API_KEY`
  - [ ] `SESSION_SECRET`

- [ ] Testar fluxo completo:
  - [ ] Solicitar código (SMS)
  - [ ] Solicitar código (e-mail)
  - [ ] Validar código (correto)
  - [ ] Validar código (incorreto 3x)
  - [ ] Exportar dados
  - [ ] Solicitar exclusão
  - [ ] Aprovar solicitação (admin)
  - [ ] Recusar solicitação (admin)

- [ ] Verificar segurança:
  - [ ] Rate limiting funcionando
  - [ ] Session tokens expirando
  - [ ] Códigos hasheados no banco
  - [ ] Logs sendo registrados

- [ ] Configurar monitoramento:
  - [ ] Alertas para solicitações pendentes
  - [ ] Alertas para falhas de envio
  - [ ] Dashboard de métricas

- [ ] Documentar:
  - [ ] Processo para PASTOR revisar solicitações
  - [ ] SLA de atendimento (30 dias)
  - [ ] Contato para suporte

---

## 📚 Referências

- [Lei Geral de Proteção de Dados (LGPD)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia ANPD de Segurança da Informação](https://www.gov.br/anpd/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---

## 📝 Changelog

### v1.0.0 (11/11/2025)
- ✅ Portal LGPD público implementado
- ✅ Painel administrativo LGPD implementado
- ✅ Sistema de verificação 2FA (SMS/e-mail)
- ✅ Exportação de dados em JSON
- ✅ Solicitação de exclusão com aprovação
- ✅ Logs completos de auditoria
- ✅ Rate limiting para proteção

---

**Última Atualização**: 11 de novembro de 2025  
**Versão**: 1.0.0  
**Responsável**: Equipe de Desenvolvimento IPB Emaús
