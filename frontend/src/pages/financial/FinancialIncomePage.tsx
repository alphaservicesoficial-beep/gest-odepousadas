import { useState, useEffect, FormEvent } from "react";
import * as XLSX from "xlsx";
import { X } from "lucide-react";
import Card from "../../components/ui/Card";

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

interface Income {
  id: string;
  description: string;
  date: string;
  amount: number;
  method: string;
}

// 🔹 Função utilitária para formatar a data (YYYY-MM-DD → DD/MM/AAAA)
function formatDateToBR(dateStr?: string): string {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// 🔹 Função para formatar valor monetário
function formatCurrencyBR(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function FinancialIncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    description: "",
    date: "",
    amount: "",
    method: "",
  });

  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const res = await fetch(`${baseUrl}/incomes`);
      const data = await res.json();
      setIncomes(data);
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
    }
  };

  const handleCreateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch(`${baseUrl}/incomes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: formValues.description,
        date: formValues.date,
        amount: parseFloat(formValues.amount),
        method: formValues.method,
      }),
    });
    setIsCreateModalOpen(false);
    setFormValues({ description: "", date: "", amount: "", method: "" });
    fetchIncomes();
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(incomes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Receitas");
    XLSX.writeFile(wb, "receitas.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card title="Controle de Receitas" description="Visualize e registre novas entradas de receita.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            Novo lançamento
          </button>
          <button className="btn-secondary" onClick={handleExport}>
            Exportar dados
          </button>
        </div>

        {/* 💻 Layout Desktop */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead>
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Método</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td className="px-4 py-3">{inc.description}</td>
                  <td className="px-4 py-3">{formatDateToBR(inc.date)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrencyBR(inc.amount)}</td>
                  <td className="px-4 py-3">{inc.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Layout Mobile */}
        <div className="mt-4 space-y-3 md:hidden">
          {incomes.map((income) => (
            <div key={income.id} className="surface-toolbar flex flex-col gap-2 p-4">
              <p className="text-emphasis font-semibold">{income.description}</p>
              <div className="text-sm text-muted space-y-1">
                <p>Data: {formatDateToBR(income.date)}</p>
                <p>Método: {income.method}</p>
              </div>
              <p className="font-semibold text-emphasis">{formatCurrencyBR(income.amount)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 🔹 Modal de criação */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Novo lançamento</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCreateSubmit}>
              <input
                placeholder="Descrição"
                className="surface-input"
                required
                value={formValues.description}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              />
              <input
                type="date"
                className="surface-input"
                required
                value={formValues.date}
                onChange={(e) => setFormValues({ ...formValues, date: e.target.value })}
              />
              <input
                placeholder="Valor"
                className="surface-input"
                required
                type="number"
                min="0"
                step="0.01"
                value={formValues.amount}
                onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
              />
              <input
                placeholder="Método"
                className="surface-input"
                required
                value={formValues.method}
                onChange={(e) => setFormValues({ ...formValues, method: e.target.value })}
              />
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialIncomePage;
