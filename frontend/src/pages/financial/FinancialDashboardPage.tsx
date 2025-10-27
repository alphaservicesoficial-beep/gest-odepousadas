import Card from "../../components/ui/Card";
import { KpiCard } from "../../components/ui/KpiCard";
import StatusBadge from "../../components/ui/StatusBadge";

const KPI_DATA = [
  { label: "Receita bruta", value: "R$ 152.000", tone: "success" as const },
  { label: "Contas a receber", value: "R$ 38.000", tone: "info" as const },
  { label: "Despesas", value: "R$ 54.000", tone: "warning" as const },
  { label: "Lucro estimado", value: "R$ 98.000", tone: "default" as const },
];

const PAYMENT_OVERVIEW = [
  { method: "Cartão", amount: "R$ 98.000" },
  { method: "PIX", amount: "R$ 32.000" },
  { method: "Dinheiro", amount: "R$ 22.000" },
];

const INSIGHTS = [
  "Revise as tarifas de alta temporada para maximizar receitas.",
  "5 reservas corporativas aguardam confirmação de pagamento.",
];

const RECEIVABLES_COMPANIES = [
  {
    id: "RC-CMP-001",
    name: "Viagens Brasil LTDA",
    dueDate: "20/10/2025",
    amount: "R$ 12.000",
    status: "Em aberto",
  },
];

const RECEIVABLES_GENERAL = [
  {
    id: "RC-GEN-001",
    name: "Maria Silva",
    dueDate: "15/10/2025",
    amount: "R$ 450",
    status: "Em aberto",
  },
  {
    id: "RC-GEN-002",
    name: "João Souza",
    dueDate: "18/10/2025",
    amount: "R$ 620",
    status: "Pago",
  },
];

function FinancialDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_DATA.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            tone={kpi.tone}
          />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Visão geral de pagamentos"
          description="Distribuição por método de pagamento."
          className="xl:col-span-2"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-muted transition-colors dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
            <p className="text-sm">Gráfico em desenvolvimento</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PAYMENT_OVERVIEW.map((item) => (
                <div
                  key={item.method}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-700 transition-colors dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
                >
                  <p className="text-sm text-muted">{item.method}</p>
                  <p className="mt-2 text-lg font-semibold text-emphasis">
                    {item.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Análises e ações"
          description="Insights gerados automaticamente."
        >
          <ul className="space-y-3">
            {INSIGHTS.map((insight) => (
              <li
                key={insight}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 transition dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
              >
                {insight}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Contas a receber - Empresas"
          description="Acompanhe os principais contratos corporativos."
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="surface-table-head">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                {RECEIVABLES_COMPANIES.map((item) => (
                  <tr key={item.id} className="surface-table-row">
                    <td className="px-4 py-3 text-emphasis">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.dueDate}</td>
                    <td className="px-4 py-3 font-semibold text-emphasis">
                      {item.amount}
                    </td>
                    <td className="px-4 py-3 text-amber-600 dark:text-amber-300">
                      {item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {RECEIVABLES_COMPANIES.map((item) => (
              <div
                key={item.id}
                className="surface-toolbar flex flex-col gap-2 p-4"
              >
                <p className="text-emphasis">{item.name}</p>
                <p className="text-sm text-muted">
                  Vencimento: {item.dueDate} • Valor: {item.amount}
                </p>
                <span className="text-xs font-semibold text-amber-600">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Contas a receber - Geral"
          description="Reservas individuais com valores a receber."
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="surface-table-head">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                {RECEIVABLES_GENERAL.map((item) => (
                  <tr key={item.id} className="surface-table-row">
                    <td className="px-4 py-3 text-emphasis">{item.name}</td>
                    <td className="px-4 py-3 text-muted">{item.dueDate}</td>
                    <td className="px-4 py-3 font-semibold text-emphasis">
                      {item.amount}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={item.status}
                        status={item.status === "Pago" ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {RECEIVABLES_GENERAL.map((item) => (
              <div
                key={item.id}
                className="surface-toolbar flex flex-col gap-2 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-emphasis">{item.name}</p>
                  <StatusBadge
                    label={item.status}
                    status={item.status === "Pago" ? "success" : "warning"}
                  />
                </div>
                <div className="text-sm text-muted">
                  <p>Vencimento: {item.dueDate}</p>
                  <p>Total: {item.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default FinancialDashboardPage;
