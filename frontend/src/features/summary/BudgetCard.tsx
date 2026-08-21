import { Card } from "@/components/ui/card";
import type { Transaction } from "@/shared/types/transaction";

interface BudgetCardProps {
  transaction: Transaction;
}

export function BudgetCard({ transaction }: BudgetCardProps) {
  return (
    <Card>
      <div className="header flex items-center p-4 gap-2">
        <p className="text-sm">{transaction.description}</p>
        <p className="text-sm">{transaction.amount}</p>
      </div>
      {transaction.type === "expense" && (
        <p className="text-xs text-muted-foreground px-4 pb-4">{transaction.category}</p>
      )}
      {transaction.type === "income" && (
        <p className="text-xs text-muted-foreground px-4 pb-4">
          {transaction.account} · {transaction.category}
        </p>
      )}
    </Card>
  );
}