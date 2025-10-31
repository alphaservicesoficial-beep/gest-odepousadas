import { CalendarIcon, Search, X, FileDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

type Reservation = {
  id: string;
  guestOrCompany: string;
  room: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  reservationStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string | number;
  checkInStatus: string;
  checkOutStatus: string;
};

type PeriodKey = "ontem" | "hoje" | "amanha" | "prox7" | "todos";

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
function inRange(dateISO: string, from: Date, to: Date) {
  try {
    const d = new Date(dateISO + "T00:00:00");
    return d >= from && d <= to;
  } catch {
    return false;
  }
}

function ReservationsListPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("todos");

  // modal de ações
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // modal de comprovante
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [pickedReservation, setPickedReservation] = useState<Reservation | null>(null);

  // pagamento
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  // checagens convenientes
  const selected = selectedReservationId
    ? reservations.find((r) => r.id === selectedReservationId) ?? null
    : null;
  const isArrivalConfirmed = selected?.checkInStatus === "concluido";

  // carregar do backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/reservations");
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setReservations([]);
      }
    })();
  }, []);

  // ---------- FILTRO DE PERÍODO ----------
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  const [fromDate, toDate] = useMemo((): [Date | null, Date | null] => {
    const t0 = startOf(today);
    const t1 = endOf(today);
    if (period === "hoje") return [t0, t1];
    if (period === "ontem") {
      const d = new Date(t0); d.setDate(d.getDate() - 1);
      return [startOf(d), endOf(d)];
    }
    if (period === "amanha") {
      const d = new Date(t0); d.setDate(d.getDate() + 1);
      return [startOf(d), endOf(d)];
    }
    if (period === "prox7") {
      const d2 = new Date(t0); d2.setDate(d2.getDate() + 7);
      return [t0, endOf(d2)];
    }
    return [null, null];
  }, [period]);

  // ---------- BUSCA + PERÍODO ----------
  const filtered = useMemo(() => {
    const q = normalize(search);
    return reservations.filter((r) => {
      // busca por hóspede/empresa, id e quarto
      const hay =
        normalize(r.guestOrCompany || "") +
        " " +
        normalize(r.id || "") +
        " " +
        normalize(String(r.room || ""));

      const passText = q ? hay.includes(q) : true;

      const passPeriod =
        fromDate && toDate ? inRange(r.checkIn, fromDate, toDate) : true;

      return passText && passPeriod;
    });
  }, [reservations, search, fromDate, toDate]);

  // ---------- AÇÕES EXISTENTES ----------
  const openModal = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setIsModalOpen(true);
  };

  async function handleConfirmArrival(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reservations/${id}/checkin`, { method: "PUT" });
      if (!res.ok) throw new Error();
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, checkInStatus: "concluido", reservationStatus: "confirmado" } : r))
      );
      setIsModalOpen(false);
      alert("Check-in concluído e quarto marcado como ocupado.");
    } catch {
      alert("Erro ao confirmar check-in");
    }
  }

  async function handleConfirmDeparture(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reservations/${id}/checkout`, { method: "PUT" });
      if (!res.ok) throw new Error();
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, checkOutStatus: "concluido" } : r)));
      setIsModalOpen(false);
      alert("Check-out concluído.");
    } catch {
      alert("Erro ao confirmar check-out");
    }
  }

  async function handleRegisterPayment(id: string, method: string, amount: number) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reservations/${id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, amount }),
      });
      if (!res.ok) throw new Error();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                paymentStatus: "confirmado",
                paymentMethod: method,
                total: amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
              }
            : r
        )
      );
      setSelectedPayment("");
      setPaymentAmount("");
      setIsModalOpen(false);
      alert("Pagamento registrado.");
    } catch {
      alert("Erro ao registrar pagamento");
    }
  }

  async function handleCancelReservation(id: string) {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/reservations/${id}/cancel`, { method: "PUT" });
      if (!res.ok) throw new Error();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                reservationStatus: "cancelado",
                checkInStatus: "cancelado",
                checkOutStatus: "cancelado",
                paymentStatus: "cancelado",
                paymentMethod: "—",
                total: "R$ 0,00",
              }
            : r
        )
      );
      setIsModalOpen(false);
      alert("Reserva cancelada.");
    } catch {
      alert("Erro ao cancelar reserva");
    }
  }

  // ---------- COMPROVANTE ----------
  const receiptCandidates = useMemo(() => {
    const q = normalize(receiptSearch);
    if (!q) return reservations.slice(0, 10); // primeiras 10 para facilitar
    return reservations.filter((r) =>
      (normalize(r.guestOrCompany) + " " + normalize(r.id)).includes(q)
    );
  }, [reservations, receiptSearch]);

  async function generateReceiptPDF(resId: string) {
    const resp = await fetch(`http://127.0.0.1:8000/api/reservations/${resId}/receipt`);
    if (!resp.ok) {
      alert("Erro ao gerar PDF.");
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comprovante_${resId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card
        title="Lista de Reservas"
        description="Acompanhe todas as reservas com filtros e emissão de comprovantes."
        headerAction={
          <button className="btn-secondary gap-2" onClick={() => setReceiptModalOpen(true)}>
            <FileDown size={16} />
            Gerar comprovante
          </button>
        }
      >
        {/* Filtros principais */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Busca */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Buscar por hóspede/empresa, ID ou quarto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="surface-input pl-9 "
            />
          </div>

            

          {/* Filtro de período (Check-in) */}
          <div className="surface-input flex items-center gap-2">
            <CalendarIcon size={16} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="w-full bg-transparent outline-none"
            >
              <option value="todos">Todos os períodos</option>
              <option value="ontem">Ontem (check-in)</option>
              <option value="hoje">Hoje (check-in)</option>
              <option value="amanha">Amanhã (check-in)</option>
              <option value="prox7">Próximos 7 dias (check-in)</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Hóspede/Empresa</th>
                <th className="px-4 py-3">Quarto</th>
                <th className="px-4 py-3">#Hósp.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="surface-table-row">
                  <td className="px-4 py-3 text-xs font-semibold text-muted-strong">#{r.id.slice(0, 6)}</td>
                  <td className="px-4 py-3">{r.guestOrCompany}</td>
                  <td className="px-4 py-3">{r.room}</td>
                  <td className="px-4 py-3 text-center">{r.guestsCount}</td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      label={r.reservationStatus}
                      status={r.reservationStatus === "confirmado" ? "success" : r.reservationStatus === "cancelado" ? "danger" : "warning"}
                    />
                  </td>

                  <td className="px-4 py-3">
                    {r.checkIn}
                    <div className="mt-1">
                      <StatusBadge
                        label={r.checkInStatus}
                        status={r.checkInStatus === "concluido" ? "success" : r.checkInStatus === "cancelado" ? "danger" : "warning"}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    {r.checkOut}
                    <div className="mt-1">
                      <StatusBadge
                        label={r.checkOutStatus}
                        status={r.checkOutStatus === "concluido" ? "success" : r.checkOutStatus === "cancelado" ? "danger" : "warning"}
                      />
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge
                      label={r.paymentStatus}
                      status={r.paymentStatus === "confirmado" ? "success" : r.paymentStatus === "cancelado" ? "danger" : "warning"}
                    />
                  </td>

                  <td className="px-4 py-3">{r.total}</td>

                  <td className="px-4 py-3 text-right">
                    <button className="btn-primary btn-sm" onClick={() => openModal(r.id)}>
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-sm text-muted">
                    Nenhuma reserva encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de ações */}
      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Gerenciar reserva</h2>
                <p className="text-sm text-muted">Veja detalhes e ações rápidas.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-strong">
              <p><strong>Hóspede/Empresa:</strong> {selected.guestOrCompany}</p>
              <p><strong>Quarto:</strong> {selected.room}</p>
              <p><strong>Check-in:</strong> {selected.checkIn}</p>
              <p><strong>Check-out:</strong> {selected.checkOut}</p>
              <p><strong>Hóspedes:</strong> {selected.guestsCount}</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {!isArrivalConfirmed ? (
                <button className="btn-primary" onClick={() => handleConfirmArrival(selected.id)}>Confirmar chegada</button>
              ) : (
                <button className="btn-primary" onClick={() => handleConfirmDeparture(selected.id)}>Confirmar saída</button>
              )}

              {/* Pagamento */}
              <div className="grid grid-cols-3 gap-2">
                {["Dinheiro", "Cartão", "Transferência"].map((m) => (
                  <button
                    key={m}
                    className={`btn-secondary ${selectedPayment === m ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedPayment(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                placeholder="Valor (ex: 1.250,00)"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="surface-input"
              />
              <button
                className="btn-secondary"
                onClick={() => {
                  if (!selectedPayment || !paymentAmount) return;
                  const value = Number(paymentAmount.replace(/\./g, "").replace(",", "."));
                  if (!value || value <= 0) return alert("Informe um valor válido.");
                  handleRegisterPayment(selected.id, selectedPayment, value);
                }}
              >
                Registrar pagamento
              </button>

              <button className="btn-outline-danger" onClick={() => handleCancelReservation(selected.id)}>
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gerar Comprovante */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[32rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Gerar comprovante</h2>
              <button
                type="button"
                onClick={() => { setReceiptModalOpen(false); setPickedReservation(null); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="surface-input pl-9"
                placeholder="Busque por ID ou nome..."
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
              />
            </div>

            <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
              {receiptCandidates.map((r) => {
                const active = pickedReservation?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setPickedReservation(r)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                      active ? "bg-slate-50 dark:bg-slate-900/50" : ""
                    }`}
                  >
                    <span className="truncate">
                      <strong className="text-emphasis">#{r.id.slice(0, 6)}</strong> • {r.guestOrCompany} — Quarto {r.room}
                    </span>
                    <span className="text-xs text-muted">{r.checkIn} → {r.checkOut}</span>
                  </button>
                );
              })}
              {receiptCandidates.length === 0 && (
                <div className="p-4 text-center text-sm text-muted">Nenhuma reserva encontrada.</div>
              )}
            </div>

            <button
              className="btn-primary mt-4 w-full"
              disabled={!pickedReservation}
              onClick={() => {
                if (!pickedReservation) return;
                generateReceiptPDF(pickedReservation.id);
              }}
            >
              Gerar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsListPage;
