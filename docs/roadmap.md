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

## 3. Features de produto

**PRs A, B e C implementados** na branch `feat/recurring-thirdparty-expenses`
(um PR só, 4 commits). Falta: revisar, mergear, e o deploy que precisa
stampar/recriar o schema em prod pro Alembic (tabelas vazias → `alembic upgrade
head` limpo).

Diferido: editar série inteira de uma vez (edição inline continua linha-a-linha)
· materialização lazy de verdade além da janela de 60 meses · alinhar o enum de
`category` (TODO #5).

### PR A — Alembic + tirar `account` de Income
- `alembic init`, env apontando pro `DATABASE_URL`, migration baseline = schema
  atual.
- **Tira `Income.account` / `IncomeCreate.account`** — o usuário não rastreia
  em qual conta a renda cai; o campo é write-only (nunca exibido). Migration
  dropa a coluna (SQLite via batch mode; tabela vazia, trivial).
- Frontend: tira `account` do type `Income` e o input "Conta" do
  `TransactionFormDialog` (só aparecia pra renda) + o `isValid` que o exigia.
- Pequeno, sem risco, destrava o resto.

### PR B — Despesa de terceiro (era 3.2)
"Compra num cartão meu que **não é minha**" (rachado com alguém, cartão
adicional). Não é transferência interna.

- Schema: `Expense.third_party: bool` (default `false`).
- `/summary` (opção B escolhida): `total_expenses` mostra **tudo** (você
  precisa saber a fatura inteira); novo `third_party_expenses` como sub-total;
  `net_savings = total_income − (total_expenses − third_party_expenses)` — só
  as **suas** despesas contam contra a economia. `opening_balance` idem.
- Frontend: checkbox no form de despesa + exibir o sub-total no BalanceCard.
- Médio.

### PR C — Despesas recorrentes / parceladas (era 3.1 + 3.3, unificadas)
Na criação da despesa: "repetir por [N] meses" **ou** "indefinido". O app
materializa as linhas mensais.

- Schema em `Expense`:
  - `series_id: UUID | None` — igual em todas as linhas da série
  - `series_index: int | None` — 1, 2, 3… (mostra "3/20")
  - `series_total: int | None` — N; **`None` = indefinido**
- **Valor é o da parcela** que o usuário digita (sem dividir total
  automático). "Carro R$880 x 20" → 20 linhas de R$880.
- `paid` é por linha (marca conforme paga).
- **Fim definido (N):** gera as N linhas na criação, mês base + 0..N-1.
- **Indefinido:** gera janela rolante de ~24 meses; quando o usuário abre um
  mês além da janela, o `GET /expenses/?month=&year=` materializa as linhas
  faltantes das séries ativas naquele mês (lazy top-up). Alternativa se
  complicar: entidade `Recurrence` separada + materialização — mais limpo
  conceitualmente, mas todo path de leitura vira recurrence-aware.
- Editar/excluir linha de série: **"só esta / esta e as futuras / série
  toda"** (igual evento recorrente do Google Agenda). Endpoints tipo
  `PATCH /expenses/{id}?scope=this|future|all`.
- Substitui o "copiar mês a mês" original — configura recorrente uma vez.
- Maior das três.

### Notas transversais
- `category` livre hoje aceita "Compras" (despesa) e "Poupança" (renda) que
  a planilha do usuário usa e o enum do frontend não tem — alinhar o enum no
  TODO #5 do `backend/TODO.md`. Bom fazer junto com PR B (mesma tabela).
- Multi-user (bloco 1) e essas features todas mexem em schema — se for fazer
  os dois, Alembic uma vez só serve pra ambos.

---

## Sequência geral sugerida

1. ~~PR filtro/summary + testes~~ — mergeado (#2)
2. ~~PR prod hardening~~ — mergeado (#3)
3. **PRs A+B+C** — `feat/recurring-thirdparty-expenses`, aguardando review/merge/deploy
4. Enum de `category` (TODO #5) + editar série inteira
5. Bloco 1 (multi-user) — Alembic já pronto
6. Bloco 2, PRs 2.1 → 2.8
