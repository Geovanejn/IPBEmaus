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

### Backend (Mockado para demonstração visual)
- Node.js + Express
- TypeScript
- In-memory storage (MemStorage)
- Dados de exemplo em português do Brasil

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

### LGPD
- Consentimento explícito no cadastro
- Controle de acesso por cargo
- Logs de auditoria (preparado para implementação)
- Possibilidade de exportação e exclusão de dados

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
✅ Design profissional e moderno
✅ Totalmente em português do Brasil
⏳ Envio de e-mails via Resend (próxima fase)
⏳ Integração Power BI (próxima fase)
⏳ Storage em nuvem (Cloudflare R2 / Supabase) - opcional

## Mudanças Recentes (Nov 11, 2025)
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
1. Implementação de PostgreSQL para persistência
2. Upload de arquivos (fotos, comprovantes, PDFs)
3. Geração real de PDFs para boletins e atas
4. Sistema de notificações por e-mail
5. Exportação de dados para Power BI
6. Logs de auditoria completos
7. Sistema de backup e recuperação

## Observações Importantes
- Sistema desenvolvido especificamente para IPB Emaús
- Segue estrutura e terminologia da Igreja Presbiteriana do Brasil
- Preparado para conformidade com LGPD
- Arquitetura escalável para crescimento futuro
- Interface focada em usabilidade para público não-técnico
