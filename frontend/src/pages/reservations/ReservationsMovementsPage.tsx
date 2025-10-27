import { X } from "lucide-react";
import { useMemo, useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

type Movement = {
  id: string;
  guest: string;
  room: string;
  guestsCount: number;
  checkIn?: string;
  checkOut?: string;
};

const MOCK_MOVEMENTS: { checkins: Movement[]; checkouts: Movement[] } = {
  checkins: [
    {
      id: "RES-207",
      guest: "Ednara Morinho",
      room: "207",
      checkIn: "11/07/2025",
      guestsCount: 3,
    },
    {
      id: "RES-100",
      guest: "Maria Silva",
      room: "203",
      checkIn: "13/10/2025",
      guestsCount: 2,
    },
    {
      id: "RES-105",
      guest: "João Souza",
      room: "305",
      checkIn: "13/10/2025",
      guestsCount: 1,
    },
  ],
  checkouts: [],
};

const PERIODS = [
  { label: "Hoje", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mês", value: "month" },
];

const GUEST_PRICE: Record<number, number> = {
  1: 140,
  2: 240,
  3: 300,
  4: 340,
};

const GUEST_OPTIONS = [1, 2, 3, 4] as const;

function ReservationsMovementsPage() {
  const [activePeriod, setActivePeriod] = useState("today");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState<(typeof GUEST_OPTIONS)[number]>(1);

  const formattedTotal = useMemo(() => {
    const total = GUEST_PRICE[guestCount] ?? 0;
    return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }, [guestCount]);

  const openPricingModal = () => setIsPricingModalOpen(true);
  const closePricingModal = () => setIsPricingModalOpen(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button className="btn-primary gap-2" onClick={openPricingModal}>
          Nova Reserva
        </button>
      </div>

      <Card
        title="Movimentos do Dia"
        description="Entradas e saídas organizadas por período."
        headerAction={
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((period) => (
              <button
                key={period.value}
                onClick={() => setActivePeriod(period.value)}
                className={activePeriod === period.value ? "btn-primary shadow gap-2" : "btn-secondary gap-2"}
              >
                {period.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Próximos check-ins" description="Reservas confirmadas para chegada">
            <ul className="space-y-3">
              {MOCK_MOVEMENTS.checkins.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-strong transition dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-emphasis">{item.guest}</p>
                    <StatusBadge label={item.id} status="info" />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Quarto {item.room} • {item.checkIn ?? "--"} • {item.guestsCount}{" "}
                    {item.guestsCount === 1 ? "hóspede" : "hóspedes"}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Próximos check-outs" description="Reservas previstas para saída">
            <ul className="space-y-3">
              {MOCK_MOVEMENTS.checkouts.length === 0 && (
                <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-muted dark:border-slate-700 dark:bg-slate-900/40">
                  Nenhum check-out programado para o período selecionado.
                </li>
              )}
              {MOCK_MOVEMENTS.checkouts.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-strong transition dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-emphasis">{item.guest}</p>
                    <StatusBadge label={item.id} status="warning" />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Quarto {item.room} • {item.checkOut ?? "--"} • {item.guestsCount}{" "}
                    {item.guestsCount === 1 ? "hóspede" : "hóspedes"}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Card>

      <Card title="Ferramentas rápidas" description="Ações disponíveis diretamente do centro de reservas.">
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary">Gerar comprovante de estadia</button>
          <button className="btn-secondary">Consultar comprovante de estadia</button>
        </div>
      </Card>

      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 sm:max-w-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">Nova Reserva</h2>
                <p className="text-sm text-muted">
                  Escolha a quantidade de hóspedes para estimar o valor base da diária.
                </p>
              </div>
              <button
                type="button"
                onClick={closePricingModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar simulação"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-muted-strong">
                Número de hóspedes
                <select
                  value={guestCount}
                  onChange={(event) => setGuestCount(Number(event.target.value) as (typeof GUEST_OPTIONS)[number])}
                  className="surface-input mt-2"
                >
                  {GUEST_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option} {option === 1 ? "pessoa" : "pessoas"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-muted-strong dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-xs uppercase text-muted-soft">Valor estimado</p>
                <p className="mt-2 text-2xl font-semibold text-emphasis">{formattedTotal}</p>
                <p className="mt-1 text-xs text-muted">
                  Valor padrão por diária. Tarifas definitivas podem variar conforme datas, promoções ou adicionais.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={closePricingModal}>
                Cancelar
              </button>
              <button className="btn-primary">Adicionar reserva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsMovementsPage;
