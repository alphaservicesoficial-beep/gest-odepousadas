import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import StatusBadge from "../components/ui/StatusBadge";
import { getUser } from "../lib/auth"; // 👈 importa o mesmo helper usado no Topbar
import { Calendar } from "lucide-react";

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

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

  // 🔥 Data de hoje no formato BR (dd/mm/yyyy)
const todayBR = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// 🔥 Data de amanhã no formato BR
const tomorrowBR = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};


const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Check-in
const [isCheckinOpen, setIsCheckinOpen] = useState(false);
const [checkinStep, setCheckinStep] = useState(1);
const totalCheckinSteps = 6; // 🔥 Vai ser 6 agora por causa da nova etapa do quarto
const nextStep = () => {
  if (checkinStep < totalCheckinSteps) {
    setCheckinStep(checkinStep + 1);
  }
};

const prevStep = () => {
  if (checkinStep > 1) {
    setCheckinStep(checkinStep - 1);
  }
};
const [checkinForm, setCheckinForm] = useState({
  // 🧍 Hóspede

 

  hasGuestAccount: null as "sim" | "nao" | null,
  guestName: "",
  guestCPF: "",
  guestEmail: "",
  guestPhone: "",

  // 🔎 Buscar hóspede cadastrado
  searchGuest: "",
  selectedGuestId: null as string | null,
  selectedGuestFullData: null as any | null,

  showSearch: true,
  showCompanySearch: true,


  // 👥 Acompanhantes
  hasCompanions: "nao" as "sim" | "nao",
  companionsCount: 0,
  companions: [] as { name: string; cpf: string }[],

  // 🏢 Empresa
  hasCompany: "nao" as "sim" | "nao",
  hasCompanyAccount: null as "sim" | "nao" | null,
  searchCompany: "",
  selectedCompanyId: null as string | null,
  selectedCompanyFullData: null as any | null,

  companyName: "",
  companyResponsible: "",
  companyCNPJ: "",
  companyEmail: "",
  companyPhone: "",

  // 📅 Datas
 checkInDate: todayBR(),
checkOutDate: tomorrowBR(),


  // 📝 Observações
  notes: "",

  // 🛏️ NOVA ETAPA: Escolha do quarto
  selectedRoomId: "",


  selectedGuestName: "",
selectedGuestCPF: "",

selectedCompanyName: "",
});
const resetCheckinForm = () => {
  setCheckinForm({
    hasGuestAccount: null,
    guestName: "",
    guestCPF: "",
    guestEmail: "",
    guestPhone: "",
    searchGuest: "",
    selectedGuestId: null,
    selectedGuestFullData: null,
    hasCompanions: "nao",
    companionsCount: 0,
    companions: [],
    hasCompany: "nao",
    hasCompanyAccount: null,
    searchCompany: "",
    selectedCompanyId: null,
    selectedCompanyFullData: null,
    companyName: "",
    companyResponsible: "",
    companyCNPJ: "",
    companyEmail: "",
    companyPhone: "",
    checkInDate: todayBR(),
checkOutDate: tomorrowBR(),

    notes: "",
    selectedRoomId: "",

    showSearch: true,
    showCompanySearch: true,


    selectedGuestName: "",
selectedGuestCPF: "",
selectedCompanyName: "",

  });
  setCheckinStep(1);
};

  // 👤 Usuário logado (mesmo que aparece na Topbar)
  const user = getUser();
  const userName = user?.name || "Usuário";



// ========== Máscara de CPF ==========
function maskCPF(value: string) {
  // Remove qualquer caractere não numérico
  const cleanedValue = value.replace(/\D/g, "");

  // Limita o valor a 11 dígitos (máximo de CPF)
  const limitedValue = cleanedValue.slice(0, 11);

  // Aplica a formatação do CPF
  return limitedValue
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}


function maskCNPJ(value: string) {
  // Remove qualquer caractere não numérico
  const cleanedValue = value.replace(/\D/g, "");

  // Limita o valor a 14 dígitos (máximo de CNPJ)
  const limitedValue = cleanedValue.slice(0, 14);

  // Aplica a formatação do CNPJ
  return limitedValue
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}


function maskPhone(value: string) {
  // Remove tudo que não seja número
  const cleaned = value.replace(/\D/g, "").slice(0, 11); // 🔥 máximo 11 dígitos

  // Aplica máscara progressivamente
  if (cleaned.length <= 2) {
    return `(${cleaned}`;
  }
  if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}


// ========== Máscara de Data BR ==========
const maskDateBR = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .slice(0, 10);
};




// Converte dd/mm/yyyy → yyyy-mm-dd
const toISO = (value: string) => {
  if (!value) return "";
  const [d, m, y] = value.split("/");
  return `${y}-${m}-${d}`;
};

// Converte yyyy-mm-dd → dd/mm/yyyy
const toBR = (value: string) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
};

// Lista geral
const [allGuests, setAllGuests] = useState<any[]>([]);
const [allCompanies, setAllCompanies] = useState<any[]>([]);


// 🛏️ Quartos
const [rooms, setRooms] = useState<any[]>([]);
const [availableRooms, setAvailableRooms] = useState<any[]>([]);

// Filtrados (autocomplete)
const [filteredGuests, setFilteredGuests] = useState<any[]>([]);
const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);

// Buscar hóspedes cadastrados
const fetchGuests = async () => {
  try {
    const res = await fetch(`${baseUrl}/guests`);
    const data = await res.json();
    setAllGuests(data);
  } catch (err) {
    console.error("Erro ao buscar hóspedes", err);
  }
};


useEffect(() => {
  if (checkinForm.searchGuest.trim().length === 0) {
    setFilteredGuests([]);
    return;
  }

  const termo = checkinForm.searchGuest.toLowerCase();

  const results = allGuests.filter((g) =>
    g.fullName.toLowerCase().includes(termo) ||
    g.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))
  );

  setFilteredGuests(results);
}, [checkinForm.searchGuest, allGuests]);


const clearSelectedGuest = () => {
  setCheckinForm((prev) => ({
    ...prev,
    selectedGuestId: null,
    selectedGuestFullData: null,
    selectedGuestName: "",
    selectedGuestCPF: "",
    selectedGuestEmail: "",
    selectedGuestPhone: "",
    searchGuest: "",
    showSearch: true,
  }));
};



const updateCompanion = (index: number, field: "name" | "cpf", value: string) => {
  const newList = [...checkinForm.companions];
  newList[index][field] = value;

  setCheckinForm((prev) => ({
    ...prev,
    companions: newList,
  }));
};



const fetchCompanies = async () => {
  try {
    const res = await fetch(`${baseUrl}/companies`);
    const data = await res.json();
    setAllCompanies(data);
  } catch (err) {
    console.error("Erro ao buscar empresas", err);
  }
};


useEffect(() => {
  if (!checkinForm.searchCompany?.trim()) {
    setFilteredCompanies([]);
    return;
  }

  const termo = checkinForm.searchCompany.toLowerCase();

  const results = allCompanies.filter(
    (c) =>
      c.name.toLowerCase().includes(termo) ||
      c.cnpj.replace(/\D/g, "").includes(termo.replace(/\D/g, ""))
  );

  setFilteredCompanies(results);
}, [checkinForm.searchCompany, allCompanies]);


useEffect(() => {
  fetchGuests();
  fetchCompanies();
}, []);

const fetchRooms = async () => {
  try {
    const res = await fetch(`${baseUrl}/rooms`);
    const data = await res.json();

    setRooms(data);

    // Filtrar apenas os disponíveis
    const available = data.filter((room: any) =>
      room.status?.toLowerCase() === "disponível"
    );

    setAvailableRooms(available);
  } catch (err) {
    console.error("Erro ao buscar quartos", err);
  }
};


useEffect(() => {
  fetchGuests();
  fetchCompanies();
  fetchRooms(); // 🔥 adicionar aqui
}, []);


const fetchDashboardData = async () => {
  try {
    setLoading(true);

    const res = await fetch(`${baseUrl}/dashboard`);
    if (!res.ok) throw new Error("Erro ao carregar dados do dashboard.");

    const data = await res.json();

    // 🔥 CONVERTE AS DATAS AQUI
    const converted = {
      ...data,
      todayMovements: {
        checkins: data.todayMovements.checkins.map((item: any) => ({
          ...item,
          checkInDate: toBR(item.checkInDate),
          checkOutDate: toBR(item.checkOutDate),
        })),
        checkouts: data.todayMovements.checkouts.map((item: any) => ({
          ...item,
          checkInDate: toBR(item.checkInDate),
          checkOutDate: toBR(item.checkOutDate),
        })),
      },
    };

    setDashboardData(converted);
  } catch (err: any) {
    console.error(err);
    setError("Falha ao conectar ao servidor.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDashboardData();
}, []);


  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted">
        <span className="animate-pulse">Carregando dados do dashboard...</span>
      </div>
    );

  if (error)
    return (
      <div className="flex h-[60vh] items-center justify-center text-red-600">
        {error}
      </div>
    );

  if (!dashboardData) return null;

  const { summary, roomsStatus, todayMovements } = dashboardData;


  




  const handleFinalizeCheckin = async () => {
  try {
    // validações básicas
    if (!checkinForm.selectedRoomId) {
      alert("Selecione um quarto para continuar.");
      return;
    }

    if (!checkinForm.guestName || !checkinForm.guestCPF) {
      alert("Informe nome e CPF do hóspede.");
      return;
    }

    if (!checkinForm.checkInDate || !checkinForm.checkOutDate) {
      alert("Informe as datas de entrada e saída.");
      return;
    }

    setIsSubmittingCheckin(true);

    // --------------------------------------------------
    // 1) Criar hóspede, se NÃO tem cadastro
    // --------------------------------------------------
    if (checkinForm.hasGuestAccount === "nao") {
      const guestPayload = {
        fullName: checkinForm.guestName,
        cpf: checkinForm.guestCPF,
        phone: checkinForm.guestPhone || "",
        email: checkinForm.guestEmail || "",
      };

      const resGuest = await fetch(`${baseUrl}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestPayload),
      });

      if (!resGuest.ok) {
        const body = await resGuest.json().catch(() => ({}));
        throw new Error(body.detail || "Erro ao criar hóspede.");
      }
    }

    // --------------------------------------------------
    // 2) Criar / resolver empresa
    // --------------------------------------------------
    let companyId: string | null = null;
    let companyName: string | null = null;

    if (checkinForm.hasCompany === "sim") {
      // já existe no sistema
      if (checkinForm.hasCompanyAccount === "sim") {
        companyId = checkinForm.selectedCompanyId;
        // usamos o nome buscado ou o nome digitado como fallback
        companyName =
          (checkinForm as any).selectedCompanyName ||
          checkinForm.searchCompany ||
          checkinForm.companyName ||
          null;
      }

      // empresa nova → criar
      if (checkinForm.hasCompanyAccount === "nao") {
        const companyPayload = {
          name: checkinForm.companyName,
          responsible: checkinForm.companyResponsible,
          cnpj: checkinForm.companyCNPJ,
          email: checkinForm.companyEmail || "",
          phone: checkinForm.companyPhone || "",
        };

        const resCompany = await fetch(`${baseUrl}/companies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companyPayload),
        });

        if (!resCompany.ok) {
          const body = await resCompany.json().catch(() => ({}));
          throw new Error(body.detail || "Erro ao criar empresa.");
        }

        const dataCompany = await resCompany.json();
        companyId = dataCompany.id;
        companyName = companyPayload.name;
      }
    }

    // --------------------------------------------------
    // 3) Montar payload do check-in do quarto
    //    (usa o endpoint /rooms/{room_id}/checkin)
    // --------------------------------------------------
    const payloadCheckin = {
      guestName: checkinForm.guestName,
      guestCPF: checkinForm.guestCPF,
      companions: checkinForm.companions || [],
      checkInDate: toISO(checkinForm.checkInDate),   // dd/mm/yyyy → yyyy-mm-dd
      checkOutDate: toISO(checkinForm.checkOutDate), // dd/mm/yyyy → yyyy-mm-dd
      notes: checkinForm.notes || "",

      companyName: companyName,
      companyId: companyId,
    };

    const resCheckin = await fetch(
      `${baseUrl}/rooms/${checkinForm.selectedRoomId}/checkin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCheckin),
      }
    );

    if (!resCheckin.ok) {
      const body = await resCheckin.json().catch(() => ({}));
      throw new Error(body.detail || "Erro ao realizar check-in do quarto.");
    }

    // --------------------------------------------------
    // 4) Atualizar UI: quartos + dashboard
    // --------------------------------------------------
    await fetchRooms();          // recarrega lista de quartos / disponíveis
    await fetchDashboardData();  // recarrega KPIs do dashboard

    alert("Check-in realizado com sucesso!");

    resetCheckinForm();
    setIsCheckinOpen(false);
  } catch (err: any) {
    console.error(err);
    alert(err.message || "Erro ao finalizar check-in.");
  } finally {
    setIsSubmittingCheckin(false);
  }
};

  
  return (
  <>
    {/* =========================== */}
    {/*      ÁREA DO DASHBOARD     */}
    {/* =========================== */}
    <div className="space-y-3">

      {/* TOPO + BOTÃO */}
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-emphasis">
            Olá, {userName}!
          </h1>
          <p className="text-sm text-muted">
            Aqui está o panorama de hoje para a sua propriedade.
          </p>
        </div>

        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setIsCheckinOpen(true)}
        >
          Fazer Check-in
        </button>
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

      {/* Status + Movimentos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Status dos Quartos" description="Resumo rápido do cenário atual">
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

        <Card title="Movimentos de Hoje" description="Entradas e saídas programadas">
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
                      <span>{movement.guest} • Quarto {movement.room}</span>
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
                      <span>{movement.guest} • Quarto {movement.room}</span>
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
    {/* 🔥 FECHOU O DASHBOARD — AGORA NÃO EXISTE MAIS SPACE-Y AQUI */}

    {/* =========================== */}
    {/*       MODAL DE CHECK-IN     */}
    {/* =========================== */}
    {isCheckinOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
        <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">

          {/* HEADER */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold text-emphasis">Check-in — Selecionar informações</h2>
              <p className="text-sm text-muted">Preencha os dados para concluir o check-in.</p>
              <div className="mt-2 text-sm text-muted font-medium">
                Etapa {checkinStep} de {totalCheckinSteps}
              </div>
            </div>

            <button
              onClick={() => { resetCheckinForm(); setIsCheckinOpen(false); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
            >
              ✕
            </button>
          </div>

          {/* CONTEÚDO - TODAS AS ETAPAS */}
          <div className="p-6">
            <div id="checkin-steps-container">
             
             
{checkinStep === 1 && (
  <div className="space-y-6">

    {/* Pergunta */}
    <div>
      <label className="block text-sm font-medium text-muted-strong mb-2">
        Já tem cadastro?
      </label>

      <div className="flex gap-4">
        {/* SIM */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasGuestAccount"
            value="sim"
            checked={checkinForm.hasGuestAccount === "sim"}
            onChange={() =>
              setCheckinForm(prev => ({
                ...prev,
                hasGuestAccount: "sim",
                searchGuest: "",
                selectedGuestId: null,
                selectedGuestFullData: null,
              }))
            }
          />
          <span>Sim</span>
        </label>

        {/* NÃO */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasGuestAccount"
            value="nao"
            checked={checkinForm.hasGuestAccount === "nao"}
            onChange={() =>
              setCheckinForm(prev => ({
                ...prev,
                hasGuestAccount: "nao",
                guestName: "",
                guestCPF: "",
                guestEmail: "",
                guestPhone: "",
              }))
            }
          />
          <span>Não</span>
        </label>
      </div>
    </div>

    {/* SE SIM → BUSCA */}
    {checkinForm.hasGuestAccount === "sim" && (
      <div>
        <label className="block text-sm font-medium text-muted-strong mb-2">
          Buscar hóspede
        </label>

        <input
          type="text"
          placeholder="Digite nome ou CPF..."
          className="surface-input w-full"
          value={checkinForm.searchGuest}
          onChange={(e) =>
            setCheckinForm(prev => ({
              ...prev,
              searchGuest: e.target.value,
              selectedGuestId: null,
              showSearch: true,
            }))
          }
        />

        {/* DESMARCAR */}
        {checkinForm.selectedGuestId && (
          <button
            type="button"
            className="mt-2 text-sm text-red-500 underline"
            onClick={clearSelectedGuest}
          >
            Desmarcar hóspede
          </button>
        )}

        {/* RESULTADOS */}
        {checkinForm.showSearch &&
          filteredGuests.length > 0 &&
          checkinForm.searchGuest.trim().length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:bg-slate-800">
              {filteredGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={() =>
                    setCheckinForm(prev => ({
                      ...prev,
                      selectedGuestId: guest.id,
                      selectedGuestFullData: guest,

                      guestName: guest.fullName,
                      guestCPF: guest.cpf,
                      guestEmail: guest.email || "",
                      guestPhone: guest.phone || "",

                      selectedGuestName: guest.fullName,
                      selectedGuestCPF: guest.cpf,
                      selectedGuestEmail: guest.email || "",
                      selectedGuestPhone: guest.phone || "",

                      searchGuest: guest.fullName,
                      showSearch: false,
                    }))
                  }
                >
                  <p className="font-medium">{guest.fullName}</p>
                  <p className="text-xs text-muted">{guest.cpf}</p>
                </div>
              ))}
            </div>
          )}
      </div>
    )}

    {/* 🔹 Se NÃO tem cadastro → formulário de novo hóspede */}
                  {checkinForm.hasGuestAccount === "nao" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nome completo */}
                      <label className="flex flex-col space-y-2">
                        <span className="text-sm font-medium">
                          Nome completo *
                        </span>
                        <input
                          type="text"
                          name="guestName"
                          required
                          className="surface-input"
                          placeholder="Ex: João Pereira"
                          value={checkinForm.guestName}
                          onChange={(e) =>
                            setCheckinForm((prev) => ({
                              ...prev,
                              guestName: e.target.value,
                            }))
                          }
                        />
                      </label>

                      {/* CPF */}
                      <label className="flex flex-col space-y-2">
                        <span className="text-sm font-medium">CPF *</span>
                        <input
  type="text"
  name="guestCPF"
  required
  className="surface-input"
  placeholder="000.000.000-00"
  value={checkinForm.guestCPF}
  onChange={(e) => {
    const maskedCPF = maskCPF(e.target.value); // Aplica a máscara
    console.log(maskedCPF); // Verifica o valor da máscara
    setCheckinForm((prev) => ({
      ...prev,
      guestCPF: maskedCPF, // Atualiza o valor no estado
    }));
  }}
/>

                      </label>

                      {/* E-mail */}
                      <label className="flex flex-col space-y-2">
                        <span className="text-sm font-medium">E-mail</span>
                        <input
                          type="email"
                          name="guestEmail"
                          className="surface-input"
                          placeholder="contato@exemplo.com"
                          value={checkinForm.guestEmail}
                          onChange={(e) =>
                            setCheckinForm((prev) => ({
                              ...prev,
                              guestEmail: e.target.value,
                            }))
                          }
                        />
                      </label>

                      {/* Telefone */}
                      <label className="flex flex-col space-y-2">
                        <span className="text-sm font-medium">Telefone</span>
                       <input
  type="text"
  name="guestPhone"
  className="surface-input"
  placeholder="(00) 00000-0000"
  value={checkinForm.guestPhone}
  onChange={(e) =>
    setCheckinForm((prev) => ({
      ...prev,
      guestPhone: maskPhone(e.target.value),
    }))
  }
/>

                      </label>
                    </div>
                  )}
                </div>
              )}


{/* =============================== */}
{/*     ETAPA 2 — ACOMPANHANTES     */}
{/* =============================== */}

{checkinStep === 2 && (
  <div className="space-y-6">
    <h3 className="text-md font-semibold">Acompanhantes</h3>

    {/* Possui acompanhantes? */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-strong">
        Possui acompanhantes?
      </label>

      <div className="flex gap-4">
        {/* SIM */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasCompanions"
            value="sim"
            checked={checkinForm.hasCompanions === "sim"}
            onChange={() =>
              setCheckinForm((prev) => ({
                ...prev,
                hasCompanions: "sim",
              }))
            }
          />
          <span>Sim</span>
        </label>

        {/* NÃO */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasCompanions"
            value="nao"
            checked={checkinForm.hasCompanions === "nao"}
            onChange={() =>
              setCheckinForm((prev) => ({
                ...prev,
                hasCompanions: "nao",
                companionsCount: 0,
                companions: [],
              }))
            }
          />
          <span>Não</span>
        </label>
      </div>
    </div>

    {/* Quantidade de acompanhantes */}
    {checkinForm.hasCompanions === "sim" && (
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-strong">
          Quantidade de acompanhantes
        </label>

        <input
          type="number"
          min="1"
          className="surface-input w-full"
          placeholder="Ex: 2"
          value={checkinForm.companionsCount || ""}
          onChange={(e) => {
            const rawValue = e.target.value;
            const count = rawValue === "" ? 0 : parseInt(rawValue);

            const companions = Array.from(
              { length: count },
              (_, i) => ({
                name: checkinForm.companions[i]?.name || "",
                cpf: checkinForm.companions[i]?.cpf || "",
              })
            );

            setCheckinForm((prev) => ({
              ...prev,
              companionsCount: count,
              companions,
            }));
          }}
        />
      </div>
    )}

    {/* Campos dos acompanhantes */}
    {checkinForm.hasCompanions === "sim" &&
      checkinForm.companions.map((companion, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="text-sm font-medium">
              Nome do acompanhante {index + 1}
            </label>
            <input
              type="text"
              className="surface-input mt-1"
              value={checkinForm.companions[index]?.name || ""}
              onChange={(e) =>
                updateCompanion(index, "name", e.target.value)
              }
              placeholder={`Nome do acompanhante ${index + 1}`}
            />
          </div>

          <div>
            <label className="text-sm font-medium">CPF</label>
            <input
              type="text"
              className="surface-input mt-1"
              value={checkinForm.companions[index]?.cpf || ""}
              onChange={(e) =>
                updateCompanion(index, "cpf", maskCPF(e.target.value))
              }
              placeholder="000.000.000-00"
            />
          </div>
        </div>
      ))}
  </div>
)}

{checkinStep === 3 && (
                <div>
                  <h3 className="text-md font-semibold mb-4">
                    Datas do check-in
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Check-in */}
  <div className="relative w-full">
    {/* Campo de texto visível (dd/mm/yyyy) */}
   <input
  type="text"
  placeholder="dd/mm/yyyy"
  className="surface-input pr-10"
  value={checkinForm.checkInDate}
  onChange={(e) => {
    const formattedDate = maskDateBR(e.target.value);
    setCheckinForm((prev) => ({
      ...prev,
      checkInDate: formattedDate,
    }));
  }}
/>


    {/* Ícone do calendário */}
    <Calendar
      size={18}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 pointer-events-none"
    />

    {/* Input DATE invisível para abrir o calendário */}
    <input
      type="date"
      className="absolute inset-0 opacity-0 cursor-pointer"
      value={toISO(checkinForm.checkInDate)} // Conversão BR → ISO
      onChange={(e) => {
        setCheckinForm((prev) => ({
          ...prev,
          checkInDate: toBR(e.target.value), // Conversão ISO → BR
        }));
      }}
    />
  </div>

  {/* Check-out */}
  <div className="relative w-full">
    <input
      type="text"
      placeholder="dd/mm/yyyy"
      className="surface-input pr-10"
      value={checkinForm.checkOutDate}
      onChange={(e) => {
        const formattedDate = maskDateBR(e.target.value);
        setCheckinForm((prev) => ({
          ...prev,
          checkOutDate: formattedDate,
        }));
      }}
    />

    <Calendar
      size={18}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 pointer-events-none"
    />

    <input
      type="date"
      className="absolute inset-0 opacity-0 cursor-pointer"
      value={toISO(checkinForm.checkOutDate)}
      onChange={(e) => {
        setCheckinForm((prev) => ({
          ...prev,
          checkOutDate: toBR(e.target.value),
        }));
      }}
    />
  </div>
</div>

                </div>
              )}

      
{/* ================================ */}
{/*     ETAPA 4 — EMPRESA            */}
{/* ================================ */}

{checkinStep === 4 && (
  <div className="space-y-6">

    {/* Pergunta principal */}
    <div>
      <label className="block text-sm font-medium mb-2">
        Vincular a uma empresa?
      </label>

      <div className="flex gap-6">
        {/* SIM */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasCompany"
            value="sim"
            checked={checkinForm.hasCompany === "sim"}
            onChange={() =>
              setCheckinForm(prev => ({
                ...prev,
                hasCompany: "sim",
                hasCompanyAccount: null,
                selectedCompanyId: null,
                showCompanySearch: true,
              }))
            }
          />
          <span>Sim</span>
        </label>

        {/* NÃO */}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="hasCompany"
            value="nao"
            checked={checkinForm.hasCompany === "nao"}
            onChange={() =>
              setCheckinForm(prev => ({
                ...prev,
                hasCompany: "nao",
                hasCompanyAccount: null,
                selectedCompanyId: null,
              }))
            }
          />
          <span>Não</span>
        </label>
      </div>
    </div>

    
    {/* Se NÃO tem empresa */}
    {checkinForm.hasCompany === "nao" && (
      <p className="text-sm text-muted">
        Nenhuma empresa será vinculada.
      </p>
    )}

    {/* Se tem empresa, perguntar se já possui cadastro */}
    {checkinForm.hasCompany === "sim" && (
      <div>
        <label className="block text-sm font-medium mb-2">
          A empresa já possui cadastro?
        </label>

        <div className="flex gap-6">
          {/* SIM */}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hasCompanyAccount"
              value="sim"
              checked={checkinForm.hasCompanyAccount === "sim"}
              onChange={() =>
                setCheckinForm(prev => ({
                  ...prev,
                  hasCompanyAccount: "sim",
                }))
              }
            />
            <span>Sim</span>
          </label>

          {/* NÃO */}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hasCompanyAccount"
              value="nao"
              checked={checkinForm.hasCompanyAccount === "nao"}
              onChange={() =>
                setCheckinForm(prev => ({
                  ...prev,
                  hasCompanyAccount: "nao",
                }))
              }
            />
            <span>Não</span>
          </label>
        </div>
      </div>
    )}

    {/* ===================== */}
    {/*   BUSCA DE EMPRESA    */}
    {/* ===================== */}

    {checkinForm.hasCompany === "sim" &&
      checkinForm.hasCompanyAccount === "sim" && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Buscar empresa
          </label>

          {/* Input */}
          <input
            type="text"
            className="surface-input w-full"
            placeholder="Digite o nome ou CNPJ..."
            value={checkinForm.searchCompany || ""}
            onChange={(e) =>
              setCheckinForm(prev => ({
                ...prev,
                searchCompany: e.target.value,
                showCompanySearch: true,
              }))
            }
          />

          {/* Lista */}
          {checkinForm.showCompanySearch &&
            filteredCompanies.length > 0 &&
            checkinForm.searchCompany.trim().length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:bg-slate-800">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() =>
                      setCheckinForm(prev => ({
                        ...prev,
                        selectedCompanyId: company.id,
                        selectedCompanyName: company.name,
                        selectedCompanyCNPJ: company.cnpj,
                        selectedCompanyFullData: company,
                        searchCompany: company.name,
                        showCompanySearch: false,
                      }))
                    }
                  >
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-muted">{company.cnpj}</p>
                  </div>
                ))}
              </div>
            )}

          {/* Desmarcar */}
          {checkinForm.selectedCompanyId && (
            <button
              type="button"
              className="mt-2 text-sm text-red-500 underline"
              onClick={() =>
                setCheckinForm(prev => ({
                  ...prev,
                  selectedCompanyId: "",
                  selectedCompanyName: "",
                  selectedCompanyCNPJ: "",
                  selectedCompanyFullData: null,
                  searchCompany: "",
                  showCompanySearch: true,
                }))
              }
            >
              Desmarcar empresa
            </button>
          )}
        </div>
      )}

    {/* =========================== */}
    {/*  FORMULÁRIO NOVA EMPRESA    */}
    {/* =========================== */}

    {checkinForm.hasCompany === "sim" &&
      checkinForm.hasCompanyAccount === "nao" && (
        <div className="grid gap-6">

          {/* Linha 1 */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              Razão Social *
              <input
                className="surface-input mt-2"
                value={checkinForm.companyName || ""}
                onChange={(e) =>
                  setCheckinForm(prev => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                placeholder="Ex.: Pousada Flor do Sol"
              />
            </label>

            <label className="block text-sm font-medium">
              Responsável *
              <input
                className="surface-input mt-2"
                value={checkinForm.companyResponsible || ""}
                onChange={(e) =>
                  setCheckinForm(prev => ({
                    ...prev,
                    companyResponsible: e.target.value,
                  }))
                }
                placeholder="Nome da pessoa responsável"
              />
            </label>
          </div>

          {/* Linha 2 */}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium">
              CNPJ *
              <input
                className="surface-input mt-2"
                value={checkinForm.companyCNPJ || ""}
                onChange={(e) =>
                  setCheckinForm(prev => ({
                    ...prev,
                    companyCNPJ: maskCNPJ(e.target.value),
                  }))
                }
                placeholder="00.000.000/0000-00"
              />
            </label>

            <label className="block text-sm font-medium">
              E-mail
              <input
                className="surface-input mt-2"
                value={checkinForm.companyEmail || ""}
                onChange={(e) =>
                  setCheckinForm(prev => ({
                    ...prev,
                    companyEmail: e.target.value,
                  }))
                }
                placeholder="contato@empresa.com"
              />
            </label>
          </div>

          {/* Linha 3 */}
          <label className="block text-sm font-medium">
            Telefone
           <input
  className="surface-input mt-2"
  value={checkinForm.companyPhone || ""}    
  onChange={(e) =>
    setCheckinForm(prev => ({
      ...prev,
      companyPhone: maskPhone(e.target.value),
    }))
  }
  placeholder="(00) 00000-0000"
/>

          </label>

        </div>
      )}
  </div>
)}


{/* ================================ */}
{/*     ETAPA 5 — QUARTO            */}
{/* ================================ */}

{checkinStep === 5 && (
  <div className="space-y-6">

    <h3 className="text-md font-semibold">
      Selecionar quarto disponível
    </h3>

    {availableRooms.length === 0 && (
      <p className="text-red-500 text-sm">
        Nenhum quarto disponível no momento.
      </p>
    )}

    {availableRooms.length > 0 && (
      <div className="relative">
        {/* CAMPO VISUAL */}
        <div
          className="surface-input flex items-center justify-between cursor-pointer"
          onClick={() => setIsRoomDropdownOpen(!isRoomDropdownOpen)}
        >
          <span>
            {checkinForm.selectedRoomId
              ? (() => {
                  const r = availableRooms.find(
                    (room) => room.id === checkinForm.selectedRoomId
                  );
                  return r
                    ? `${r.number || r.id} — ${r.description || "Sem descrição"}`
                    : "Selecione um quarto";
                })()
              : "Selecione um quarto"}
          </span>

          <span className="text-slate-500">▾</span>
        </div>

        {/* LISTA */}
        {isRoomDropdownOpen && (
          <div
            className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg z-50"
          >
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => {
                  setCheckinForm((prev) => ({
                    ...prev,
                    selectedRoomId: room.id,
                  }));
                  setIsRoomDropdownOpen(false);
                }}
              >
                <p className="font-medium">
                  {room.number || room.id}
                </p>
                <p className="text-xs text-muted">
                  {room.description || "Sem descrição"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)}


{checkinStep === 6 && (
  <div className="space-y-4">
    
    {/* OBSERVAÇÕES — COMPACTO E PEQUENO */}
    <div>
      <label className="block text-sm font-medium mb-1">
        Observações
      </label>

      <textarea
        className="surface-input w-full h-14 resize-none text-xs"
        placeholder="Digite alguma observação..."
        value={checkinForm.notes}
        onChange={(e) =>
          setCheckinForm((prev) => ({
            ...prev,
            notes: e.target.value,
          }))
        }
      />
    </div>

    {/* RESUMO — SUPER COMPACTADO */}
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/40">
      <h4 className="font-semibold mb-2 text-sm">
        Resumo do Check-in
      </h4>

      <div className="space-y-1.5 text-xs">

        {/* Hóspede */}
        <div>
          <strong>Hóspede:</strong>{" "}
          {checkinForm.hasGuestAccount === "sim"
            ? checkinForm.selectedGuestName || "—"
            : checkinForm.guestName || "—"}
        </div>

        {/* CPF */}
        <div>
          <strong>CPF:</strong>{" "}
          {checkinForm.hasGuestAccount === "sim"
            ? checkinForm.selectedGuestCPF || "—"
            : checkinForm.guestCPF || "—"}
        </div>

        {/* Acompanhantes */}
        <div>
          <strong>Acompanhantes:</strong>{" "}
          {checkinForm.hasCompanions === "nao"
            ? "Nenhum"
            : `${checkinForm.companionsCount} acompanhante(s)`}
        </div>

        {/* Datas */}
        <div>
          <strong>Datas:</strong>{" "}
          Entrada: {checkinForm.checkInDate} — Saída: {checkinForm.checkOutDate}
        </div>

        {/* Empresa */}
        <div>
          <strong>Empresa:</strong>{" "}
          {checkinForm.hasCompany === "nao" && "Nenhuma"}
          {checkinForm.hasCompany === "sim" &&
            checkinForm.hasCompanyAccount === "sim" &&
            (checkinForm.searchCompany || "Empresa selecionada")}
          {checkinForm.hasCompany === "sim" &&
            checkinForm.hasCompanyAccount === "nao" &&
            (checkinForm.companyName || "—")}
        </div>

        {/* Quarto */}
        <div>
          <strong>Quarto:</strong>{" "}
          {(() => {
            const r = availableRooms.find(
              (room) => room.id === checkinForm.selectedRoomId
            );
            return r
              ? `${r.number || r.id} — ${r.description || "Sem descrição"}`
              : "—";
          })()}
        </div>

        {/* Observações */}
        <div>
          <strong>Notas:</strong>{" "}
          {checkinForm.notes || "Nenhuma observação"}
        </div>

      </div>
    </div>
  </div>
)}
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="flex justify-between items-center p-6 border-t border-slate-200 dark:border-slate-800">
            {checkinStep > 1 ? (
              <button className="btn-secondary" onClick={prevStep}>Voltar</button>
            ) : <div></div>}

            <div className="flex gap-3">
              <button className="btn-secondary" onClick={() => { resetCheckinForm(); setIsCheckinOpen(false); }}>
                Cancelar
              </button>

              {checkinStep < totalCheckinSteps && (
                <button className="btn-primary" onClick={nextStep}>Próximo</button>
              )}

              {checkinStep === totalCheckinSteps && (
  <button
    className="btn-primary"
    onClick={handleFinalizeCheckin}
    disabled={isSubmittingCheckin}
  >
    {isSubmittingCheckin ? "Finalizando..." : "Finalizar Check-in"}
  </button>
)}

            </div>
          </div>

        </div>
      </div>
    )}
  </>
);

}

export default DashboardPage;



