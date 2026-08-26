# TODO — mover trabalho do frontend pro backend

Contexto: hoje `GET /expenses/` e `GET /income/` não têm nenhum filtro — o
frontend baixa a tabela inteira e faz filtro por mês, soma e agrupamento por
categoria em JS (`features/summary/transactions.ts`). Isso não escala e
duplica lógica que o Postgres faz melhor.

## 1. Filtro por mês/ano nos endpoints de listagem

- [ ] `GET /expenses/?month=8&year=2026` — filtrar com `WHERE` em vez de
      devolver a tabela inteira (mesmo padrão que `/summary/{month}/{year}`
      já usa).
- [ ] `GET /income/?month=8&year=2026` — idem.
- [ ] Deixar os params opcionais (sem eles, mantém o comportamento atual de
      listar tudo) pra não quebrar nada que já dependa da rota sem filtro.

## 2. Totais por categoria no `/summary`

- [ ] Adicionar `by_category` na resposta de `GET /summary/{month}/{year}`,
      com totais de despesa e receita agrupados (`GROUP BY category`).
- [ ] Formato sugerido:
      ```json
      {
        "total_expenses": 4910.5,
        "total_income": 7700,
        "net_savings": 2789.5,
        "expenses_by_category": { "contas": 2140, "cartao": 3090.5, "carro": 320 },
        "income_by_category": { "salario": 6500, "pagamento": 1200 }
      }
      ```
- [ ] Isso elimina a necessidade do `CategoryBalance` baixar a lista inteira
      de transações só pra somar por categoria.

## 3. Saldo inicial / saldo acumulado

- [ ] Adicionar `opening_balance` (saldo acumulado até o fim do mês anterior)
      e `accumulated_balance` (saldo acumulado até o fim deste mês) no
      `/summary/{month}/{year}`.
- [ ] Calcular via subquery/window function somando todas as transações
      anteriores ao mês — não dá pra fazer isso corretamente no frontend sem
      baixar o histórico inteiro toda vez.
- [ ] No frontend, isso substitui o placeholder hardcoded em `SummaryPage`
      (`const openingBalance = 0`).

## 4. Depois desses três, revisitar no frontend

- [ ] `features/summary/transactions.ts` (`toMonthlyTransactions`,
      `groupByCategory`) fica reduzido a formatação/tipagem — a filtragem e
      agregação passam a vir prontas da API.
- [ ] `BudgetCard`/`CategoryBalance` passam a receber os totais já prontos em
      vez de recalcular a partir da lista de transações.

## 5. Validar `category` como enum no banco

- [ ] Hoje `Expense.category`/`Income.category` são `str` livre — sem
      validação nenhuma no backend (só o TS do frontend restringe os
      valores). Trocar por `enum.Enum` do Python + coluna enum no Postgres,
      espelhando `ExpenseCategory`/`IncomeCategory` do frontend
      (`shared/types/transaction.ts`).
- [ ] O nome bonito (`getCategoryLabel` no frontend) continua sendo só de
      apresentação — não vira dado armazenado. Não criar tabela `categories`
      agora; é normalização prematura pra uma lista fixa e pequena.
- [ ] Revisitar isso **só** se categoria virar algo que o usuário pode criar
      (ex: categorias customizadas tipo "Pets"). Nesse caso sim compensa uma
      tabela normalizada em vez do enum fixo.

## Fora de escopo aqui

- Autenticação/autorização da API (necessário antes de expor publicamente,
  mas é assunto separado de concentração de dados).
- Paginação das listas — não é urgente na escala atual (uso pessoal), mas
  vale revisitar se o histórico crescer muito.
