# Arquitetura do Frontend — Spendly

## Stack

- React 19 + TypeScript
- Vite
- TanStack Query — estado de servidor (fetch/cache de dados da API)
- Zustand — estado de UI/cliente (filtros, sessão, tema)
- Axios — cliente HTTP
- Tailwind CSS — estilização
- Recharts — gráficos
- React Router — roteamento (a instalar)

## Estrutura de pastas

```
src/
  app/                    # bootstrap: main.tsx, App.tsx, providers (QueryClient, Router)
  routes/                 # páginas — compõem features + layout, alvo do router
    DashboardPage.tsx
    TransactionsPage.tsx
    BudgetsPage.tsx
    router.tsx
  features/
    transactions/
      components/         # peças de UI do domínio (ex: TransactionCard)
      hooks/               # hooks de dados (ex: useTransactions.ts, react-query)
      api.ts               # chamadas axios desse domínio
      types.ts
      store.ts             # zustand slice, se necessário
    budgets/
    dashboard/
    auth/
  shared/
    components/           # componentes genéricos (Button, Input, Layout)
    hooks/
    lib/                  # axios instance, formatters, utils
    types/
```

## Regras

- **Estado de servidor** (dados vindos da API) sempre via TanStack Query, nunca `useState` + `useEffect` manual.
- **Estado de cliente** (UI, filtros, sessão) via Zustand, isolado por feature em `store.ts`.
- **Chamadas HTTP** ficam centralizadas em `api.ts` de cada feature — componentes não chamam `axios` diretamente.
- **`features/*/components`** = reutilizáveis, lógica de domínio.
- **`routes/*Page.tsx`** = tela inteira, monta múltiplas features + layout; é o que o router renderiza.
- Um `shared/lib/axios.ts` central com `baseURL` via `VITE_API_URL` e interceptors de erro num único lugar.
- Nome de componente sempre em PascalCase; `export function Nome(props)` em vez de arrow function.

## Pendências

- Instalar `react-router` (ainda não está no `package.json`).
- Criar `shared/lib/axios.ts` com `baseURL` apontando para o backend (`http://localhost:8000` / `VITE_API_URL`).
