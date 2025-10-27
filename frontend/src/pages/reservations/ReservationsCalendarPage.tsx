import { X } from "lucide-react";
import { useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

const DAYS = Array.from({ length: 30 }, (_, index) => index + 1);
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ReservationsCalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(13);
  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card
        title="Calendário de Reservas"
        description="Visualize disponibilidade, bloqueios e selecione intervalos para novas reservas."
      >
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 transition dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <button className="btn-secondary btn-sm">Mês anterior</button>
              <div className="text-center">
                <p className="text-xs text-muted">Outubro 2025</p>
                <h2 className="text-lg font-semibold text-emphasis">Outubro</h2>
              </div>
              <button className="btn-secondary btn-sm">Próximo mês</button>
            </header>

            <div className="grid grid-cols-4 gap-2 text-center text-[0.65rem] font-semibold uppercase text-muted sm:grid-cols-7">
              {WEEK_DAYS.map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DAYS.map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex h-16 flex-col justify-center rounded-xl border text-sm transition sm:h-20 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-muted-strong hover:border-primary/50 hover:text-primary dark:border-slate-800 dark:bg-slate-900/50"
                    }`}
                  >
                    <span className="font-semibold">{day}</span>
                    <span className="text-[0.65rem] text-muted">
                      3 reservas
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card
            title="Resumo do dia"
            description="Movimentos associados à data selecionada."
            className="border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
          >
            <p className="text-sm text-muted">
              {selectedDay
                ? `Movimentos de ${selectedDay}/10/2025`
                : "Selecione um dia para ver detalhes."}
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 transition dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <span>Check-in • Maria Silva - Quarto 203</span>
                <StatusBadge label="Confirmada" status="success" />
              </li>
              <li className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 transition dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <span>Check-out • Ana Lima - Quarto 101</span>
                <StatusBadge label="Saída" status="info" />
              </li>
            </ul>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                className="btn-outline-info flex-1"
                onClick={() => setIsIntervalModalOpen(true)}
              >
                Selecionar intervalo e criar reserva
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => setIsReceiptsModalOpen(true)}
              >
                Ver comprovantes
              </button>
            </div>
          </Card>
        </div>
      </Card>

      {isIntervalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Criar reserva
                </h2>
                <p className="text-sm text-muted">
                  Selecione o intervalo desejado para iniciar uma nova reserva.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIntervalModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setIsIntervalModalOpen(false);
              }}
            >
              <label className="block text-sm font-medium text-muted-strong">
                Data inicial
                <input type="date" className="surface-input mt-2" />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Data final
                <input type="date" className="surface-input mt-2" />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Quarto
                <select className="surface-input mt-2">
                  <option value="">Selecionar quarto</option>
                  <option value="203">203 • 1 casal + 1 solteiro</option>
                  <option value="207">207 • 2 casal</option>
                  <option value="305">305 • 4 solteiro</option>
                </select>
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsIntervalModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReceiptsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Comprovantes do dia
                </h2>
                <p className="text-sm text-muted">
                  Histórico de comprovantes gerados para esta data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar comprovantes"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-strong">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-medium text-emphasis">
                  Check-in • Maria Silva
                </p>
                <p className="text-xs text-muted">
                  Emitido em 12/10/2025 às 10h30
                </p>
                <button className="btn-secondary btn-sm mt-2">
                  Visualizar comprovante
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-medium text-emphasis">
                  Pagamento pendente • Ednara Morinho
                </p>
                <p className="text-xs text-muted">
                  Emitido em 12/10/2025 às 08h45
                </p>
                <button className="btn-secondary btn-sm mt-2">
                  Visualizar comprovante
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setIsReceiptsModalOpen(false)}
                aria-label="Fechar comprovantes"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsCalendarPage;
