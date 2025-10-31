import { X } from "lucide-react";
import { useState, useEffect, useMemo, FormEvent } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; // ⚠️ Verifique o caminho se necessário

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge"; 

// Nomes dos meses (para o cabeçalho)
const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// qtos dias tem o mês (month em 1–12)
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// --- TIPOS DE DADOS ---
interface Room {
  id: string;
  identifier: string; // Ex: "105"
  type: string;       // Ex: "Quarto Família"
  description: string;
}

interface Reservation {
  id: string;
  guestOrCompany: string;
  room: string; // Número do quarto
  checkIn: string; // Formato YYYY-MM-DD
  checkOut: string; // Formato YYYY-MM-DD
  reservationStatus: 'confirmada' | 'cancelada' | 'pendente' | 'saída';
  collectionName: 'guests' | 'companies'; // Para saber de onde a reserva veio
}

type DailyMovement = {
  type: 'Check-in' | 'Check-out';
  name: string;
  room: string;
  status: 'success' | 'info' | 'warning';
};

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

// --- CONSTANTES DE DATA (Mês Fixo para Simulação) ---
const TARGET_MONTH = 10; // Outubro
const TARGET_YEAR = 2025;
const DAYS = Array.from({ length: 30 }, (_, index) => index + 1);
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Função utilitária para formatar a data
const formatDate = (day: number, month: number, year: number) => {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// --- HOOK CUSTOMIZADO PARA BUSCAR DADOS DO FIREBASE ---
function useCalendarData(year: number, month: number, selectedDay: string | null) {
  const [occupancy, setOccupancy] = useState<{ [day: number]: number }>({});
  const [movements, setMovements] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  let active = true; // evita race conditions
  async function loadData() {
    try {
      // não zera tudo enquanto carrega
      if (active) setIsLoading(true);
      const occRes = await fetch(`${baseUrl}/calendar/occupancy?year=${year}&month=${month}`);
      const occData = await occRes.json();
      if (active) setOccupancy(occData.days || {});

      if (selectedDay) {
        const movementsRes = await fetch(`${baseUrl}/calendar/movements?date=${selectedDay}`);
        const movementsData = await movementsRes.json();
        if (active) setMovements([...movementsData.checkins, ...movementsData.checkouts]);
      }

      const roomsRes = await fetch(`${baseUrl}/rooms`);
      const roomsData = await roomsRes.json();
      if (active) setRooms(roomsData);
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    } finally {
      if (active) setIsLoading(false);
    }

    return () => { active = false };
  }

  loadData();
}, [year, month, selectedDay]);

  return { occupancy, movements, rooms, isLoading };
}


// --- COMPONENTE PRINCIPAL ---
function ReservationsCalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(13);

  const [currentMonth, setCurrentMonth] = useState(10); // Outubro (1–12)
const [currentYear, setCurrentYear] = useState(2025);


  const daysArray = useMemo(
  () => Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1),
  [currentYear, currentMonth]
);

// Funções para navegar entre meses
const handleNextMonth = () => {
  if (currentMonth === 12) {
    setCurrentMonth(1);
    setCurrentYear((prev) => prev + 1);
  } else {
    setCurrentMonth((prev) => prev + 1);
  }
};

const handlePreviousMonth = () => {
  if (currentMonth === 1) {
    setCurrentMonth(12);
    setCurrentYear((prev) => prev - 1);
  } else {
    setCurrentMonth((prev) => prev - 1);
  }
};

// ✅ Data selecionada no formato YYYY-MM-DD
const selectedDateString = selectedDay
  ? `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
  : null;

// Busca os dados do backend conforme mês e dia selecionados
const { occupancy, movements, rooms, isLoading } = useCalendarData(currentYear, currentMonth, selectedDateString);


  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  
  const [newReservationData, setNewReservationData] = useState({
    checkIn: '',
    checkOut: '',
    room: '',
  });

 

  // ----------------------------------------------------
  // LÓGICA DE CÁLCULO PARA O CALENDÁRIO (Memoizada)
  // ----------------------------------------------------
 const reservationCounts = occupancy;
const dailyMovements = movements.map((m) => {
  let type = m.statusLabel === "Saída" ? "Check-out" : "Check-in";
  let status: "success" | "info" | "warning" = "info";

  if (m.statusLabel === "Entrada") status = "success";
  else if (m.statusLabel === "Saída") status = "info";

  return {
    type,
    name: m.name,
    room: m.room,
    status,
  };
});



  // ----------------------------------------------------
  // LÓGICA DE CRIAÇÃO DE RESERVA (Simulação - Apenas registra no Firestore)
  // ----------------------------------------------------
  const handleCreateReservation = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!newReservationData.checkIn || !newReservationData.checkOut || !newReservationData.room) {
      alert('Por favor, preencha todos os campos do intervalo e quarto.');
      return;
    }

    const newDocRef = doc(collection(db, "guests")); // Cria uma nova referência de documento
    
    try {
      await fetch(`${baseUrl}/calendar/pre-reservations`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    checkIn: newReservationData.checkIn,
    checkOut: newReservationData.checkOut,
    roomNumber: newReservationData.room,
  }),
});

      alert(`Reserva preliminar criada com sucesso! ID: ${newDocRef.id}. Redirecionando para o cadastro...`);
      setIsIntervalModalOpen(false);
      
    } catch (error) {
      console.error("Erro ao criar reserva preliminar:", error);
      alert("Erro ao criar reserva. Tente novamente.");
    }
  };

  // ----------------------------------------------------
  // RENDERIZAÇÃO
  // ----------------------------------------------------




  return (
    <div className="space-y-6">
      <Card
        title="Calendário de Reservas"
        description="Visualize disponibilidade, bloqueios e selecione intervalos para novas reservas."
      >
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 transition dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
           <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
  <button className="btn-secondary btn-sm" onClick={handlePreviousMonth}>
    Mês anterior
  </button>

  <div className="text-center">
    <p className="text-xs text-muted">
      {String(currentYear)}-{String(currentMonth).padStart(2, "0")}-01
    </p>
    <h2 className="text-lg font-semibold text-emphasis">
      {MONTH_NAMES[currentMonth - 1]} {currentYear}
    </h2>
  </div>

  <button className="btn-secondary btn-sm" onClick={handleNextMonth}>
    Próximo mês
  </button>
</header>


{isLoading && (
  <p className="text-center text-sm text-muted py-2 animate-pulse">
    Atualizando calendário...
  </p>
)}


            <div className="grid grid-cols-4 gap-2 text-center text-[0.65rem] font-semibold uppercase text-muted sm:grid-cols-7">
              {WEEK_DAYS.map((day) => (
                <span key={day} className="py-1">{day}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {daysArray.map((day) => {
  const isSelected = selectedDay === day;
  const count = reservationCounts?.[day] || 0;
 
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex h-16 flex-col justify-center rounded-xl border text-sm transition sm:h-20 ${isSelected ? "border-primary bg-primary/10 text-primary" : "border-slate-200 bg-white text-muted-strong hover:border-primary/50 hover:text-primary dark:border-slate-800 dark:bg-slate-900/50"}`}
                  >
                    <span className="font-semibold">{day}</span>
                    <span className="text-[0.65rem] text-muted">
                      {count} reserva{count !== 1 ? 's' : ''}
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
    ? `Movimentos de ${selectedDay}/${currentMonth}/${currentYear}`
    : "Selecione um dia para ver detalhes."}
</p>

            <ul className="mt-4 space-y-2 text-sm">
              {dailyMovements.length > 0 ? (
                dailyMovements.map((movement, index) => (
                  <li key={index} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 transition dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <span>{movement.type} • {movement.name} - Quarto {movement.room}</span>
                  <StatusBadge 
  label={movement.status === 'success' ? 'Entrada' : 'Saída'} 
  status={(movement.status as 'success' | 'info' | 'warning') ?? 'info'} 
/>


                  </li>
                ))
              ) : (
                <li className="text-sm text-muted">Nenhum Check-in ou Check-out registrado para o dia.</li>
              )}
            </ul>

          </Card>
        </div>
      </Card>

      {/* Modal de Criação de Reserva */}
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

            <form className="mt-6 space-y-4" onSubmit={handleCreateReservation}>
              <label className="block text-sm font-medium text-muted-strong">
                Data inicial
                <input 
                  type="date" 
                  className="surface-input mt-2" 
                  value={newReservationData.checkIn}
                  onChange={(e) => setNewReservationData({...newReservationData, checkIn: e.target.value})}
                  defaultValue={selectedDay ? formatDate(selectedDay, TARGET_MONTH, TARGET_YEAR) : ''}
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Data final
                <input 
                  type="date" 
                  className="surface-input mt-2" 
                  value={newReservationData.checkOut}
                  onChange={(e) => setNewReservationData({...newReservationData, checkOut: e.target.value})}
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Quarto
                <select 
                  className="surface-input mt-2"
                  value={newReservationData.room}
                  onChange={(e) => setNewReservationData({...newReservationData, room: e.target.value})}
                >
                  <option value="">Selecionar quarto</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.identifier}>
                      {room.identifier} • {room.type}
                    </option>
                  ))}
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

      {/* Modal de Comprovantes */}
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
              <p className="text-xs text-center pt-2 text-muted">
                (Simulação: Esta lista deve ser preenchida dinamicamente com base no `selectedDay`)
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn-primary" 
                onClick={() => setIsReceiptsModalOpen(false)}
                aria-label="Fechar comprovantes"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationsCalendarPage;
