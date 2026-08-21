import { BudgetCard } from "../features/summary/BudgetCard";

export function SummaryPage() {
    return (<div className="flex">
        <div className="flex gap-4 header">
            <BudgetCard
                transaction={{
                    type: "income",
                    id: "1",
                    description: "Salário",
                    account: "Nubank",
                    category: "salario",
                    amount: 2000,
                    date: new Date().toISOString(),
                }}
            />
            <BudgetCard
                transaction={{
                    type: "expense",
                    id: "2",
                    description: "Cartão",
                    category: "cartao",
                    amount: 1500,
                    date: new Date().toISOString(),
                }}
            />
        </div>
        </div>)
}