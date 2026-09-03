# TODO — mover trabalho do frontend pro backend

Contexto: hoje `GET /expenses/` e `GET /income/` não têm nenhum filtro — o
frontend baixa a tabela inteira e faz filtro por mês, soma e agrupamento por
categoria em JS (`features/summary/transactions.ts`). Isso não escala e
duplica lógica que o Postgres faz melhor.

## Status do frontend hoje (2026-09-02)

Nada mudou no padrão desde que este doc foi escrito — o frontend continua
baixando tudo e agregando no cliente:

- `SummaryPage.tsx` dispara `useQuery(['expenses'])` / `useQuery(['income'])`
  **sem params** (`listExpenses`/`listIncome` batem em `/expenses/` e
  `/income/` puro) e filtra o mês com `toMonthlyTransactions(items, type,
  month, YEAR)`.
- `YEAR` está hardcoded em `2026` (`SummaryPage.tsx:11`); `month` já default
  pro mês atual (`SummaryPage.tsx:16`). A aba "Ano" é um stub vazio.
- `getSummary(month, year)` já bate em `/summary/{month}/{year}`; a interface
  `Summary` (`features/summary/api.ts`) só tem `total_expenses`,
  `total_income`, `net_savings`.
- Auth já existe (não confundir com a seção "Fora de escopo" abaixo):
  `require_user` em todos os routers, login Google owner-only.

## 1. Filtro por mês/ano nos endpoints de listagem

- [x] `GET /expenses/?month=8&year=2026` — filtra com `WHERE date >= start
      AND date < end` (range semiaberto, index-friendly), não `func.extract`.
- [x] `GET /income/?month=8&year=2026` — idem.
- [x] Params opcionais: sem eles, lista tudo (comportamento antigo). `month`
      ou `year` sozinho → 422. `month` fora de 1..12 → 422.
- [x] `month`/`year` → par de datas em `app/queries.py` (`month_bounds`);
      parse + validação numa dependency `period` (`app/deps.py`) reusável.
- [x] De brinde: `order_by(date)` nas duas listagens (antes vinham sem ordem).
- [x] Frontend: `listExpenses(month, year)`/`listIncome(month, year)` mandam
      os params; `queryKey` agora é `['expenses', month, year]` via key
      factory em `features/summary/keys.ts` (`expenseKeys`/`incomeKeys`).
      `month`/`year` descem por prop `SummaryPage → BudgetCard →
      TransactionRow` (2 hops, os dois consumidores usam o valor pra montar a
      key nos optimistic updates). `toMonthlyTransactions` virou `withType`
      (só o `.map`). `placeholderData: keepPreviousData` pra não piscar
      skeleton ao trocar de mês. Mock (`mockApi.ts`) também filtra por
      `config.params` pra manter paridade.

## 2. Totais por categoria no `/summary`

- [x] `GET /summary/{month}/{year}` devolve `expenses_by_category` e
      `income_by_category` (`GROUP BY category` no range do mês). Helper
      `_by_category` em `summary.py`. `total_expenses`/`total_income` agora
      derivam da soma dos grupos (menos uma query).
- [x] Response model `Summary` em `models.py` (antes era dict solto); o
      endpoint aparece tipado no `/docs`.
- [x] `Summary` do frontend (`features/summary/api.ts`) estendida com os
      campos novos; mock (`mockApi.ts`) devolve o mesmo shape.
- [x] Frontend: `CategoryBalance` recebe `byCategory: Record<string, number>`
      (ordena e soma o total a partir dele); `groupByCategory` saiu de
      `transactions.ts`. `SummaryPage` passa `summary.expenses_by_category` /
      `summary.income_by_category`.

Formato da resposta agora:
```json
{
  "total_expenses": 1200.0,
  "total_income": 6500.0,
  "net_savings": 5300.0,
  "expenses_by_category": { "carro": 300.0, "cartao": 900.0 },
  "income_by_category": { "salario": 6500.0 },
  "opening_balance": 2500.0,
  "accumulated_balance": 7800.0
}
```

## 3. Saldo inicial / saldo acumulado

- [x] `/summary/{month}/{year}` devolve `opening_balance` (income − expenses de
      tudo com `date < primeiro dia do mês`) e `accumulated_balance`
      (`opening_balance + net_savings` do mês). Helper `_balance_before`.
- [x] `month`/`year` do path agora validados (`Path(ge=1, le=12)` /
      `Path(ge=2000)`) — antes `month=13` passava batido; agora 422.
- [x] `summary.py` refatorado pra usar `month_bounds` (range semiaberto),
      não `func.extract` — mesma regra de "o que é esse mês" que o item 1.
- [x] Frontend: `SummaryPage.tsx` usa `summary.opening_balance` /
      `summary.accumulated_balance` direto; `BalanceCard` já renderizava os
      dois via prop, agora com dado real em vez de `0`.
- [ ] `opening_balance` faz full scan em `date < start`. Sem índice em
      `date` hoje. Revisitar se o histórico crescer (junto com paginação).

## 4. Depois desses três, revisitar no frontend — FEITO

- [x] `features/summary/transactions.ts` reduzido a `withType` + `sumAmount`.
      `toMonthlyTransactions` e `groupByCategory` saíram (filtragem e
      agregação vêm prontas da API / mock).
- [x] `CategoryBalance` recebe `byCategory` pronto. `BudgetCard` continua com
      a lista de transações (precisa dela pra renderizar linhas, ordenar e
      fazer o optimistic update do "marcar tudo pago") — o `sumAmount` que
      sobrou ali é só o total do card, barato.

## 5. Validar `category` como enum no banco

- [ ] Hoje `Expense.category`/`Income.category` são `str` livre — sem
      validação nenhuma no backend (só o TS do frontend restringe os
      valores). Trocar por `enum.Enum` do Python + coluna enum no Postgres,
      espelhando `ExpenseCategory`/`IncomeCategory` do frontend
      (`shared/types/transaction.ts`): `carro | contas | cartao` e
      `pagamento | salario | venda`.
- [ ] O nome bonito (`getCategoryLabel` em `shared/config/categories.ts`)
      continua sendo só de apresentação — não vira dado armazenado. Não criar
      tabela `categories` agora; é normalização prematura pra uma lista fixa
      e pequena.
- [ ] Revisitar isso **só** se categoria virar algo que o usuário pode criar
      (ex: categorias customizadas tipo "Pets"). Nesse caso sim compensa uma
      tabela normalizada em vez do enum fixo.

## Fora de escopo aqui

- Hardening da API pra exposição pública (rate limiting, trocar o
  `SESSION_SECRET` default `dev-secret-change-me`, cookie `Secure` sempre em
  prod). O login em si já está feito — isso é camada separada de
  concentração de dados.
- Paginação das listas — não é urgente na escala atual (uso pessoal), mas
  vale revisitar se o histórico crescer muito.
