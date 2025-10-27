import Card from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";

const mockRoomStatus = [
  { label: "Disponíveis", value: 12, tone: "success" as const },
  { label: "Ocupados", value: 18, tone: "info" as const },
  { label: "Manutenção", value: 3, tone: "warning" as const },
];

const todayMovements = {
  checkins: [
    { id: "RES-100", guest: "Maria Silva", room: "203" },
    { id: "RES-102", guest: "João Souza", room: "305" },
  ],
  checkouts: [{ id: "RES-090", guest: "Ana Lima", room: "101" }],
};

function DashboardPage() {
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Taxa de Ocupação"
          value="72%"
          subtitle="Comparado a ontem: +3%"
          tone="success"
        />
        <KpiCard
          label="Check-ins pendentes"
          value={4}
          subtitle="12h - 20h"
          tone="info"
        />
        <KpiCard
          label="Check-outs pendentes"
          value={3}
          subtitle="Até 12h"
          tone="warning"
        />
        <KpiCard
          label="Quartos com atenção"
          value={2}
          subtitle="Intervenções urgentes"
          tone="danger"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Status dos Quartos"
          description="Resumo rápido do cenário atual"
        >
          <ul className="space-y-3">
            {mockRoomStatus.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-muted-strong">{item.label}</span>
                <StatusBadge label={String(item.value)} status={item.tone} />
              </li>
            ))}
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
                {todayMovements.checkins.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-muted-strong transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {movement.guest} • Quarto {movement.room}
                    </span>
                    <StatusBadge label={movement.id} status="info" />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-emphasis">Check-outs</h3>
              <ul className="mt-2 space-y-2">
                {todayMovements.checkouts.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-muted-strong transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {movement.guest} • Quarto {movement.room}
                    </span>
                    <StatusBadge label={movement.id} status="warning" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
