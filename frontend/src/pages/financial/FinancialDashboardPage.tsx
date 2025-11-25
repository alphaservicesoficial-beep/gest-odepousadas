
import { useEffect, useState, useMemo } from "react";
import { X } from "lucide-react";
import Card from "../../components/ui/Card";
import { KpiCard } from "../../components/ui/KpiCard";
import StatusBadge from "../../components/ui/StatusBadge";

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

// 🔹 Cada item do backend
interface ReceivableItem {
  id: string;
  name: string;
  companyName?: string;
  companyId?: string | null;
  dueDate?: string;
  amount: string | number;
  status: string;
}


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

// 🔹 Formata data BR
function formatDateToBR(dateStr?: string): string {
  if (!dateStr || dateStr === "--") return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// 🔹 "R$ 1.234,56" → 1234.56
function parseBRL(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const clean = value
    .toString()
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

// 🔹 1234.56 → "R$ 1.234,56"
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 🔹 Agrupamento
type CompanyGrouping = {
  companyName: string;
  totalAmount: number;
  totalFormatted: string;
  openAmount: number;
  paidAmount: number;
  anyOpen: boolean;
  items: ReceivableItem[];
  hasMultipleDueDates: boolean;
  sampleDueDate?: string;
};

export default function FinancialDashboardPage() {
  // 🔹 TODOS os Hooks ficam no topo SEMPRE
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] =
    useState<CompanyGrouping | null>(null);

  // 🔹 Carregar dados
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/financial-dashboard`);
        if (!res.ok) throw new Error("Erro ao carregar dados financeiros");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Falha ao carregar dados financeiros.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 🔹 Agrupamento de EMPRESAS — agora SEMPRE executado no mesmo lugar
  const groupedCompanies = useMemo<CompanyGrouping[]>(() => {
    if (!data) return [];

    const map = new Map<string, CompanyGrouping>();

    data.receivablesCompanies.forEach((r) => {
      const name = r.name || "—";
      const amountNum = parseBRL(r.amount);
      const isOpen = (r.status || "").toLowerCase().includes("aberto");
      const isPaid = (r.status || "").toLowerCase().includes("pago");

      const existing = map.get(name);

      if (!existing) {
        map.set(name, {
          companyName: name,
          totalAmount: amountNum,
          openAmount: isOpen ? amountNum : 0,
          paidAmount: isPaid ? amountNum : 0,
          totalFormatted: "",
          anyOpen: isOpen,
          items: [r],
          hasMultipleDueDates: false,
          sampleDueDate: r.dueDate,
        });
      } else {
        existing.totalAmount += amountNum;
        if (isOpen) existing.openAmount += amountNum;
        if (isPaid) existing.paidAmount += amountNum;
        existing.items.push(r);

        if (
          existing.sampleDueDate &&
          r.dueDate &&
          r.dueDate !== existing.sampleDueDate
        ) {
          existing.hasMultipleDueDates = true;
        }
      }
    });

    return Array.from(map.values()).map((c) => ({
      ...c,
      totalFormatted: formatBRL(c.totalAmount),
      anyOpen: c.openAmount > 0,
    }));
  }, [data]);

  const closeCompanyModal = () => setSelectedCompany(null);

  // 🔹 Renderização
  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted animate-pulse">
        Carregando dados financeiros...
      </div>
    );

  if (error)
    return <div className="text-center text-red-600 mt-20">{error}</div>;

  if (!data) return null;

const {
  kpis,
  paymentOverview,
  insights,
  receivablesCompanies,  // ← ADICIONE ESTA LINHA
  receivablesGeneral,
} = data;

 
  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho da página */}
      <section>
        <h1 className="text-2xl font-semibold text-emphasis">
          Dashboard Financeiro
        </h1>
        <p className="text-sm text-muted">
          Aqui você acompanha as métricas e movimentações financeiras.
        </p>
      </section>

      {/* 🔹 KPIs principais */}
      <section className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Receita bruta" value={kpis.grossRevenue} tone="success" />
        <KpiCard label="Contas a receber" value={kpis.receivables} tone="info" />
        <KpiCard label="Despesas" value={kpis.expenses} tone="warning" />
        <KpiCard label="Lucro estimado" value={kpis.estimatedProfit} tone="default" />
      </section>

      {/* 🔹 Pagamentos + Insights */}
      <div className="grid w-full gap-6 lg:grid-cols-3">
        <Card
          title="Visão geral de pagamentos"
          description="Distribuição por método de pagamento"
          className="lg:col-span-2"
        >
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {paymentOverview.map((item) => (
              <div
                key={item.method}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <p className="text-sm text-muted">{item.method}</p>
                <p className="mt-1 text-lg font-semibold text-emphasis">{item.amount}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Análises e ações" description="Insights automáticos">
          <ul className="space-y-3">
            {insights.length === 0 ? (
              <li className="text-sm text-muted italic">Nenhum insight disponível.</li>
            ) : (
              insights.map((i) => (
                <li
                  key={i}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                >
                  {i}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* 🔹 Contas a Receber */}
      <div className="grid w-full gap-6 lg:grid-cols-2">
        {/* 🏢 Empresas */}
        <Card title="Contas a receber - Empresas" description="Contratos corporativos">
          {receivablesCompanies.length === 0 ? (
            <p className="text-sm text-muted italic">Nenhum registro corporativo.</p>
          ) : (
            <>
              <div className="mt-4 hidden md:block overflow-x-visible">

                <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivablesCompanies.map((r) => (
                      <tr key={r.id}>
  <td className="px-3 py-3 whitespace-nowrap">{r.name}</td>
  <td className="px-3 py-3 whitespace-nowrap">{r.companyName}</td>
  <td className="px-3 py-3 whitespace-nowrap text-muted">
    {formatDateToBR(r.dueDate)}
  </td>
  <td className="px-3 py-3 whitespace-nowrap">{r.amount}</td>
  <td className="px-3 py-3 whitespace-nowrap">
    <StatusBadge
      label={r.status}
      status={r.status === "Pago" ? "success" : "warning"}
    />
  </td>
</tr>

                    ))}
                  </tbody>
                </table>
              </div>

              {/* 📱 mobile */}
              <div className="mt-4 space-y-3 md:hidden">
                {receivablesCompanies.map((r) => (
                  <div key={r.id} className="surface-toolbar flex flex-col gap-2 p-4">
                    <p className="text-emphasis font-semibold">{r.name}</p>
                    <p>Empresa: {r.companyName}</p>

                    <div className="text-sm text-muted space-y-1">
                      <p>Vencimento: {formatDateToBR(r.dueDate)}</p>
                      <p>Valor: R$ {r.amount}</p>
                      <p>
                        Status:{" "}
                        <StatusBadge
                          label={r.status}
                          status={r.status === "Pago" ? "success" : "warning"}
                        />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* 👤 Geral */}
        <Card title="Contas a receber - Geral" description="Reservas individuais">
          {receivablesGeneral.length === 0 ? (
            <p className="text-sm text-muted italic">Nenhum registro encontrado.</p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
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
                        <td className="px-4 py-3 text-muted">{formatDateToBR(r.dueDate)}</td>
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
              </div>

              {/* 📱 mobile */}
              <div className="mt-4 space-y-3 md:hidden">
                {receivablesGeneral.map((r) => (
                  <div key={r.id} className="surface-toolbar flex flex-col gap-2 p-4">
                    <p className="text-emphasis font-semibold">{r.name}</p>
                    <div className="text-sm text-muted space-y-1">
                      <p>Vencimento: {formatDateToBR(r.dueDate)}</p>
                      <p>Valor: R$ {r.amount}</p>
                      <p>
                        Status:{" "}
                        <StatusBadge
                          label={r.status}
                          status={r.status === "Pago" ? "success" : "warning"}
                        />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
