import { useEffect, useState, FormEvent } from "react";
import { X } from "lucide-react";
import Card from "../../components/ui/Card";

interface Expense {
  id: string;
  description: string;
  category: string;
  date: string;
  amount: number;
}

function FinancialExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formValues, setFormValues] = useState({
    description: "",
    category: "",
    date: "",
    amount: "",
  });

  // 🔹 Buscar despesas do backend
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/expenses");
      if (!res.ok) throw new Error("Erro ao carregar despesas");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
      setError("Falha ao carregar despesas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // 🔸 Criar nova despesa
  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const payload = {
        description: formValues.description,
        category: formValues.category,
        date: formValues.date,
        amount: parseFloat(formValues.amount.replace(",", ".") || "0"),
      };

      const res = await fetch("http://localhost:8000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar despesa");

      setIsCreateModalOpen(false);
      setFormValues({ description: "", category: "", date: "", amount: "" });
      await fetchExpenses(); // Atualiza a tabela
    } catch (err) {
      console.error(err);
      alert("Erro ao criar despesa.");
    }
  };

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted animate-pulse">
        Carregando despesas...
      </div>
    );

  if (error)
    return <div className="text-center text-red-600 mt-20">{error}</div>;

  const total = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <Card
        title="Controle de Despesas"
        description="Registre e acompanhe despesas operacionais da propriedade."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            Nova despesa
          </button>
        </div>

        <div className="flex flex-col gap-3 mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted transition-colors dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span>Total de despesas</span>
          <strong className="text-lg text-emphasis">
            R$ {total.toFixed(2).replace(".", ",")}
          </strong>
        </div>

        {/* 🧾 Tabela */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="surface-table-row">
                  <td className="px-4 py-3 text-emphasis">{expense.description}</td>
                  <td className="px-4 py-3 text-muted-strong">{expense.category}</td>
                  <td className="px-4 py-3 text-muted">{expense.date}</td>
                  <td className="px-4 py-3 font-semibold text-emphasis">
                    R$ {expense.amount.toFixed(2).replace(".", ",")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Layout mobile */}
        <div className="mt-4 space-y-3 md:hidden">
          {expenses.map((expense) => (
            <div key={expense.id} className="surface-toolbar flex flex-col gap-2 p-4">
              <p className="text-emphasis">{expense.description}</p>
              <div className="text-sm text-muted">
                <p>Categoria: {expense.category}</p>
                <p>Data: {expense.date}</p>
              </div>
              <p className="font-semibold text-emphasis">
                R$ {expense.amount.toFixed(2).replace(".", ",")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* 💰 Modal nova despesa */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">Nova despesa</h2>
                <p className="text-sm text-muted">Registre uma nova saída financeira.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateSubmit}>
              <label className="block text-sm font-medium text-muted-strong">
                Descrição
                <input
                  required
                  value={formValues.description}
                  onChange={(event) =>
                    setFormValues((v) => ({ ...v, description: event.target.value }))
                  }
                  className="surface-input mt-2"
                  placeholder="Ex: Compra de produtos"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Categoria
                <input
                  required
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues((v) => ({ ...v, category: event.target.value }))
                  }
                  className="surface-input mt-2"
                  placeholder="Ex: Manutenção, Suprimentos..."
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Data
                <input
                  type="date"
                  required
                  value={formValues.date}
                  onChange={(event) =>
                    setFormValues((v) => ({ ...v, date: event.target.value }))
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
                    setFormValues((v) => ({ ...v, amount: event.target.value }))
                  }
                  className="surface-input mt-2"
                  placeholder="R$ 0,00"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar despesa
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
