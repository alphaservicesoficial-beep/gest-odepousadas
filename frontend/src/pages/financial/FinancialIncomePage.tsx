import { X } from "lucide-react";
import { FormEvent, useState } from "react";

import Card from "../../components/ui/Card";

const INCOME_STREAMS = [
  {
    id: "INC-001",
    description: "Reserva direta - Maria Silva",
    date: "12/10/2025",
    amount: "R$ 780,00",
    method: "Cartão",
  },
  {
    id: "INC-002",
    description: "Reserva corporativa - Viagens Brasil",
    date: "10/10/2025",
    amount: "R$ 5.400,00",
    method: "Faturado",
  },
];

function FinancialIncomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    description: "",
    date: "",
    amount: "",
    method: "",
  });

  const resetForm = () =>
    setFormValues({
      description: "",
      date: "",
      amount: "",
      method: "",
    });

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Integração futura para criar lançamento.
    resetForm();
    setIsCreateModalOpen(false);
  };

  const handleExportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card
        title="Controle de Receitas"
        description="Visualize as entradas previstas e confirmadas."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            Novo lançamento
          </button>
          <button className="btn-secondary" onClick={() => setIsExportModalOpen(true)}>
            Exportar dados
          </button>
        </div>

        <div className="mt-6 hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {INCOME_STREAMS.map((income) => (
                <tr key={income.id} className="surface-table-row">
                  <td className="px-4 py-3 text-emphasis">{income.description}</td>
                  <td className="px-4 py-3 text-muted">{income.date}</td>
                  <td className="px-4 py-3 font-semibold text-emphasis">{income.amount}</td>
                  <td className="px-4 py-3 text-muted">{income.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {INCOME_STREAMS.map((income) => (
            <div key={income.id} className="surface-toolbar flex flex-col gap-2 p-4">
              <p className="text-emphasis">{income.description}</p>
              <div className="text-sm text-muted">
                <p>Data: {income.date}</p>
                <p>Método: {income.method}</p>
              </div>
              <p className="text-sm font-semibold text-emphasis">{income.amount}</p>
            </div>
          ))}
        </div>
      </Card>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">Novo lançamento</h2>
                <p className="text-sm text-muted">Registre uma nova entrada de receita.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsCreateModalOpen(false);
                }}
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
                    setFormValues((values) => ({ ...values, description: event.target.value }))
                  }
                  className="surface-input mt-2"
                  placeholder="Ex.: Reserva corporativa"
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
                  placeholder="R$ 0,00"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Método de pagamento
                <input
                  required
                  value={formValues.method}
                  onChange={(event) =>
                    setFormValues((values) => ({ ...values, method: event.target.value }))
                  }
                  className="surface-input mt-2"
                  placeholder="PIX, Cartão, Dinheiro..."
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">Exportar receitas</h2>
                <p className="text-sm text-muted">Escolha o formato desejado para exportar os dados.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleExportSubmit}>
              <label className="block text-sm font-medium text-muted-strong">
                Formato do arquivo
                <select className="surface-input mt-2">
                  <option value="csv">CSV</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Intervalo de datas
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <input type="date" className="surface-input" />
                  <input type="date" className="surface-input" />
                </div>
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setIsExportModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Exportar
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
