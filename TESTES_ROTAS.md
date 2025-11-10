# 🧪 Guia de Testes - Sistema de Rotas Protegidas

## ✅ O Que Foi Corrigido

**Problema Anterior:** Usuários viam "página não encontrada" ao tentar acessar rotas sem permissão.

**Solução Implementada:** Sistema de rotas protegidas centralizado que redireciona automaticamente usuários para suas páginas padrão quando tentam acessar rotas não autorizadas.

---

## 🔍 Testes a Realizar

### Teste 1: Login como PASTOR
**Credenciais:** pastor@ipbemaus.org / 123456

**Comportamento Esperado:**
1. ✅ Após login, deve ser redirecionado para `/` (Dashboard)
2. ✅ Menu deve mostrar todas as opções: Dashboard, Pastoral, Financeiro, Diaconal, Boletim, Atas
3. ✅ Deve poder acessar todas as páginas normalmente

**Teste de Redirecionamento:**
- Tente digitar uma rota inválida na URL (ex: `/teste`)
- ✅ Deve ver a página "404 - Página não encontrada" (comportamento correto para rotas inexistentes)

---

### Teste 2: Login como PRESBÍTERO
**Credenciais:** presbitero@ipbemaus.org / 123456

**Comportamento Esperado:**
1. ✅ Após login, deve ser redirecionado para `/pastoral` (página padrão)
2. ✅ Menu deve mostrar: Pastoral, Boletim, Atas
3. ✅ Deve poder acessar: /pastoral, /boletim, /atas

**Teste de Proteção de Rotas:**
- Digite manualmente na URL: `/` (Dashboard)
  - ✅ Deve ser redirecionado automaticamente para `/pastoral`
- Digite manualmente na URL: `/financeiro`
  - ✅ Deve ser redirecionado automaticamente para `/pastoral`
- Digite manualmente na URL: `/diaconal`
  - ✅ Deve ser redirecionado automaticamente para `/pastoral`

---

### Teste 3: Login como TESOUREIRO
**Credenciais:** tesoureiro@ipbemaus.org / 123456

**Comportamento Esperado:**
1. ✅ Após login, deve ser redirecionado para `/financeiro` (página padrão)
2. ✅ Menu NÃO deve aparecer (apenas 1 página disponível)
3. ✅ Deve poder acessar apenas: /financeiro

**Teste de Proteção de Rotas:**
- Digite manualmente na URL: `/` (Dashboard)
  - ✅ Deve ser redirecionado automaticamente para `/financeiro`
- Digite manualmente na URL: `/pastoral`
  - ✅ Deve ser redirecionado automaticamente para `/financeiro`
- Digite manualmente na URL: `/diaconal`
  - ✅ Deve ser redirecionado automaticamente para `/financeiro`
- Digite manualmente na URL: `/boletim`
  - ✅ Deve ser redirecionado automaticamente para `/financeiro`
- Digite manualmente na URL: `/atas`
  - ✅ Deve ser redirecionado automaticamente para `/financeiro`

---

### Teste 4: Login como DIÁCONO
**Credenciais:** diacono@ipbemaus.org / 123456

**Comportamento Esperado:**
1. ✅ Após login, deve ser redirecionado para `/diaconal` (página padrão)
2. ✅ Menu NÃO deve aparecer (apenas 1 página disponível)
3. ✅ Deve poder acessar apenas: /diaconal

**Teste de Proteção de Rotas:**
- Digite manualmente na URL: `/` (Dashboard)
  - ✅ Deve ser redirecionado automaticamente para `/diaconal`
- Digite manualmente na URL: `/pastoral`
  - ✅ Deve ser redirecionado automaticamente para `/diaconal`
- Digite manualmente na URL: `/financeiro`
  - ✅ Deve ser redirecionado automaticamente para `/diaconal`
- Digite manualmente na URL: `/boletim`
  - ✅ Deve ser redirecionado automaticamente para `/diaconal`
- Digite manualmente na URL: `/atas`
  - ✅ Deve ser redirecionado automaticamente para `/diaconal`

---

### Teste 5: Redirecionamento de /login para Usuários Autenticados (NOVA CORREÇÃO)

**Problema Corrigido:** Usuários autenticados que acessavam `/login` viam "Página Não Encontrada" (404).

**Comportamento Atual:**
Quando um usuário **já está autenticado** e tenta acessar `/login`:
- ✅ É automaticamente redirecionado para sua página padrão
- ✅ NÃO vê página 404

**Como Testar:**
1. Faça login com qualquer usuário (ex: `diacono@ipbemaus.org` / `123456`)
2. Após o login, você será levado para `/diaconal` (página padrão do Diácono)
3. Agora digite manualmente na URL: `/login`
4. ✅ Você deve ser **redirecionado automaticamente de volta para `/diaconal`**
5. ✅ Você NÃO deve ver a página "Página Não Encontrada"

**Teste para Todos os Cargos:**

| Cargo | Se acessar /login após autenticado | Será redirecionado para |
|-------|-----------------------------------|------------------------|
| PASTOR | `/login` | `/` (Dashboard) |
| PRESBITERO | `/login` | `/pastoral` |
| TESOUREIRO | `/login` | `/financeiro` |
| DIACONO | `/login` | `/diaconal` |

**Observação Importante:**
- Se você **não está autenticado**, acessar `/login` funciona normalmente (mostra a tela de login)
- Esta correção só afeta usuários **já autenticados** que tentam voltar para `/login`

---

## 🎯 Resultados Esperados Resumidos

| Cargo | Rota Padrão | Páginas Permitidas | Menu Visível |
|-------|-------------|-------------------|--------------|
| PASTOR | `/` | Todas | ✅ Sim (6 opções) |
| PRESBITERO | `/pastoral` | Pastoral, Boletim, Atas | ✅ Sim (3 opções) |
| TESOUREIRO | `/financeiro` | Apenas Financeiro | ❌ Não |
| DIACONO | `/diaconal` | Apenas Diaconal | ❌ Não |

---

## ⚠️ Comportamentos Importantes

1. **Rotas Inexistentes:** URLs que não existem no sistema (ex: `/teste`) devem mostrar a página 404, NÃO redirecionar.

2. **Rotas Não Autorizadas:** URLs que existem mas o usuário não tem permissão devem REDIRECIONAR automaticamente para a página padrão do cargo.

3. **Rota /login para Usuários Autenticados:** Usuários já autenticados que tentam acessar `/login` são REDIRECIONADOS para sua página padrão (não veem 404).

3. **Menu Condicional:** O menu dropdown só aparece quando o usuário tem acesso a mais de uma página.

4. **Logout:** Ao fazer logout, todos os usuários devem ser redirecionados para `/login`.

---

## 🔧 Arquitetura Implementada

### Configuração Centralizada (ROUTES)
```typescript
const ROUTES = [
  { path: "/", component: Dashboard, allowedCargos: ["PASTOR"] },
  { path: "/pastoral", component: Pastoral, allowedCargos: ["PASTOR", "PRESBITERO"] },
  { path: "/financeiro", component: Financeiro, allowedCargos: ["PASTOR", "TESOUREIRO"] },
  { path: "/diaconal", component: Diaconal, allowedCargos: ["PASTOR", "DIACONO"] },
  { path: "/boletim", component: BoletimDominical, allowedCargos: ["PASTOR", "PRESBITERO"] },
  { path: "/atas", component: SecretariaAtas, allowedCargos: ["PASTOR", "PRESBITERO"] },
];
```

### Componente ProtectedRoute
- Verifica se usuário está autenticado
- Verifica se cargo está na lista de cargos permitidos
- Redireciona para `getRotaPadrão()` se não autorizado

### Alinhamento com getRotaPadrão()
A função `getRotaPadrão()` no AuthContext retorna exatamente uma das rotas permitidas em ROUTES para cada cargo, garantindo que não haja loops de redirecionamento.

---

## ✅ Status

- ✅ Implementação concluída
- ✅ Revisão do Architect aprovada
- ⏳ Testes manuais pendentes (realizar conforme este guia)
