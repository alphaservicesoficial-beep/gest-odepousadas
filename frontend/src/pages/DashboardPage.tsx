import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";

// Tipagem dos dados vindos do backend
interface DashboardData {
  summary: {
    occupancyRate: string;
    checkinsPending: number;
    checkoutsPending: number;
    maintenance: number;
  };
  roomsStatus: {
    available: number;
    occupied: number;
    maintenance: number;
  };
  todayMovements: {
    checkins: { id: string; guest: string; room: string }[];
    checkouts: { id: string; guest: string; room: string }[];
  };
}

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Busca os dados do backend FastAPI
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/api/dashboard");
        if (!res.ok) throw new Error("Erro ao carregar dados do dashboard.");
        const data = await res.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error(err);
        setError("Falha ao conectar ao servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <span className="animate-pulse">Carregando dados do dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!dashboardData) return null;

  const { summary, roomsStatus, todayMovements } = dashboardData;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-emphasis">
          Olá, Usuário Demo!
        </h1>
        <p className="text-sm text-muted">
          Aqui está o panorama de hoje para a sua propriedade.
        </p>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Taxa de Ocupação"
          value={summary.occupancyRate}
          subtitle="Comparado a ontem"
          tone="success"
        />
        <KpiCard
          label="Check-ins pendentes"
          value={summary.checkinsPending}
          subtitle="Entradas previstas para hoje"
          tone="info"
        />
        <KpiCard
          label="Check-outs pendentes"
          value={summary.checkoutsPending}
          subtitle="Saídas previstas até 12h"
          tone="warning"
        />
        <KpiCard
          label="Quartos com atenção"
          value={summary.maintenance}
          subtitle="Em manutenção"
          tone="danger"
        />
      </section>

      {/* Status e movimentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Status dos Quartos"
          description="Resumo rápido do cenário atual"
        >
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <span className="text-sm text-muted-strong">Disponíveis</span>
              <StatusBadge label={String(roomsStatus.available)} status="success" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-muted-strong">Ocupados</span>
              <StatusBadge label={String(roomsStatus.occupied)} status="info" />
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm text-muted-strong">Manutenção</span>
              <StatusBadge label={String(roomsStatus.maintenance)} status="warning" />
            </li>
          </ul>
        </Card>

        <Card
          title="Movimentos de Hoje"
          description="Entradas e saídas programadas"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-emphasis">Check-ins</h3>
              <ul className="mt-2 space-y-2">
                {todayMovements.checkins.length === 0 ? (
                  <li className="text-sm text-muted italic">Nenhum check-in hoje.</li>
                ) : (
                  todayMovements.checkins.map((movement) => (
                    <li
                      key={movement.id}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-muted-strong transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {movement.guest} • Quarto {movement.room}
                      </span>
                      <StatusBadge label="ENTRADA" status="success" />
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-emphasis">Check-outs</h3>
              <ul className="mt-2 space-y-2">
                {todayMovements.checkouts.length === 0 ? (
                  <li className="text-sm text-muted italic">Nenhum check-out hoje.</li>
                ) : (
                  todayMovements.checkouts.map((movement) => (
                    <li
                      key={movement.id}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-muted-strong transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        {movement.guest} • Quarto {movement.room}
                      </span>
                      <StatusBadge label="SAÍDA" status="warning" />
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
