import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { KpiCard } from "../../components/ui/KpiCard";
import StatusBadge from "../../components/ui/StatusBadge";

interface FinancialData {
  kpis: {
    grossRevenue: string;
    receivables: string;
    expenses: string;
    estimatedProfit: string;
  };
  paymentOverview: { method: string; amount: string }[];
  insights: string[];
  receivablesCompanies: any[];
  receivablesGeneral: any[];
}

function FinancialDashboardPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancial = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/api/financial-dashboard");
        if (!res.ok) throw new Error("Erro ao carregar dados financeiros");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError("Falha ao carregar dados financeiros.");
      } finally {
        setLoading(false);
      }
    };
    fetchFinancial();
  }, []);

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted animate-pulse">
        Carregando dados financeiros...
      </div>
    );

  if (error)
    return <div className="text-center text-red-600 mt-20">{error}</div>;

  if (!data) return null;

  const { kpis, paymentOverview, insights, receivablesCompanies, receivablesGeneral } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Receita bruta" value={kpis.grossRevenue} tone="success" />
        <KpiCard label="Contas a receber" value={kpis.receivables} tone="info" />
        <KpiCard label="Despesas" value={kpis.expenses} tone="warning" />
        <KpiCard label="Lucro estimado" value={kpis.estimatedProfit} tone="default" />
      </section>

      {/* Pagamentos + Insights */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Visão geral de pagamentos"
          description="Distribuição por método de pagamento."
          className="xl:col-span-2"
        >
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {paymentOverview.map((item) => (
              <div
                key={item.method}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <p className="text-sm text-muted">{item.method}</p>
                <p className="mt-2 text-lg font-semibold text-emphasis">
                  {item.amount}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Análises e ações" description="Insights automáticos.">
          <ul className="space-y-3">
            {insights.map((i) => (
              <li
                key={i}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
              >
                {i}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Contas a receber */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Contas a receber - Empresas" description="Contratos corporativos.">
          {receivablesCompanies.length === 0 ? (
            <p className="text-sm text-muted italic">Nenhum registro corporativo.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {receivablesCompanies.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-muted">{r.dueDate}</td>
                    <td className="px-4 py-3">{r.amount}</td>
                    <td className="px-4 py-3">
  <StatusBadge
    label={r.status}
    status={r.status === "Pago" ? "success" : "warning"}
  />
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Contas a receber - Geral" description="Reservas individuais.">
          {receivablesGeneral.length === 0 ? (
            <p className="text-sm text-muted italic">Nenhum registro encontrado.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead>
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {receivablesGeneral.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3 text-muted">{r.dueDate}</td>
                    <td className="px-4 py-3">{r.amount}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={r.status}
                        status={r.status === "Pago" ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

export default FinancialDashboardPage;
