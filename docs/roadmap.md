# Roadmap — spec pra revisão

Dois blocos de trabalho, independentes entre si. Ordem sugerida: **1 antes de 2**
(faz menos sentido portar o frontend inteiro e depois ter que mexer em auth/estado
por causa de multi-user).

Status atual da base: single-user (gate `OWNER_EMAIL`), sem `user_id` nas
tabelas. Frontend React + Vite + shadcn-ish (`components/ui/*`) + Tailwind +
react-router + TanStack Query. Mock via `axios-mock-adapter`. Testes: pytest
(backend) e vitest (frontend) recém-adicionados, cobrindo filtro/summary.

---

## 1. Multi-user com whitelist

### Objetivo
Deixar 2+ pessoas usarem o app, cada uma vendo só os próprios dados. Whitelist
por email (não é cadastro aberto).

### Não-objetivo
Cadastro self-service, papéis/permissões, times, compartilhamento entre usuários.

### Decisões
- **Whitelist:** env var `ALLOWED_EMAILS` (CSV). Mudar a lista = redeploy.
  (Alternativa descartada por agora: tabela no banco + endpoint admin.)
- **Migrations:** _a definir_ — `create_all` + recriar schema (app ainda não
  tem dado em prod) **ou** configurar Alembic agora. Recomendação: Alembic, já
  que a partir daqui as mudanças de schema ficam frequentes.

### Backend
- `User` (tabela): `id` UUID pk, `email` unique, `name`, `picture`,
  `created_at`.
- `Expense.user_id` / `Income.user_id`: FK → `User.id`, **NOT NULL**, indexado.
- `auth.py`:
  - login: verifica token Google → `email in ALLOWED_EMAILS`? → upsert `User`
    → sessão com `sub = user.id` (UUID estável, não o email).
  - `require_user` decodifica → devolve `user_id`. Re-checa `ALLOWED_EMAILS`
    a cada request (email vem de claim do JWT, sem hit no banco) — remover
    alguém da lista mata as sessões dela na hora.
- `expenses.py` / `income.py`: **todos** os handlers filtram por `user_id` —
  inclusive `GET/PUT/DELETE /{id}` (senão dá pra ler/editar linha alheia por
  id). Padrão: um helper de sessão que já aplica o `WHERE user_id`.
- `summary.py`: escopar `_by_category` e `_balance_before` por `user_id`.
- `POST` de expense/income: seta `user_id` a partir da dependency.

### Frontend
- Mínimo. `useAuth` já guarda o usuário. Talvez mostrar nome/foto de quem tá
  logado, botão de logout (já existe?).
- `mockApi.ts`: continua com 1 usuário mock — suficiente.

### Riscos / atenção
- **IDOR** é o ponto todo: qualquer handler que aceite um id e não filtre por
  `user_id` vaza dado. Os testes têm que cobrir "usuário A não vê/edita linha
  de B".
- `opening_balance` já faz full scan em `date < start`; com `user_id` vira
  `WHERE user_id = ? AND date < ?` — índice composto `(user_id, date)`.
- Sessões existentes quebram quando `sub` muda de email pra UUID — como o app
  não tem usuários reais ainda, tudo bem; num cenário com gente logada seria
  um logout forçado.

### Testes
- `usuário A cria expense` → `B não vê na listagem` → `B recebe 404 no
  GET/PUT/DELETE /{id}` → `summary de B ignora os dados de A`.
- login com email fora da whitelist → 403.
- remover email da whitelist → request seguinte com a sessão antiga → 401/403.

---

## 2. Port do frontend pra stack alvo

### Objetivo
Familiarização. Portar o app pra: **Ant Design (+ Nafto UI Kit)**, TanStack
Router, MSW, Zustand, Vitest + Testing Library, Playwright, Husky + lint-staged.
TanStack Query e ESLint/Prettier ficam.

### Bloqueio conhecido
**Nafto UI Kit é kit interno da Petrobras** — não tenho acesso. A parte de UI
que depende dele só você consegue fazer; eu consigo montar com **AntD puro** e
você troca os componentes pelos do Nafto depois.

### PRs separados, nesta ordem

| # | PR | O que | Risco |
|---|----|-------|-------|
| 2.1 | `chore: husky + lint-staged` | pre-commit roda eslint --fix + prettier no staged | baixo |
| 2.2 | `feat: TanStack Router` | troca react-router; rota tipada; move `month` pra search param tipada (`validateSearch`) — mata o prop drilling de `month`/`year` que a gente discutiu | médio (rota pequena, mas muda navegação) |
| 2.3 | `feat: MSW` | troca `axios-mock-adapter`; handlers reusáveis em dev + vitest + playwright | médio (~15 handlers) |
| 2.4 | `test: cobertura com MSW` | component tests de `TransactionRow`/`BudgetCard` com handlers MSW; expandir o que já existe | médio, open-ended |
| 2.5 | `feat: Ant Design` | `components/ui/*` + classes Tailwind → AntD. `BudgetCard` → `<Table>` com `sorter`; `TransactionFormDialog` → `<Form>` + `<Modal>`; tema zinc/emerald → `ConfigProvider` + `darkAlgorithm`. **maior PR** | alto |
| 2.6 | `feat: Nafto UI Kit` | você troca os componentes AntD pelos do Nafto | — (seu) |
| 2.7 | `feat: Zustand` | só o que sobrar de estado de cliente (draft de form? prefs?). Provável que seja pouco — o app quase não precisa | baixo |
| 2.8 | `test: e2e Playwright` | login (com sessão de teste mockada), adicionar transação, trocar mês, marcar pago | médio |

### Decisões
- **AntD + Tailwind:** manter Tailwind só pra layout (grid/flex/spacing) e usar
  AntD pros componentes? Ou ir 100% AntD (Space, Row/Col, tokens)? Recomendação:
  Tailwind pra layout, AntD pro resto — migração menos brusca.
- **TanStack Router:** commitar `routeTree.gen.ts` ou gitignorar? Recomendação:
  gitignorar, gerar no `predev`/`prebuild`.
- **Bundle:** AntD v5 é pesado e isso é PWA. Medir o `dist` antes/depois; se
  passar muito de ~250kb gzip, code-split por rota (que o TanStack Router
  facilita).
- **Playwright + OAuth:** e2e não vai fazer login real no Google. Opções: rota
  `/auth/dev-login` atrás de env (a que eu cheguei a esboçar e reverti), ou
  injetar cookie de sessão de teste direto. A primeira é mais realista.

### O que NÃO portar
- Backend fica FastAPI.
- A lógica de negócio (`summary`, filtros) já tá no lugar certo depois dos
  PRs de filtro/summary — o port é só camada de apresentação + tooling.

---

## 3. Features de produto (backlog)

### 3.1 Copiar despesas de um mês pro outro
Contas recorrentes (aluguel, assinaturas) se repetem. Botão "copiar despesas
de <mês anterior>" que clona pro mês atual.

- Backend: `POST /expenses/copy` com `{from: {month, year}, to: {month, year}}`
  → clona cada despesa do mês origem, data ajustada pro destino (mesmo dia,
  clampado em meses curtos), `paid=false`, ids novos. Devolve a lista criada.
- Decisões: copiar todas ou só as marcadas como recorrentes (precisaria de um
  flag `recurring` na despesa)? Pular se já existe despesa com mesma descrição
  no destino (dedupe)?
- **Sem mudança de schema** (a menos que entre o flag `recurring`). Fácil —
  1 endpoint + botão.

### 3.2 Destino do pagamento (conta própria ou não)
Distinguir se um `pagamento` (renda) cai numa conta sua — é renda de verdade,
afeta patrimônio — ou não (passa por você, não é seu).

- Schema: `Income.to_own_account: bool` (default `true`). **Primeira migration
  numa tabela que já tem dado.**
- `/summary`: `total_income` / `net_savings` / `opening_balance` /
  `accumulated_balance` passam a contar só `to_own_account = true` (ou expor
  as duas visões).
- Frontend: checkbox no form de renda.
- Médio — código simples, mas é a primeira migration + muda a semântica da
  matemática financeira.

### 3.3 Parcelas nas despesas
"R$ 1.200 em 12x".

- Schema: `Expense.installment_current: int | None`,
  `Expense.installment_total: int | None`,
  `Expense.installment_group: UUID | None` (linka as parcelas). **Migration.**
- Decisão central: **1 linha** ("1200, 12x") ou **N linhas** (100 cada, uma
  por mês)?
  - 1 linha: simples, mas R$ 1.200 bate num mês só — errado pro fluxo de
    caixa (você paga 100/mês).
  - N linhas linkadas por `installment_group`: certo pro orçamento mensal,
    mas precisa de operações de grupo (editar/excluir a série toda).
  - Recomendação: N linhas. Gera na criação, cada uma no mês+i, valor =
    total/N (a última pega o resto do arredondamento).
- Médio-alto — a abordagem certa (linhas linkadas) exige CRUD de série nos
  dois lados.

### Notas transversais
- **3.1 e 3.3 se sobrepõem**: parcela é despesa recorrente auto-gerada;
  "copiar mês a mês" é recorrência manual. Um conceito unificado de "despesa
  recorrente/agendada" cobriria os dois, mas é design maior. Por ora,
  separadas.
- **Pré-requisito de 3.2 e 3.3**: Alembic configurado (hoje é `create_all`
  só; coluna nova em tabela com dado precisa de migration de verdade). Ver
  bloco 1.
- `category` livre hoje aceita "Compras" (despesa) e "Poupança" (renda) que
  a tua planilha usa e o enum do frontend não tem — alinhar o enum quando
  fizer o TODO #5 do `backend/TODO.md`.

---

## Sequência geral sugerida

1. ~~PR de filtro/summary + testes~~ — mergeado (#2)
2. `3.1` copiar despesas — rápido, sem migration, dá pra fazer isolado
3. Bloco 1 (multi-user) + Alembic — desbloqueia `3.2` e `3.3`
4. `3.2` destino do pagamento, `3.3` parcelas
5. Bloco 2, PRs 2.1 → 2.8 na ordem da tabela
