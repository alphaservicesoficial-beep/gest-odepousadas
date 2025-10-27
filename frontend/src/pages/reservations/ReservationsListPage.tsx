import { CalendarIcon, Filter, Search, X } from "lucide-react";
import { useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

const RESERVATIONS = [
  {
    id: "RES-207",
    guestOrCompany: "Ednara Morinho",
    room: "207",
    guestsCount: 3,
    checkIn: "11/07/2025",
    checkOut: "17/07/2025",
    reservationStatus: "confirmada",
    paymentStatus: "pendente",
    paymentMethod: "Dinheiro",
    total: "R$ 1.250,00",
  },
  {
    id: "RES-100",
    guestOrCompany: "Maria Silva",
    room: "203",
    guestsCount: 2,
    checkIn: "12/10/2025",
    checkOut: "15/10/2025",
    reservationStatus: "confirmada",
    paymentStatus: "pago",
    paymentMethod: "Cartão",
    total: "R$ 780,00",
  },
];

function ReservationsListPage() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  const selectedReservation = selectedReservationId
    ? (RESERVATIONS.find(
        (reservation) => reservation.id === selectedReservationId,
      ) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <Card
        title="Lista de Reservas"
        description="Acompanhe todas as reservas com filtros avançados."
        headerAction={
          <button
            className="btn-secondary gap-2"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <Filter size={16} />
            Filtrar período
          </button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Buscar por hóspede, empresa ou quarto..."
              className="surface-input pl-9"
            />
          </div>
          <select className="surface-input">
            <option value="">Status da reserva</option>
            <option value="confirmada">Confirmada</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <button className="btn-secondary gap-2">
            <CalendarIcon size={16} />
            Período check-in
          </button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Hóspede/Empresa</th>
                <th className="px-4 py-3">Quarto</th>
                <th className="px-4 py-3">#Hósp.</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Status res.</th>
                <th className="px-4 py-3">Status pag.</th>
                <th className="px-4 py-3">Forma pag.</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {RESERVATIONS.map((reservation) => (
                <tr key={reservation.id} className="surface-table-row">
                  <td className="px-4 py-3 text-xs font-semibold text-muted-strong">
                    {reservation.id}
                  </td>
                  <td className="px-4 py-3 text-emphasis">
                    {reservation.guestOrCompany}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {reservation.room}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-strong">
                    {reservation.guestsCount}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {reservation.checkIn}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {reservation.checkOut}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={reservation.reservationStatus}
                      status={
                        reservation.reservationStatus === "confirmada"
                          ? "success"
                          : "warning"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={reservation.paymentStatus}
                      status={
                        reservation.paymentStatus === "pago"
                          ? "success"
                          : "warning"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {reservation.paymentMethod}
                  </td>
                  <td className="px-4 py-3 font-semibold text-emphasis">
                    {reservation.total}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedReservationId(reservation.id)}
                    >
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {RESERVATIONS.map((reservation) => (
            <div
              key={reservation.id}
              className="surface-toolbar flex flex-col gap-3 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-soft">
                  {reservation.id}
                </span>
                <StatusBadge
                  label={reservation.reservationStatus}
                  status={
                    reservation.reservationStatus === "confirmada"
                      ? "success"
                      : "warning"
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-emphasis">{reservation.guestOrCompany}</p>
                <p className="text-muted text-sm">
                  Quarto {reservation.room} • {reservation.guestsCount} hóspedes
                </p>
              </div>
              <div className="grid gap-2 text-xs text-muted-strong">
                <span>Check-in: {reservation.checkIn}</span>
                <span>Check-out: {reservation.checkOut}</span>
                <span>Pagamento: {reservation.paymentMethod}</span>
                <span>Total: {reservation.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <StatusBadge
                  label={reservation.paymentStatus}
                  status={
                    reservation.paymentStatus === "pago" ? "success" : "warning"
                  }
                />
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setSelectedReservationId(reservation.id)}
                >
                  Gerenciar
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Filtrar período
                </h2>
                <p className="text-sm text-muted">
                  Refine a lista de reservas por intervalo de data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar filtro"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setIsFilterModalOpen(false);
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

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Aplicar filtros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Gerenciar reserva
                </h2>
                <p className="text-sm text-muted">
                  Consulte os dados principais e escolha uma ação imediata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReservationId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-strong">
              <div>
                <p className="text-xs uppercase text-muted-soft">
                  Hóspede/Empresa
                </p>
                <p className="mt-1 text-emphasis">
                  {selectedReservation.guestOrCompany}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-soft">Check-in</p>
                  <p className="mt-1">{selectedReservation.checkIn}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-soft">Check-out</p>
                  <p className="mt-1">{selectedReservation.checkOut}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-soft">Quarto</p>
                  <p className="mt-1">{selectedReservation.room}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-soft">Hóspedes</p>
                  <p className="mt-1">{selectedReservation.guestsCount}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Pagamento</p>
                <p className="mt-1">
                  {selectedReservation.paymentMethod} •{" "}
                  {selectedReservation.paymentStatus}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Total</p>
                <p className="mt-1 font-semibold text-emphasis">
                  {selectedReservation.total}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button className="btn-primary">Confirmar chegada</button>
              <button className="btn-secondary">Registrar pagamento</button>
              <button className="btn-outline-danger">Cancelar reserva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsListPage;
