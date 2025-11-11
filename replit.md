# Sistema Integrado IPB Emaús

## Visão Geral
Plataforma integrada de gestão eclesiástica para a Igreja Presbiteriana do Brasil (IPB) Emaús, centralizando todas as áreas administrativas e ministeriais em um único sistema.

## Módulos Principais

### 1. Módulo Pastoral
- Gestão completa de membros e famílias
- Cadastro e acompanhamento de visitantes
- Notas pastorais com controle de sigilo
- Relatórios de aniversariantes e presença
- Vínculo entre visitantes e membros que os convidaram

### 2. Módulo Financeiro
- Lançamento de dízimos e ofertas
- Registro de despesas por centro de custo
- Relatórios financeiros consolidados
- Geração de recibos em PDF
- Controle por método de pagamento (dinheiro, PIX, transferência, cartão)

### 3. Módulo Diaconal
- Registro de ações sociais (cestas básicas, visitas, orações, ajuda financeira)
- Acompanhamento de visitantes
- Histórico completo de ações realizadas
- Integração automática com Módulo Financeiro para despesas sociais

### 4. Módulo Boletim Dominical
- Editor completo para criação de boletins semanais
- Importação automática de aniversariantes do Módulo Pastoral
- Inclusão automática de visitantes recentes
- Geração de PDF com QR Code
- Gestão de eventos, pedidos de oração e avisos

### 5. Módulo Secretaria de Atas
- Agendamento de reuniões (Conselho, Congregação, Diretoria)
- Criação e edição de atas
- Sistema de aprovação e bloqueio de atas
- Exportação em PDF/A para arquivo permanente
- Registro de participantes e deliberações

### 6. Módulo Relatórios e Análises
- Relatórios pastorais: estatísticas de membros, visitantes e aniversariantes
- Relatórios financeiros: receitas, despesas, saldo e análises por categoria e centro de custo
- Relatórios diaconais: ações realizadas, beneficiários atendidos e valores investidos
- Filtros por período personalizável
- Visualizações com cards de resumo e gráficos informativos
- Exportação de dados em formato CSV para análise externa
- Acesso baseado em permissões (cada cargo vê relatórios de seus módulos)

## Autenticação e Permissões

### Cargos
O sistema possui 4 cargos com permissões específicas:

1. **PASTOR**
   - Acesso total a todos os módulos
   - Criação e edição de registros pastorais
   - Aprovação de atas

2. **PRESBÍTERO**
   - Acesso total: Pastoral, Atas, Boletins
   - Leitura: Financeiro

3. **TESOUREIRO**
   - Acesso total: Financeiro
   - Leitura: Diaconal, Pastoral

4. **DIÁCONO**
   - Acesso total: Diaconal
   - Leitura: Boletins

## Tecnologias Utilizadas

### Frontend
- React + Vite
- TypeScript
- TailwindCSS
- Shadcn UI (componentes)
- Wouter (roteamento)
- React Query (gerenciamento de estado)
- React Hook Form (formulários)
- Lucide React (ícones)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL com Drizzle ORM
- Bcryptjs (hash de senhas)
- PDFKit (geração de PDFs)
- Twilio (envio de SMS - configuração opcional)
- Resend (envio de emails - configuração opcional)

### Design System
- Fonte primária: Inter
- Fonte mono: JetBrains Mono
- Esquema de cores: Azul profissional (#2563eb)
- Modo claro/escuro configurado
- Componentes Shadcn customizados

## Estrutura de Dados

### Membros
- Informações pessoais completas
- Dados de contato
- Histórico eclesiástico (batismo, profissão de fé)
- Vínculo familiar
- Status (ativo, inativo, transferido)
- Consentimento LGPD

### Visitantes
- Dados de contato
- Como conheceu a igreja
- Membro que convidou
- Status de acompanhamento
- Data de visita

### Transações Financeiras
- Tipo (receita/despesa)
- Categoria
- Valor em centavos
- Centro de custo
- Método de pagamento
- Comprovante

### Ações Diaconais
- Tipo de ação
- Beneficiário
- Valor gasto (opcional)
- Observações
- Responsável

### Boletins
- Data do culto
- Versículo da semana
- Devocional
- Eventos
- Pedidos de oração
- Avisos
- Status de publicação

### Atas
- Tipo de reunião
- Data e hora
- Local
- Participantes
- Conteúdo
- Status de aprovação
- Bloqueio após aprovação

## Características Especiais

### LGPD (Conformidade com Lei Geral de Proteção de Dados)
- Portal público para membros e visitantes exercerem seus direitos
- Membros podem acessar com: nome completo, data nascimento, RG, telefone, e-mail
- Visitantes podem acessar com: nome completo, data visita, telefone
- Verificação por código SMS (Twilio) ou e-mail
- Exportação de dados pessoais em formato JSON
- Exclusão de dados pessoais (anonimização) mantendo registros financeiros
- Logs de auditoria de todas as ações LGPD

### Integração entre Módulos
- **Pastoral → Boletim**: Aniversariantes e visitantes automáticos
- **Diaconal → Financeiro**: Despesas sociais automáticas
- **Todos → Power BI**: Exportação CSV/JSON preparada

### Interface 100% em Português
- Todos os textos, mensagens e labels em pt-BR
- Formatação de datas, moedas e números no padrão brasileiro
- Nomenclatura adequada ao contexto eclesiástico IPB

## Como Usar

### Login
1. Acesse a tela de login
2. Escolha o cargo (Pastor, Presbítero, Tesoureiro ou Diácono)
3. Entre com e-mail e senha
4. O sistema mostrará apenas os módulos acessíveis ao cargo

### Navegação
- Sidebar esquerda com todos os módulos disponíveis
- Indicador visual de permissões (🔒 para leitura apenas)
- Dashboard personalizado por cargo
- Ações rápidas contextuais

### Funcionalidades Principais
- **Cadastros**: Formulários completos com validação
- **Listagens**: Busca, filtros e ordenação
- **Relatórios**: Visualização e exportação
- **PDFs**: Geração de documentos oficiais
- **Responsividade**: Funciona em desktop, tablet e mobile

## Estado Atual
✅ Interface visual completa de todos os 6 módulos
✅ Sistema de autenticação por cargo
✅ Controle de permissões implementado com navegação baseada em papel
✅ PostgreSQL configurado com Drizzle ORM
✅ Seis módulos 100% funcionais: Pastoral, Financeiro, Diaconal, Boletim, Atas, Relatórios
✅ Sistema completo de geração de PDFs (backend + frontend)
✅ Upload de arquivos (fotos, comprovantes) implementado
✅ Sistema de relatórios com filtros e exportação CSV
✅ **Portal LGPD Público** totalmente funcional (backend + frontend)
✅ Design profissional e moderno
✅ Totalmente em português do Brasil
⏳ Painel administrativo LGPD para gestão de solicitações
⏳ Envio de e-mails via Resend (código implementado, precisa configurar chave API)
⏳ Envio de SMS via Twilio (código implementado, precisa configurar credenciais)
⏳ Integração Power BI (próxima fase)
⏳ Storage em nuvem (Cloudflare R2 / Supabase) - opcional

## Mudanças Recentes (Nov 11, 2025)

### Sistema LGPD ✅ (Implementado)
✅ **Portal LGPD Público** (`/portal-lgpd` - sem autenticação):
  - Interface completa para membros e visitantes exercerem seus direitos LGPD
  - **Verificação de Identidade**: nome completo, CPF, data de nascimento
  - Envio de código de 6 dígitos por SMS (Twilio) com fallback automático para e-mail (Resend)
  - Validação de código com limite de 3 tentativas e expiração de 10 minutos
  - Session token de uso único com expiração de 30 minutos após validação
  - **Exportação de dados**: Baixar cópia completa em JSON de todos os dados pessoais
  - **Solicitação de exclusão**: Criar solicitação de exclusão com motivo opcional
  - Logs de auditoria completos (acesso, validação, exportação, exclusão)
  - Rate limiting para proteção contra abuso (3 códigos/hora, 5 validações/hora)
  - Respostas genéricas para evitar enumeração de usuários
  - Design responsivo e moderno com feedback visual completo

✅ **Backend LGPD** (API Routes implementadas):
  - `POST /api/lgpd/solicitar-codigo`: Valida identidade e envia código de verificação
  - `POST /api/lgpd/validar-codigo`: Valida código e retorna session token
  - `GET /api/lgpd/exportar-dados`: Exporta dados do titular autenticado
  - `POST /api/lgpd/solicitar-exclusao`: Cria solicitação de exclusão de dados
  - Middleware de autenticação por session token
  - Logs detalhados de todas as operações LGPD
  - Proteção contra ataques de força bruta

✅ **Tabelas do Banco de Dados LGPD**:
  - `verification_tokens`: Códigos de verificação com hash bcrypt
  - `lgpd_access_logs`: Logs de acesso ao portal LGPD
  - `solicitacoes_lgpd`: Solicitações de exportação/exclusão de dados
  - `logs_consentimento`: Histórico de consentimentos LGPD

⏳ **Painel Administrativo LGPD** (Próxima fase):
  - Gerenciamento de solicitações de exclusão
  - Visualização de logs de acesso
  - Aprovação/recusa de solicitações
  - Relatórios de conformidade LGPD

### Relatórios e Melhorias Anteriores
✅ **Correção Crítica - Geração de Relatórios**: Corrigido bug onde clicar em "Gerar Relatórios" não funcionava
  - Adicionadas tipagens TypeScript completas para RelatorioPastoral, RelatorioFinanceiro e RelatorioDiaconal
  - Implementado queryFn customizado para passar parâmetros dataInicio/dataFim corretamente
  - Sistema agora carrega relatórios com dados do período selecionado
✅ **Módulo de Relatórios Completo**: Sistema completo de relatórios pastorais, financeiros e diaconais com filtros por período
✅ **Exportação de Dados**: Exportação em CSV com codificação UTF-8 para todos os tipos de relatórios
✅ **Visualizações Detalhadas**: Cards de resumo, estatísticas agregadas e análises por categoria/centro de custo
✅ **Correção do Boletim**: Campos opcionais agora são corretamente limpos antes do salvamento
✅ **Permissões de Acesso**: Todos os cargos podem acessar relatórios de seus módulos permitidos

## Mudanças Anteriores (Nov 10, 2025)
✅ **Interface de Geração de PDFs Completa**: Implementados botões "Gerar PDF" e "Baixar PDF" nos módulos Boletim e Atas com estados de loading e toasts de feedback
✅ **Sistema de Upload de Arquivos**: Upload de fotos de membros e comprovantes financeiros implementado com validação de tipos e preview
✅ **Correção Crítica de Navegação**: Usuários Tesoureiro e Diácono agora redirecionam corretamente para suas rotas padrão
✅ **Alinhamento de Rotas Backend/Frontend**: Rotas do módulo financeiro padronizadas como `/api/transacoes-financeiras`
✅ **Documentação Completa**: `ESTADO_IMPLEMENTACAO.md` atualizado com todas as funcionalidades (~90% implementado)

## Próximos Passos

### Prioridade Alta
1. ⏳ Criar painel administrativo LGPD para gestão de solicitações de exclusão
2. ⏳ Configurar credenciais Twilio para envio de SMS (opcional)
3. ⏳ Configurar RESEND_API_KEY para envio de emails

### Prioridade Média
4. ⏳ Exportação de dados para Power BI
5. ⏳ Sistema de backup automático do banco de dados
6. ⏳ Storage em nuvem para arquivos (Cloudflare R2 ou Supabase)

### Prioridade Baixa
7. ⏳ Notificações por e-mail (aniversários, reuniões)
8. ⏳ Dashboard com métricas em tempo real
9. ⏳ App mobile (React Native ou PWA)

## Observações Importantes
- Sistema desenvolvido especificamente para IPB Emaús
- Segue estrutura e terminologia da Igreja Presbiteriana do Brasil
- Preparado para conformidade com LGPD
- Arquitetura escalável para crescimento futuro
- Interface focada em usabilidade para público não-técnico
