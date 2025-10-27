import { FormEvent, useState } from "react";
import { Search, X } from "lucide-react";

import Card from "../../components/ui/Card";

const EXPENSES = [
  {
    id: "EXP-001",
    description: "Produtos de limpeza",
    category: "Suprimentos",
    date: "10/10/2025",
    amount: "R$ 320,50",
  },
  {
    id: "EXP-002",
    description: "Manutenção ar-condicionado",
    category: "Manutenção",
    date: "12/10/2025",
    amount: "R$ 540,00",
  },
];

function FinancialExpensesPage() {
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    description: "",
    category: "",
    date: "",
    amount: "",
  });

  const selectedExpense = selectedExpenseId
    ? EXPENSES.find((expense) => expense.id === selectedExpenseId) ?? null
    : null;

  const closeModal = () => {
    setSelectedExpenseId(null);
    setFormValues({
      description: "",
      category: "",
      date: "",
      amount: "",
    });
  };

  const openModal = (expense: (typeof EXPENSES)[number]) => {
    setSelectedExpenseId(expense.id);
    setFormValues({
      description: expense.description,
      category: expense.category,
      date: expense.date,
      amount: expense.amount.replace(/[^\d,]/g, ""),
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Integração futura: atualizar despesa no backend.
    closeModal();
  };

  return (
    <div className="space-y-6">
      <Card
        title="Controle de Despesas"
        description="Registre e acompanhe despesas operacionais da propriedade."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Buscar por descrição ou categoria..."
              className="surface-input pl-9"
            />
          </div>
          <select className="surface-input">
            <option value="">Categoria</option>
            <option value="Suprimentos">Suprimentos</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Folha">Folha</option>
          </select>
          <input type="date" className="surface-input" />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted transition-colors dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span>Total filtrado</span>
          <strong className="text-lg text-emphasis">R$ 860,50</strong>
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {EXPENSES.map((expense) => (
                <tr key={expense.id} className="surface-table-row">
                  <td className="px-4 py-3 text-emphasis">{expense.description}</td>
                  <td className="px-4 py-3 text-muted-strong">{expense.category}</td>
                  <td className="px-4 py-3 text-muted">{expense.date}</td>
                  <td className="px-4 py-3 font-semibold text-emphasis">{expense.amount}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary btn-sm" onClick={() => openModal(expense)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {EXPENSES.map((expense) => (
            <div key={expense.id} className="surface-toolbar flex flex-col gap-2 p-4">
              <p className="text-emphasis">{expense.description}</p>
              <div className="text-sm text-muted">
                <p>Categoria: {expense.category}</p>
                <p>Data: {expense.date}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-emphasis">{expense.amount}</p>
                <button className="btn-secondary btn-sm" onClick={() => openModal(expense)}>
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">Editar despesa</h2>
                <p className="text-sm text-muted">
                  Atualize informações sobre a despesa registrada.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-muted-strong">
                Descrição
                <input
                  required
                  value={formValues.description}
                  onChange={(event) =>
                    setFormValues((values) => ({ ...values, description: event.target.value }))
                  }
                  className="surface-input mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Categoria
                <input
                  required
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues((values) => ({ ...values, category: event.target.value }))
                  }
                  className="surface-input mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Data
                <input
                  type="date"
                  required
                  value={formValues.date}
                  onChange={(event) =>
                    setFormValues((values) => ({ ...values, date: event.target.value }))
                  }
                  className="surface-input mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Valor
                <input
                  required
                  value={formValues.amount}
                  onChange={(event) =>
                    setFormValues((values) => ({ ...values, amount: event.target.value }))
                  }
                  className="surface-input mt-2"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialExpensesPage;
