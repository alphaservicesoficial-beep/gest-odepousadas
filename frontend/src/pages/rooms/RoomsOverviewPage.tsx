import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Search,
  UploadCloud,
  X,
  Bed,
  Wifi,
  Thermometer,
  Tv,
  Save,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

// 🔹 Importações do Firebase
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  query,
  limit,
  addDoc,
  setDoc,
  where, 
  onSnapshot,
} from "firebase/firestore";

import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { ptBR } from "date-fns/locale";
import { registerLocale } from "react-datepicker";

import { format } from "date-fns";

registerLocale("pt-BR", ptBR);



// 🔹 Tipagem para hóspedes (Guest) e quartos (Room)
type Guest = {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;

  companyName?: string;
  cnpj?: string;

  roomId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;

  checkInStatus?: string;
  checkOutStatus?: string;
  status?: string;
  value?: string;
  notes?: string;

  companions?: {
    name: string;
    cpf: string;
  }[];
};


type Room = {
  id: string;
  identifier: string;
  type: string;
  status: "disponível" | "ocupado" | "reservado" | "manutenção";
  description: string;

  images?: string[];
  // 💡 Campos adicionados para resolver o erro no JSX:
  guest?: string | null; // Nome ou identificador do hóspede (que está no JSX)
  guestNotes?: string | null; 
  
  
  activeReservation?: Guest | null;
// Observações sobre a estadia/hóspede (que está no JSX)
};

type MaintenanceIssue = {
  roomId: string;
  roomIdentifier: string;
  issue: string; // Descrição do problema
  priority: "baixa" | "média" | "alta";
  openedAt: string;
  status: "aberta" | "em andamento" | "concluída";
};

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

// 🔹 Mapeamento de cores do status
const STATUS_TONE = {
  disponível: "success",
  reservado: "info",
  ocupado: "info",
  manutenção: "warning",
} as const satisfies Record<Room["status"], "success" | "info" | "warning">;

// 💡 Lista Completa de Amenidades
const ALL_AMENITIES = [
  "Wi-Fi",
  "Ar-condicionado",
  'TV Smart 43"',
  "Cofre digital",
  "Frigobar",
  "Varanda privativa",
  "Cafeteira de cápsulas",
  "Escrivaninha",
  "Roupeiro amplo",
  "Fechadura eletrônica",
  "Cortinas blackout",
  "Secador de cabelo",
  "Amenities premium",
  "Armários individuais",
  "Mesa compartilhada",
  "Chuveiro pressurizado",
  "Detector de fumaça",
  "Iluminação dimerizável",
  "Lockers individuais",
  "Berço sob demanda",
  "Serviço de quarto 24h",
  "Mini adega",
  "Banheira de hidromassagem",
  "Poltronas de leitura",
];

// 🔹 Configurações de imagens (Mantidas)
type ImageSet = "doubleSingle" | "doubleDouble" | "single";

type RoomSeed = Omit<Room, "images"> & {
  imageSet?: ImageSet;
};

const FALLBACK_IMAGE = "";
const DOUBLE_SINGLE_IMAGE = new URL("", import.meta.url).href;
const DOUBLE_DOUBLE_IMAGE = new URL("", import.meta.url).href;
const SINGLE_IMAGE = new URL("", import.meta.url).href;
const BATHROOM_IMAGE = new URL("", import.meta.url).href;

const IMAGE_SETS: Record<ImageSet, string> = {
  doubleSingle: DOUBLE_SINGLE_IMAGE,
  doubleDouble: DOUBLE_DOUBLE_IMAGE,
  single: SINGLE_IMAGE,
};

// 🔹 Componente RoomImageCarousel (Mantido o original)
type RoomImageCarouselProps = {
  images: string[];
  alt: string;
};

function RoomImageCarousel({ images, alt }: RoomImageCarouselProps) {
  const slides = images.length > 0 ? images : [FALLBACK_IMAGE];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goToPrevious = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
      {slides.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt={`${alt} - imagem ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white shadow backdrop-blur hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white shadow backdrop-blur hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Próxima imagem"
          >
            <ChevronRight size={16} />
          </button>

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrent(index)}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  index === current
                    ? "bg-white"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 🔹 Dados estáticos de quartos (ROOM_DATA - Mantidos)
const ROOM_DATA: RoomSeed[] = [
  // ... (Seus dados de quartos) ...
  {
    id: "RM-105",
    identifier: "105",
    type: "Quarto Família",
    status: "disponível",
    description: "1 cama de casal e 1 de solteiro.",
  },
  {
    id: "RM-106",
    identifier: "106",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Primeiro andar com 2 camas de casal e área de estar. Ideal para famílias maiores ou grupos de amigas.",
  },
  {
    id: "RM-107",
    identifier: "107",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Opção versátil para casais com criança.",
  },
  {
    id: "RM-108",
    identifier: "108",
    type: "Quarto Família",
    status: "manutenção",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Em manutenção preventiva do sistema de climatização.",
  },
  {
    id: "RM-109",
    identifier: "109",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Vista para a piscina e iluminação natural abundante.",
  },
  {
    id: "RM-110",
    identifier: "110",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Ambiente silencioso próximo ao jardim interno.",
  },
  {
    id: "RM-111",
    identifier: "111",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Reservado por família com crianças pequenas.",
  },
  {
    id: "RM-112",
    identifier: "112",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Primeiro andar com 4 camas de solteiro. Perfeito para equipes esportivas ou grupos de amigos.",
  },
  {
    id: "RM-113",
    identifier: "113",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Banheiro renovado com chuveiro com aquecimento a gás.",
  },
  {
    id: "RM-114",
    identifier: "114",
    type: "Quarto Família",
    status: "manutenção",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Passando por revisão elétrica programada.",
  },
  {
    id: "RM-115",
    identifier: "115",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Check-out previsto para amanhã às 11h.",
  },
  {
    id: "RM-116",
    identifier: "116",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Unidade de esquina com melhor ventilação.",
  },
  {
    id: "RM-200",
    identifier: "200",
    type: "Quarto Casal",
    status: "disponível",
    description:
      "Segundo andar com 1 cama de casal. Ambiente planejado para casais em busca de privacidade e conforto.",
  },
  {
    id: "RM-201",
    identifier: "201",
    type: "Quarto Casal",
    status: "ocupado",
    description:
      "Segundo andar com 1 cama de casal. Quarto com vista parcial para o mar, reservado para estadia romântica.",
  },
  {
    id: "RM-202",
    identifier: "202",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Segundo andar com 4 camas de solteiro. Ideal para excursões e grupos corporativos em eventos.",
  },
  {
    id: "RM-203",
    identifier: "203",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Segundo andar com 1 cama de casal e 1 de solteiro. Quartos integrados e preparados para crianças.",
  },
  {
    id: "RM-204",
    identifier: "204",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 1 cama de casal e 1 de solteiro. Banheiro reformado com ducha aquecida e nichos iluminados.",
  },
  {
    id: "RM-205",
    identifier: "205",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Living integrado e bancada para refeições rápidas.",
  },
  {
    id: "RM-206",
    identifier: "206",
    type: "Quarto Família",
    status: "manutenção",
    description:
      "Segundo andar com 2 camas de casal. Passando por manutenção preventiva do sistema hidráulico.",
  },
  {
    id: "RM-207",
    identifier: "207",
    type: "Quarto Grupo",
    status: "ocupado",
    description:
      "Segundo andar com 4 camas de solteiro. Reservado por equipe esportiva em competição regional.",
  },
  {
    id: "RM-208",
    identifier: "208",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Sacada com vista panorâmica e kit de boas-vindas diferenciado.",
  },
  {
    id: "RM-209",
    identifier: "209",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Destaque para a iluminação natural e área de leitura.",
  },
  {
    id: "RM-210",
    identifier: "210",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Segundo andar com 3 camas de solteiro. Projetado para viajantes solo que desejam compartilhar a mesma suíte.",
  },
  {
    id: "RM-211",
    identifier: "211",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Segundo andar com 2 camas de casal. Estadia de longa duração com serviço de limpeza personalizado.",
  },
  {
    id: "RM-301",
    identifier: "301",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Espaço amplo com vista para o mar, ideal para grupos de viagem.",
  },
  {
    id: "RM-302",
    identifier: "302",
    type: "Quarto Grupo",
    status: "ocupado",
    description:
      "Terceiro andar com 4 camas de solteiro. Reservado por grupo de executivos em evento regional.",
  },
  {
    id: "RM-303",
    identifier: "303",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Layout flexível, com cabeceiras independentes e iluminação individual.",
  },
  {
    id: "RM-304",
    identifier: "304",
    type: "Quarto Grupo",
    status: "manutenção",
    description:
      "Terceiro andar com 4 camas de solteiro. Em manutenção preventiva da iluminação decorativa.",
  },
  {
    id: "RM-305",
    identifier: "305",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Terceiro andar com 2 camas de casal. Sacada com vista privilegiada e banheira de hidromassagem.",
  },
  {
    id: "RM-306",
    identifier: "306",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Terceiro andar com 2 camas de casal. Reservado por família em estadia de férias prolongada.",
  },
  {
    id: "RM-307",
    identifier: "307",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Perfeito para eventos de confraternização e retiros corporativos.",
  },
  {
    id: "RM-308",
    identifier: "308",
    type: "Quarto Família",
    status: "manutenção",
    description:
      "Terceiro andar com 2 camas de casal. Revisão programada do sistema de climatização central.",
  },
  {
    id: "RM-309",
    identifier: "309",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Terceiro andar com 2 camas de casal. Destaque para o living integrado com vista para o pôr do sol.",
  },
  {
    id: "RM-310",
    identifier: "310",
    type: "Quarto Família",
    status: "ocupado",
    description:
      "Terceiro andar com 2 camas de casal. Reservado para casamento com decoração especial e amenities de boas-vindas.",
  },
  {
    id: "RM-311",
    identifier: "311",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Equipado com tomadas individuais e iluminação em LED nos painéis.",
  },
  {
    id: "RM-312",
    identifier: "312",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Opção flexível com decoração em tons neutros e iluminação natural.",
  },
];




const ROOMS: Room[] = ROOM_DATA.map((room) => {
  const images: string[] = [];
  if (room.imageSet) {
    images.push(IMAGE_SETS[room.imageSet]);
  }
  images.push(BATHROOM_IMAGE);

  return {
    ...room,
    images,
  };
});

const ROOM_TYPES = Array.from(new Set(ROOMS.map((room) => room.type))).sort(
  (a, b) => a.localeCompare(b, "pt-BR")
);

// 💡 Função para preencher o Firestore se a coleção 'rooms' estiver vazia (Mantida)
async function seedRoomsIfEmpty() {
  try {
    const roomsRef = collection(db, "rooms");

    const checkQuery = query(roomsRef, limit(1));
    const checkSnap = await getDocs(checkQuery);

    if (!checkSnap.empty) {
      console.log("Firestore 'rooms' já está populado. Seeding ignorado.");
      return;
    }

    console.log("Firestore 'rooms' está vazio. Iniciando Seeding com ROOMS...");

    const batch = writeBatch(db);

    ROOMS.forEach((room) => {
      const docRef = doc(roomsRef, room.id);

      const initialStatus =
        room.status === "manutenção" ? "manutenção" : "disponível";

      const { id, ...dataToSave } = room;

      batch.set(docRef, {
        ...dataToSave,
        images: room.images || [],
        status: initialStatus,
      });
    });

    await batch.commit();
    console.log("Seeding da coleção 'rooms' concluído com sucesso.");
  } catch (error) {
    console.error("Erro durante o seeding inicial da coleção 'rooms':", error);
  }
}

// ====================================================
// 🔹 COMPONENTES DE MODAL EXTRAÍDOS (Para evitar re-render/perda de foco)
// ====================================================

// 🔹 RoomDetailsModal (Extraído)
function RoomDetailsModal({
  selectedRoom,
  setSelectedRoom,
  setEditingRoom,
  setMaintenanceRoom,
  setMaintenanceForm,
  guests,     // ✔ AGORA RECEBE A PROP
}: {
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  setEditingRoom: (room: Room | null) => void;
  setMaintenanceRoom: (room: Room | null) => void;
  setMaintenanceForm: React.Dispatch<
    React.SetStateAction<{
      issue: string;
      priority: "baixa" | "média" | "alta";
    }>
  >;
  guests: Guest[];  // ✔ TIPAGEM CORRETA
}) {


  if (!selectedRoom) return null;

  const active = selectedRoom?.activeReservation || null;


  // Busca a reserva ativa deste quarto
// 🔥 Reserva ativa REAL (única que deve aparecer)

// Busca a reserva ativa deste quarto


  // 🔥 Reserva ativa do quarto

  // Funções auxiliares para ícones (mantidas)
  const amenityIcons: Record<string, JSX.Element> = {
    "wi-fi": <Wifi size={18} className="text-primary" />,
    "ar-condicionado": <Thermometer size={18} className="text-primary" />,
    tv: <Tv size={18} className="text-primary" />,
    cama: <Bed size={18} className="text-primary" />,
    frigobar: <Tv size={18} className="text-primary" />,
    cofre: <Tv size={18} className="text-primary" />,
  };

  const getAmenityIcon = (amenity: string) => {
    const key = amenity.toLowerCase().split(/[\s-]/).slice(0, 2).join(" ");

    if (key.includes("wi")) return amenityIcons["wi-fi"];
    if (key.includes("ar")) return amenityIcons["ar-condicionado"];
    if (key.includes("tv")) return amenityIcons["tv"];
    if (key.includes("frigobar")) return amenityIcons["frigobar"];
    if (key.includes("cofre")) return amenityIcons["cofre"];

    return amenityIcons["cama"];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950">
        <div className="flex justify-end p-3">
          <button
            type="button"
            onClick={() => setSelectedRoom(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/60 text-white shadow backdrop-blur hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Fechar detalhes do quarto"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Quarto {selectedRoom.identifier}
            </h2>
            <StatusBadge
              label={selectedRoom.status}
              status={STATUS_TONE[selectedRoom.status]}
            />
          </div>
          <p className="mt-1 text-lg font-medium text-primary">
            {selectedRoom.type}
          </p>

          <hr className="my-4 border-slate-200 dark:border-slate-800" />

          <h3 className="text-md font-semibold text-emphasis">Descrição</h3>
          <p className="mt-1 text-sm text-muted-strong">
            {selectedRoom.description}
          </p>


{/* =============================== */}
{/*      HÓSPEDE / ACOMP / EMPRESA   */}
{/* =============================== */}

{/* HÓSPEDE */}
<p className="mt-6 text-xs uppercase text-muted-soft">Hóspede</p>
<p className="text-sm">
  {active?.fullName || selectedRoom.guest || "—"}
</p>

{/* ACOMPANHANTES */}
<p className="mt-6 text-xs uppercase text-muted-soft">Acompanhantes</p>

{!active?.companions || active.companions.length === 0 ? (
  <p className="text-sm">Nenhum</p>
) : (
  <div className="mt-1 text-sm space-y-1">
  {active.companions.map((c, i) => (
    <div key={i}>{c.name} – {c.cpf}</div>
  ))}
</div>

)}

{/* EMPRESA */}
<p className="mt-6 text-xs uppercase text-muted-soft">Empresa</p>
<p className="text-sm">
  {active?.companyName || "—"}
</p>




          <div className="mt-6 flex gap-3">
            <button
              className="btn-secondary flex-auto"
              onClick={() => {
                setSelectedRoom(null);
                setEditingRoom(selectedRoom);
              }}
            >
              Editar
            </button>
            <button
              className="btn-outline-danger flex-auto" // Mantido vermelho
              onClick={() => {
                setSelectedRoom(null);
                setMaintenanceRoom(selectedRoom);
                setMaintenanceForm({ issue: "", priority: "média" });
              }}
              disabled={selectedRoom.status === "manutenção"}
            >
              Abrir Manutenção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🔹 MaintenanceModal (Extraído e com o Botão Vermelho Correto)
function MaintenanceModal({
  maintenanceRoom,
  maintenanceForm,
  setMaintenanceForm,
  setMaintenanceRoom,
  handleMaintenanceSubmit,
}: {
  maintenanceRoom: Room | null;
  maintenanceForm: { issue: string; priority: "baixa" | "média" | "alta" };
  setMaintenanceForm: React.Dispatch<
    React.SetStateAction<{
      issue: string;
      priority: "baixa" | "média" | "alta";
    }>
  >;
  setMaintenanceRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  handleMaintenanceSubmit: (event: FormEvent) => Promise<void>;
}) {
  if (!maintenanceRoom) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-[28rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-emphasis">
              Abrir Manutenção - Quarto {maintenanceRoom.identifier}
            </h2>
            <p className="text-sm text-muted">
              O status será alterado para **Manutenção** e o quarto ficará
              indisponível.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceRoom(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleMaintenanceSubmit}>
          <label className="block text-sm font-medium text-muted-strong">
            Descrição do Problema (Obrigatório)
            <textarea
              required
              value={maintenanceForm.issue}
              onChange={(event) =>
                // O problema de foco foi corrigido pela extração do componente
                setMaintenanceForm((prev) => ({
                  ...prev,
                  issue: event.target.value,
                }))
              }
              rows={4}
              placeholder="Descreva o defeito (ex: Vazamento no chuveiro, Ar-condicionado não gela, TV não liga)"
              className="surface-input mt-2 resize-none"
            />
          </label>

          <label className="block text-sm font-medium text-muted-strong">
            Prioridade do Reparo
            <select
              required
              value={maintenanceForm.priority}
              onChange={(event) =>
                setMaintenanceForm((prev) => ({
                  ...prev,
                  priority: event.target.value as "baixa" | "média" | "alta",
                }))
              }
              className="surface-input mt-2"
            >
              <option value="baixa">Baixa (Pode esperar)</option>
              <option value="média">Média (Ideal resolver logo)</option>
              <option value="alta">Alta (Urgente, compromete o uso)</option>
            </select>
          </label>

          <div className="pt-4">
            {/* 🎯 CORREÇÃO: Usando btn-danger (vermelho) */}
            <button
              type="submit"
              className="btn-danger w-full gap-2 transition-transform active:scale-[0.99]"
            >
              <UploadCloud size={18} />
              Abrir Chamado e Indisponibilizar Quarto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 🔹 EditModal (Extraído)
function EditModal({
  editingRoom,
  setEditingRoom,
  handleEditSubmit,
  ALL_AMENITIES,
  ROOM_TYPES,
}: {
  editingRoom: Room | null;
  setEditingRoom: React.Dispatch<React.SetStateAction<Room | null>>;
  handleEditSubmit: (event: FormEvent) => Promise<void>;
  ALL_AMENITIES: string[];
  ROOM_TYPES: string[];
}) {
  if (!editingRoom) return null;

  // Funções internas (handleAmenityChange) permanecem iguais, mas agora definidas dentro do EditModal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-emphasis">
              Editar Quarto {editingRoom.identifier}
            </h2>
            <p className="text-sm text-muted">
              Atualize os detalhes, status e amenidades do quarto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditingRoom(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
            aria-label="Fechar modal de edição"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form className="mt-6 space-y-0" onSubmit={handleEditSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-muted-strong">
              Tipo de Quarto
              <select
                required
                value={editingRoom.type}
                onChange={(event) =>
                  setEditingRoom((prev) =>
                    prev ? { ...prev, type: event.target.value } : null
                  )
                }
                className="surface-input mt-2"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-muted-strong">
              Status Atual
              <select
                required
                value={editingRoom.status}
                onChange={(event) =>
                  setEditingRoom((prev) =>
                    prev
                      ? {
                          ...prev,
                          status: event.target.value as Room["status"],
                        }
                      : null
                  )
                }
                className="surface-input mt-2"
              >
                <option value="disponível">Disponível</option>
                <option value="ocupado" disabled>
                  Ocupado (Automático)
                </option>
                <option value="reservado" disabled>
                  Reservado (Automático)
                </option>
                <option value="manutenção">Manutenção</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-muted-strong">
            Descrição
            <textarea
              required
              value={editingRoom.description}
              onChange={(event) =>
                setEditingRoom((prev) =>
                  prev ? { ...prev, description: event.target.value } : null
                )
              }
              rows={3}
              placeholder="Descrição detalhada do quarto e suas características."
              className="surface-input mt-2 resize-none"
            />
          </label>

          <div className="pt-4">
            <button type="submit" className="btn-primary w-full gap-2">
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====================================================
// 🚨 COMPONENTE PRINCIPAL RoomsOverviewPage
// ====================================================
export default function RoomsOverviewPage() {


  
  const [searchTerm, setSearchTerm] = useState("");

  // Lista de empresas (vinda da API)
const [companies, setCompanies] = useState<any[]>([]);

const [showGuestList, setShowGuestList] = useState(false);



  const [guests, setGuests] = useState<Guest[]>([]);
const [registeredGuests, setRegisteredGuests] = useState<Guest[]>([]);
  
  const [rooms, setRooms] = useState<Room[]>([]);

  // Datas padrão do check-in (hoje) e check-out (amanhã)
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // --- Estado do modal de Check-in ---
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [checkinRoom, setCheckinRoom] = useState<Room | null>(null);

  // 🔥 ESTADOS PARA CHECK-OUT
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null);
  const [checkoutReservation, setCheckoutReservation] = useState<any | null>(
    null
  );

  // 🔹 Controle de etapas do check-in
  const [checkinStep, setCheckinStep] = useState(1);
  const totalCheckinSteps = 5;

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

  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    Room["status"] | undefined
  >();

  // Estado para o modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Estado para o modal de detalhes
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Estado para o modal de Edição
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Estado para o modal de Manutenção
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState<{
    issue: string;
    priority: "baixa" | "média" | "alta";
  }>({
    issue: "",
    priority: "média",
  });

  const [createForm, setCreateForm] = useState({
    identifier: "",
    type: "",
    status: "disponível" as Room["status"],
    description: "",
  });
  const [createImages, setCreateImages] = useState<File[]>([]);


  const initialCheckinState = {
  // 🔹 Dados do hóspede
  hasGuestAccount: null as "sim" | "nao" | null,
  guestName: "",
  guestCPF: "",
  guestEmail: "",
  guestPhone: "",

  // 🔹 Acompanhantes
  hasCompanions: "nao" as "sim" | "nao",
  companionsCount: 0,
  companions: [] as { name: string; cpf: string }[],

  // 🔹 Empresa vinculada
  hasCompany: "nao" as "sim" | "nao", // se o hóspede está vinculado a uma empresa
  companyName: "",
  companyResponsible: "",
  companyCNPJ: "",
  companyEmail: "",
  companyPhone: "",
  hasCompanyAccount: null as "sim" | "nao" | null,
  searchCompany: "", // telefone da empresa

  // 🔹 IDs de vínculo
  selectedCompanyId: null as string | null,
  selectedCompanyName: "",
  selectedCompanyCNPJ: "",

  searchGuest: "",
  selectedGuestId: null as string | null,
  selectedGuestName: "",
  selectedGuestCPF: "",
  selectedGuestEmail: "",
  selectedGuestPhone: "",
  selectedGuestFullData: null as Guest | null,

  showSearch: true,
  showCompanySearch: true,

  // 🔹 Dados de estadia
  // Datas já preenchidas automaticamente, formatadas para dd/mm/yyyy
  checkInDate: toBR(new Date().toISOString().split("T")[0]),
  checkOutDate: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toBR(tomorrow.toISOString().split("T")[0]);
  })(),

  notes: "",
};


  const [checkinForm, setCheckinForm] = useState({


   
    // 🔹 Dados do hóspede
    hasGuestAccount: null as "sim" | "nao" | null,
    guestName: "",
    guestCPF: "",
    guestEmail: "",
    guestPhone: "",

    


    // 🔹 Acompanhantes
    hasCompanions: "nao" as "sim" | "nao",
    companionsCount: 0,
    companions: [] as { name: string; cpf: string }[],

    // 🔹 Empresa vinculada
    hasCompany: "nao" as "sim" | "nao", // se o hóspede está vinculado a uma empresa
    companyName: "",
    companyResponsible: "",
    companyCNPJ: "",
    companyEmail: "",
    companyPhone: "",
    hasCompanyAccount: null as "sim" | "nao" | null,
    searchCompany: "", // telefone da empresa

    // 🔹 IDs de vínculo

    selectedCompanyId: null as string | null,

    selectedCompanyName: "",
selectedCompanyCNPJ: "",


searchGuest: "",
selectedGuestId: null as string | null,
selectedGuestName: "",
selectedGuestCPF: "",
selectedGuestEmail: "",
selectedGuestPhone: "",

selectedGuestFullData: null as Guest | null,



showSearch: true,
showCompanySearch: true,


    // 🔹 Dados de estadia
    // Datas já preenchidas automaticamente
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    })(),

    notes: "",
  
    
  });

 
 
  const resetCheckinForm = () => {
    setCheckinForm(initialCheckinState);
    setCheckinStep(1);
  };
  

  const filteredCompanies = useMemo(() => {
    const term = checkinForm.searchCompany?.toLowerCase() || "";
  
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.cnpj?.toLowerCase().includes(term) ||
        c.responsible?.toLowerCase().includes(term)
    );
  }, [companies, checkinForm.searchCompany]);
  

  // FILTRO DE HÓSPEDES PARA AUTOCOMPLETE
const filteredGuests = useMemo(() => {
  const term = checkinForm.searchGuest?.toLowerCase() || "";

  if (!term) return [];

  return registeredGuests.filter(
    (g) =>
      g.fullName?.toLowerCase().includes(term) ||
      g.cpf?.toLowerCase().includes(term)
  );
}, [registeredGuests, checkinForm.searchGuest]);


  const updateCompanion = (
    index: number,
    field: "name" | "cpf",
    value: string
  ) => {
    setCheckinForm((prev) => {
      const updated = [...prev.companions];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return { ...prev, companions: updated };
    });
  };


 
function selectGuest(guest: any) {
  setCheckinForm((prev) => ({
    ...prev,

    // 🔹 IDs e dados de seleção
    selectedGuestId: guest.id,
    selectedGuestFullData: guest,
    searchGuest: guest.fullName,
    
    // 🔹 Preenche os CAMPOS PRINCIPAIS do formulário
    guestName: guest.fullName,
    guestCPF: guest.cpf,
    guestEmail: guest.email || "",
    guestPhone: guest.phone || "",

    // 🔹 Mantém também os “selected” se você usa no resumo
    selectedGuestName: guest.fullName,
    selectedGuestCPF: guest.cpf,
    selectedGuestEmail: guest.email || "",
    selectedGuestPhone: guest.phone || "",

    showSearch: false,
  }));
}


function selectCompany(company: any) {
  setCheckinForm((prev) => ({
    ...prev,
    selectedCompanyId: company.id,
    selectedCompanyName: company.name,
    selectedCompanyCNPJ: company.cnpj,
    selectedCompanyFullData: company,
    searchCompany: `${company.name}`,
    showCompanySearch: false,
  }));
}


function clearSelectedGuest() {
  setCheckinForm((prev) => ({
    ...prev,
    selectedGuestId: null,
    selectedGuestName: "",
    selectedGuestCPF: "",
    selectedGuestEmail: "",
    selectedGuestPhone: "",
    selectedGuestFullData: null,
    searchGuest: "",
    guestName: "",
    guestCPF: "",
    guestEmail: "",
    guestPhone: "",
    showSearch: true,
  }));
}


function clearSelectedCompany() {
  setCheckinForm((prev) => ({
    ...prev,
    selectedCompanyId: "",
    selectedCompanyName: "",
    selectedCompanyCNPJ: "",
    selectedCompanyFullData: null,
    searchCompany: "",
    showCompanySearch: true,
  }));
}




  // 🔹 Converte dd/mm/aaaa → yyyy-mm-dd (para usar no input type="date")
  function maskDateBR(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .slice(0, 10);
  }

  function toBR(date: string) {
  if (!date) return "";
  const [yyyy, mm, dd] = date.split("-");
  return `${dd}/${mm}/${yyyy}`;
}


  function toISO(date: string) {
    if (!date) return "";
    const parts = date.split("/");
    if (parts.length !== 3) return "";
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }

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

  // Carrega empresas quando abrir o modal de check-in
// Carrega empresas E HÓSPEDES CADASTRADOS quando abrir o modal de check-in
useEffect(() => {
  if (!isCheckinOpen) return;

  // 🔹 Empresas
  fetch(`${baseUrl}/companies`)
    .then((res) => res.json())
    .then((data) => setCompanies(data))
    .catch((err) => console.error("Erro ao carregar empresas:", err));

  // 🔹 Hóspedes cadastrados (tela de "Gerenciar Hóspedes")
  fetch(`${baseUrl}/guests`)
    .then((res) => res.json())
    .then((data) => setRegisteredGuests(data))
    .catch((err) => console.error("Erro ao carregar hóspedes cadastrados:", err));
}, [isCheckinOpen]);



  // 🔹 Controle de Scroll do Body (CORREÇÃO DO BUG)
  useEffect(() => {
    const anyModalOpen =
      selectedRoom ||
      maintenanceRoom ||
      isCreateModalOpen ||
      editingRoom ||
      isCheckinOpen;

    if (anyModalOpen) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");

    return () => document.body.classList.remove("overflow-hidden");
  }, [
    selectedRoom,
    maintenanceRoom,
    isCreateModalOpen,
    editingRoom,
    isCheckinOpen,
  ]);

  // 🔹 Função para recarregar apenas os quartos após uma mudança (Mantida)
  async function reloadRooms() {
    // Busca quartos E reservas ao mesmo tempo
    const [roomSnap, reservationSnap] = await Promise.all([
      getDocs(collection(db, "rooms")),
      getDocs(collection(db, "reservations")),
    ]);
  
    // Monta lista de quartos
    const roomData: Room[] = roomSnap.docs.map((docSnap) => {
  const data = docSnap.data() as any;
  return {
    id: docSnap.id,
    identifier: data.identifier || "",
    type: data.type || "",
    status: data.status || "disponível",
    description: data.description || "",
    images: data.images || [],

    guest: data.guest || "",
    guestNotes: data.guestNotes || "",

    // 🔥 CAMPOS NOVOS QUE PRECISAM VIR DO FIRESTORE
    companions: data.companions || [],
    companyName: data.companyName || "",
    companyCNPJ: data.companyCNPJ || "",
    companyId: data.companyId || null,
  } as Room;
});

    // Monta lista de "hóspedes/reservas" igual você faz no loadData
    const reservationData: Guest[] = reservationSnap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        id: docSnap.id,
        fullName: data.guestName ?? data.fullName ?? "",
        companyName: data.companyName ?? "",
        cpf: data.guestCPF ?? data.cpf ?? "",
        cnpj: data.cnpj ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        roomId: data.roomId ?? "",
        roomNumber: data.roomNumber ?? "",
        checkIn: data.checkIn ?? "",
        checkOut: data.checkOut ?? "",
        guests: data.guests ?? 1,
        checkInStatus: data.checkInStatus ?? "",
        checkOutStatus: data.checkOutStatus ?? "",
        status: data.status ?? "",
        value: data.value ?? "",
        notes: data.notes ?? "",
      } as Guest;
    });
  
    // Atualiza o estado de guests também
    setGuests(reservationData);
  
    // Calcula o status/guest correto e atualiza rooms
    const updatedRooms = updateRoomStatuses(roomData, reservationData);
    setRooms(updatedRooms);
  }
  

  // 🔹 Função que define o status do quarto com base nas reservas (Mantida)
  function toStartOfDay(v: any) {
    if (!v) return null;
    const d =
      typeof v?.seconds === "number"
        ? new Date(v.seconds * 1000)
        : typeof v === "string"
        ? new Date(v)
        : v instanceof Date
        ? new Date(v)
        : null;
    if (!d || isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function updateRoomStatuses(roomsList: Room[], guestList: Guest[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    return roomsList.map((room) => {
     const resGuest = guestList.find(
  (g) =>
    g.roomId === room.id &&
    g.checkOutStatus === "pendente"
);

  
      // Sempre mostrar o nome do hóspede — nunca o da empresa
      const displayName =
        resGuest?.fullName ||
        
        room.guest ||
        "";
  
      const displayNotes = resGuest?.notes ?? room.guestNotes ?? "";
  
      if (
        room.status === "manutenção" ||
        room.status === "ocupado" ||
        room.status === "disponível"
      ) {
        return { ...room, guest: displayName, guestNotes: displayNotes };
      }
  
      if (resGuest) {
        const checkIn = toStartOfDay(resGuest.checkIn);
        const checkOut = toStartOfDay(resGuest.checkOut);
  
        if (checkIn && checkOut) {
          if (today > checkIn && today <= checkOut) {
            return {
              ...room,
              status: "ocupado" as const,
              guest: displayName,
              guestNotes: displayNotes,
            };
          }
          if (today <= checkIn) {
            return {
              ...room,
              status: "reservado" as const,
              guest: displayName,
              guestNotes: displayNotes,
            };
          }
        }
      }
  
      return {
        ...room,
        status: "disponível" as const,
        guest: room.guest ?? "",
        guestNotes: room.guestNotes ?? "",
      };
    });
  }
  

  // 🔹 Carregar hóspedes e quartos (Mantida)
  // 🔹 Carregar hóspedes e quartos
  // ✅ Atualiza lista de quartos em tempo real (sem F5)
  useEffect(() => {
    async function loadData() {
      await seedRoomsIfEmpty();

      // 🔹 Buscar reservas (uma vez)
      const reservationSnap = await getDocs(collection(db, "reservations"));
      const reservationData: Guest[] = reservationSnap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, any>;
        return {
          id: docSnap.id,
          fullName: data.guestName ?? data.fullName ?? "",
          companyName: data.companyName ?? "",
          cpf: data.cpf ?? "",
          cnpj: data.cnpj ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          roomId: data.roomId ?? "",
          roomNumber: data.roomNumber ?? "",
          checkIn: data.checkIn ?? "",
          checkOut: data.checkOut ?? "",
          guests: data.guests ?? 1,

          value: data.value ?? "",
          notes: data.notes ?? "",

          // 🔹 CAMPOS NOVOS VINDOS DO FIRESTORE
          checkInStatus: data.checkInStatus ?? "",
          checkOutStatus: data.checkOutStatus ?? "",
          status: data.status ?? "",
        } as Guest;
      });

      setGuests(reservationData);

      // 🔹 Escutar alterações em tempo real no Firestore
      const roomsRef = collection(db, "rooms");
      const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
        const roomData: Room[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;
          return {
            id: docSnap.id,
            identifier: data.identifier || docSnap.id.split("-").pop() || "000",
            type: data.type || "Desconhecido",
            status: (data.status ?? "disponível") as Room["status"],
            description: data.description || "",

            images: data.images || [],
            guest: data.guest || "",
            guestNotes: data.guestNotes || "",
          };
        });

        // 🔸 Atualiza o estado automaticamente
        const updatedRooms = updateRoomStatuses(roomData, reservationData);
        setRooms(updatedRooms);
      });

      // 🔹 Escutar alterações nas reservas em tempo real também
      const resRef = collection(db, "reservations");

      const unsubRes = onSnapshot(resRef, (snap) => {
        const reservationDataRealtime: Guest[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, any>;

          return {
            id: docSnap.id,

            // --- Identificação ---
            fullName: data.guestName ?? data.fullName ?? "",
            companyName: data.companyName ?? "",
            cpf: data.guestCPF ?? data.cpf ?? "",
            cnpj: data.cnpj ?? "",

            email: data.email ?? "",
            phone: data.phone ?? "",

            // --- Hospedagem ---
            roomId: data.roomId ?? "",
            roomNumber: data.roomNumber ?? "",
            checkIn: data.checkIn ?? "",
            checkOut: data.checkOut ?? "",
            guests: data.guests ?? 1,
            checkInStatus: data.checkInStatus ?? "",
            checkOutStatus: data.checkOutStatus ?? "",
            status: data.status ?? "",

            // --- Financeiro / Observações ---
            value: data.value ?? "",
            notes: data.notes ?? "",
          } as Guest;
        });

        setGuests(reservationDataRealtime);
      });

      // limpa listener ao sair da página
      return () => {
        unsubscribe();
        unsubRes();
      };
    }

    loadData();
  }, []);

  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.identifier.toLowerCase().includes(normalizedSearch) ||
        room.description.toLowerCase().includes(normalizedSearch);

      const matchesType = !typeFilter || room.type === typeFilter;
      const matchesStatus = !statusFilter || room.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter, rooms]);

  // ----------------------------------------------------
  // 🔹 LÓGICA DE SUBMISSÃO DA MANUTENÇÃO (Mantida)
  // ----------------------------------------------------
  const handleMaintenanceSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!maintenanceRoom) return;

    try {
      // Envia a manutenção para o backend
      const response = await fetch(`${baseUrl}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: maintenanceRoom.id,
          roomIdentifier: maintenanceRoom.identifier,
          issue: maintenanceForm.issue,
          priority: maintenanceForm.priority,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Erro ao criar manutenção");
      }

      // Fecha o modal e limpa o formulário
      setMaintenanceRoom(null);
      setMaintenanceForm({ issue: "", priority: "média" });

      // Atualiza os quartos (o backend já marcou o status como 'manutenção')
      await reloadRooms();
      setMaintenanceRoom(null);
      alert("✅ Manutenção registrada e quarto atualizado!");
    } catch (error) {
      console.error("Erro ao abrir chamado de manutenção:", error);
      alert("Erro ao registrar a manutenção. Tente novamente.");
    }
  };

  // ----------------------------------------------------
  // 🔹 LÓGICA DE SUBMISSÃO DA EDIÇÃO (Mantida)
  // ----------------------------------------------------
  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingRoom) return;

    const form = editingRoom;

    try {
      const roomRef = doc(db, "rooms", form.id);

      const dataToUpdate = {
        identifier: form.identifier,
        type: form.type,
        status: form.status,
        description: form.description,
      };

      await updateDoc(roomRef, dataToUpdate);

      console.log(`Quarto ${form.identifier} atualizado com sucesso.`);

      await reloadRooms();
      setEditingRoom(null);
    } catch (error) {
      console.error("Erro ao editar quarto:", error);
      alert("Erro ao salvar as alterações. Tente novamente.");
    }
  };


 const handleCheckinSubmit = async () => {
  if (!checkinRoom) return;

  try {
    let guestId = "";

    // ---------------------------------------------------------
    // ✔ SE O HÓSPEDE JÁ TEM CADASTRO
    // ---------------------------------------------------------
    if (checkinForm.hasGuestAccount === "sim" && checkinForm.selectedGuestId) {
      guestId = checkinForm.selectedGuestId;

      const guestRef = doc(db, "guests", guestId);

      await setDoc(
        guestRef,
        {
          fullName: checkinForm.selectedGuestName,
          cpf: checkinForm.selectedGuestCPF,
          email: checkinForm.selectedGuestEmail,
          phone: checkinForm.selectedGuestPhone,

          companions: checkinForm.companions || [],
          companyId: checkinForm.selectedCompanyId || null,

          roomId: checkinRoom.id,
          roomNumber: checkinRoom.identifier,
          checkIn: new Date().toISOString(),
          guests: (checkinForm.companions?.length || 0) + 1,

          notes: checkinForm.notes || "",
        },
        { merge: true }
      );

      // Atualiza quarto no Firestore
      const roomRef = doc(db, "rooms", checkinRoom.id);
      await updateDoc(roomRef, {
        guest: checkinForm.selectedGuestName,
        guestId,
        companions: checkinForm.companions || [],
        guestNotes: checkinForm.notes || "",
        status: "ocupado",
      });
    }

    // ---------------------------------------------------------
    // ✔ SE É UM HÓSPEDE NOVO
    // ---------------------------------------------------------
    if (checkinForm.hasGuestAccount === "nao") {
      const guestRef = await addDoc(collection(db, "guests"), {
        fullName: checkinForm.guestName,
        cpf: checkinForm.guestCPF,
        email: checkinForm.guestEmail,
        phone: checkinForm.guestPhone,
        createdAt: new Date().toISOString(),
      });

      guestId = guestRef.id;

      const roomRef = doc(db, "rooms", checkinRoom.id);
      await updateDoc(roomRef, {
        guest: checkinForm.guestName,
        guestId,
      });
    }

    // ---------------------------------------------------------
    // ✔ EMPRESA NOVA → criar no Firestore
    // ---------------------------------------------------------
    let companyId = checkinForm.selectedCompanyId;

    if (checkinForm.hasCompany === "sim" && checkinForm.hasCompanyAccount === "nao") {
      const companyRef = await addDoc(collection(db, "companies"), {
        name: checkinForm.companyName,
        responsible: checkinForm.companyResponsible,
        cnpj: checkinForm.companyCNPJ,
        email: checkinForm.companyEmail,
        phone: checkinForm.companyPhone,
        createdAt: new Date().toISOString(),
      });

      companyId = companyRef.id;
      checkinForm.selectedCompanyId = companyId;
    }

    // ---------------------------------------------------------
    // 🔥 VARIÁVEIS FINAIS (dependem se é hóspede novo ou cadastrado)
    // ---------------------------------------------------------
    const finalGuestName =
      checkinForm.hasGuestAccount === "sim"
        ? checkinForm.selectedGuestName || ""
        : checkinForm.guestName || "";

    const finalGuestCPF =
      checkinForm.hasGuestAccount === "sim"
        ? checkinForm.selectedGuestCPF || ""
        : checkinForm.guestCPF || "";

    const finalGuestEmail =
      checkinForm.hasGuestAccount === "sim"
        ? checkinForm.selectedGuestEmail || ""
        : checkinForm.guestEmail || "";

    const finalGuestPhone =
      checkinForm.hasGuestAccount === "sim"
        ? checkinForm.selectedGuestPhone || ""
        : checkinForm.guestPhone || "";


    const finalCompanyId =
  checkinForm.hasCompany === "sim" &&
  checkinForm.hasCompanyAccount === "sim"
    ? checkinForm.selectedCompanyId
    : null;

const finalCompanyName =
  checkinForm.hasCompany === "sim" &&
  checkinForm.hasCompanyAccount === "sim"
    ? checkinForm.searchCompany
    : checkinForm.companyName || "";

const finalCompanyCNPJ =
  checkinForm.hasCompany === "sim" &&
  checkinForm.hasCompanyAccount === "sim"
    ? checkinForm.companyCNPJ
    : checkinForm.companyCNPJ || "";

    // ---------------------------------------------------------
    // ✔ PAYLOAD FINAL PARA O BACKEND
    // ---------------------------------------------------------
    const payload = {
      roomId: checkinRoom.id,
      roomNumber: checkinRoom.identifier,

      guestName: finalGuestName,
      guestCPF: finalGuestCPF,
      guestEmail: finalGuestEmail,
      guestPhone: finalGuestPhone,

      companions: checkinForm.companions,
      companionsCount: checkinForm.companionsCount,
      hasCompanions: checkinForm.hasCompanions,

      companyId: finalCompanyId,
companyName: finalCompanyName,
companyCNPJ: finalCompanyCNPJ,

      checkInDate: checkinForm.checkInDate,
      checkOutDate: checkinForm.checkOutDate,
      notes: checkinForm.notes,
    };

    // ---------------------------------------------------------
    // ✔ ENVIA PARA O BACKEND
    // ---------------------------------------------------------
    const response = await fetch(
      `${baseUrl}/rooms/${checkinRoom.id}/checkin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let detail = "Erro ao realizar check-in.";
      try {
        const err = await response.json();
        if (err?.detail) detail = err.detail;
      } catch {}
      throw new Error(detail);
    }

    // Atualiza tela
    await reloadRooms();
    setIsCheckinOpen(false);
    setCheckinRoom(null);
    setCheckinStep(1);

    alert("Check-in realizado com sucesso!");
  } catch (error) {
    console.error(error);
    alert("Erro ao realizar check-in. Tente novamente.");
  }
};

  

 async function loadActiveReservation(roomId: string) {
  try {
    const q = query(
      collection(db, "reservations"),
      where("roomId", "==", roomId),
      where("checkOutStatus", "==", "pendente")
    );

    const snap = await getDocs(q);

    if (snap.empty) return null;

    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (error) {
    console.error(error);
    return null;
  }
}


  async function openCheckoutModal(room: Room) {
    const reservation = await loadActiveReservation(room.id);

    if (!reservation) return;

    setCheckoutRoom(room);
    setCheckoutReservation(reservation);
    setIsCheckoutOpen(true);
  }

  async function handleCheckoutSubmit() {
    if (!checkoutRoom || !checkoutReservation) return;

    try {
      // 1. Atualiza a reserva no backend
      const res1 = await fetch(
        `${baseUrl}/reservations/${checkoutReservation.id}/checkout`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res1.ok) {
        throw new Error("Erro ao atualizar reserva.");
      }

      // 2. Libera o quarto (status = disponível)
      const res2 = await fetch(`${baseUrl}/rooms/${checkoutRoom.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disponível" }),
      });

      if (!res2.ok) {
        throw new Error("Erro ao atualizar status do quarto.");
      }

      // 3. Limpa nome do hóspede no quarto
      // 3. Limpar completamente o quarto
const res3 = await fetch(`${baseUrl}/rooms/${checkoutRoom.id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    guest: "",
    guestId: "",
    companions: [],
    companyId: "",
    companyName: "",
    companyCNPJ: "",
    guestNotes: "",
  }),
});


      if (!res3.ok) {
        throw new Error("Erro ao limpar informações do quarto.");
      }

      // 🔥 Também limpa os dados do quarto no Firestore (coleção rooms)
const roomRefFS = doc(db, "rooms", checkoutRoom.id);
await updateDoc(roomRefFS, {
  guest: "",
  guestNotes: "",
  companions: [],
  companyId: null,
  companyName: "",
  companyCNPJ: "",
});

      // 4. Atualiza tela
      await reloadRooms();

      // 5. Fecha modal
      setIsCheckoutOpen(false);
      setCheckoutRoom(null);
      setCheckoutReservation(null);

      alert("Check-out concluído com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao concluir check-out, tente novamente.");
    }
  }


  
  
  return (
    <div className="space-0">
      <Card
        title="Quartos - Visão Geral"
        description="Visualize e gerencie os quartos em formato de cards."
        headerAction={
          <button
            className="btn-primary gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle size={18} />
            Novo quarto
          </button>
        }
      >
        {/* ... (Filtros e Busca - MANTIDOS) ... */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 surface-input w-full px-3">
            <Search size={16} className="text-muted" />
            <input
              type="search"
              placeholder="Pesquisar quarto por número"
              className="bg-transparent outline-none flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={typeFilter ?? ""}
            onChange={(event) => setTypeFilter(event.target.value || undefined)}
            className="surface-input"
          >
            <option value="">Todos os tipos</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="surface-toolbar flex flex-wrap items-center gap-3 text-sm md:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 text-muted-strong">
              <input
                type="radio"
                name="status"
                value=""
                checked={!statusFilter}
                onChange={() => setStatusFilter(undefined)}
              />
              Todos
            </label>
            <label className="flex items-center gap-2 text-muted-strong">
              <input
                type="radio"
                name="status"
                value="disponível"
                checked={statusFilter === "disponível"}
                onChange={() => setStatusFilter("disponível")}
              />
              Disponíveis
            </label>
            <label className="flex items-center gap-2 text-muted-strong">
              <input
                type="radio"
                name="status"
                value="ocupado"
                checked={statusFilter === "ocupado"}
                onChange={() => setStatusFilter("ocupado")}
              />
              Ocupados
            </label>
            <label className="flex items-center gap-2 text-muted-strong">
              <input
                type="radio"
                name="status"
                value="reservado"
                checked={statusFilter === "reservado"}
                onChange={() => setStatusFilter("reservado")}
              />
              Reservados
            </label>

            <label className="flex items-center gap-2 text-muted-strong">
              <input
                type="radio"
                name="status"
                value="manutenção"
                checked={statusFilter === "manutenção"}
                onChange={() => setStatusFilter("manutenção")}
              />
              Manutenção
            </label>
          </div>
        </div>
        {/* ... (Fim Filtros e Busca) ... */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm transition hover:border-primary hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Quarto {room.identifier}
                    </h3>
                    <p className="text-sm text-muted">{room.type}</p>
                  </div>
                  <StatusBadge
                    label={room.status}
                    status={STATUS_TONE[room.status]}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-strong line-clamp-2">
                {room.description}
              </p>

              {/* 🔹 Hóspede e observações (novos, só aparecem se estiver reservado ou ocupado) */}
              {(room.status === "ocupado" || room.status === "reservado") && (
                <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <p className="text-xs uppercase text-muted-soft">Hóspede</p>
                  <p className="text-sm font-medium text-emphasis">
                    {room.guest || "—"}{" "}
                    {/* Mostra o nome do hóspede ou um traço se não houver hóspede */}
                  </p>

                  {room.guestNotes && (
                    <>
                      <p className="mt-1 text-xs uppercase text-muted-soft">
                        Observações
                      </p>
                      <p className="text-sm text-muted-strong">
                        {room.guestNotes}
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
              <button
  className="btn-secondary btn-sm flex-auto uppercase tracking-wide"
  onClick={async () => {
    const activeReservation = await loadActiveReservation(room.id);

    const enrichedRoom: Room = {
      ...room,
      activeReservation: activeReservation || null,
    } as Room;

    setSelectedRoom(enrichedRoom);
  }}
>
  Detalhes
</button>


                {/* BOTÃO CHECK-IN / CHECK-OUT */}
                {room.status === "ocupado" ? (
                  <button
                    className="btn-outline-danger btn-sm flex-auto uppercase tracking-wide"
                    onClick={() => openCheckoutModal(room)}
                  >
                    Check-out
                  </button>
                ) : (
                  <button
  className="btn-outline-success btn-sm flex-auto uppercase tracking-wide"
  onClick={() => {
  resetCheckinForm();

  // 🔥 limpa tudo relacionado ao hóspede antigo
  const cleanRoom = {
    ...room,
    guest: "",
    guestId: "",
    companions: [],
    companyId: "",
    companyName: "",
    companyCNPJ: "",
    guestNotes: "",
  };

  setCheckinRoom(cleanRoom);
  setIsCheckinOpen(true);
}}

>

                    Check-in
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Renderização dos Modals como componentes externos, passando as props */}
      <RoomDetailsModal
      
  selectedRoom={selectedRoom}
  setSelectedRoom={setSelectedRoom}
  setEditingRoom={setEditingRoom}
  setMaintenanceRoom={setMaintenanceRoom}
  setMaintenanceForm={setMaintenanceForm}
  guests={guests}   //  <<=== AQUI !!!
 />


      <MaintenanceModal
        maintenanceRoom={maintenanceRoom}
        maintenanceForm={maintenanceForm}
        setMaintenanceForm={setMaintenanceForm}
        setMaintenanceRoom={setMaintenanceRoom}
        handleMaintenanceSubmit={handleMaintenanceSubmit}
      />

      <EditModal
        editingRoom={editingRoom}
        setEditingRoom={setEditingRoom}
        handleEditSubmit={handleEditSubmit}
        ALL_AMENITIES={ALL_AMENITIES}
        ROOM_TYPES={ROOM_TYPES}
      />

      {isCheckoutOpen && checkoutRoom && checkoutReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {/* HEADER */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold">
                  Check-out — Quarto {checkoutRoom.identifier}
                </h2>

                <p className="text-sm text-muted">
                  Confirme as informações antes de concluir.
                </p>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="
            flex h-9 w-9 items-center justify-center 
            rounded-lg border border-white/20 
            text-slate-500 hover:text-primary hover:border-primary
            dark:text-slate-300
          "
              >
                <X size={16} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6">
              {/* HÓSPEDE */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Hóspede</h3>
                <p className="text-sm">
                  {checkoutReservation.guestName ||
                    checkoutReservation.fullName ||
                    checkoutReservation.companyName ||
                    "—"}
                </p>
              </div>

              {/* CPF */}
              <div>
                <h3 className="font-semibold text-sm mb-1">CPF</h3>
                <p className="text-sm">
                  {checkoutReservation.guestCPF ||
                    checkoutReservation.cpf ||
                    "—"}
                </p>
              </div>

              {/* PERÍODO */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Período</h3>
                <p className="text-sm">
                  Entrada: {checkoutReservation.checkIn} <br />
                  Saída prevista: {checkoutReservation.checkOut}
                </p>
              </div>

              {/* ACOMPANHANTES */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Acompanhantes</h3>

                {checkinForm.companions?.length ? (
  <div className="ml-0 text-sm space-y-1">
  {checkinForm.companions.map((companion, i) => (
    <p key={i}>
      {companion.name} – {companion.cpf}
    </p>
  ))}
</div>

) : (
  <p className="text-sm">Nenhum</p>
)}

              </div>

              {/* EMPRESA */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Empresa</h3>
                <p className="text-sm">
                  {checkoutReservation.companyName || "Não vinculado"}
                </p>
              </div>

              {/* OBSERVAÇÕES */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Observações</h3>
                <p className="text-sm">
                  {checkoutReservation.notes || "Nenhuma observação"}
                </p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end items-center gap-3 p-6 border-t border-white/10">
              <button
                className="btn-secondary"
                onClick={() => setIsCheckoutOpen(false)}
              >
                Cancelar
              </button>

              <button className="btn-primary" onClick={handleCheckoutSubmit}>
                Confirmar Check-out
              </button>
            </div>
          </div>
        </div>
      )}

      {isCheckinOpen && checkinRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Check-in — Quarto {checkinRoom.identifier}
                </h2>
                <p className="text-sm text-muted">
                  Preencha as informações do hóspede para realizar o check-in.
                </p>
                {/* 🔹 Indicador da etapa */}
                <div className="mt-2 text-sm text-muted font-medium">
                  Etapa {checkinStep} de {totalCheckinSteps}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetCheckinForm();
                  setIsCheckinOpen(false);
                  setCheckinRoom(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* CONTEÚDO DAS ETAPAS */}
            <div className="mt-5 px-6 ">
              {/* ETAPA 1 — Hóspedes */}
              {checkinStep === 1 && (
                <div className="space-y-6">
                  {/* 🔹 Pergunta: Já tem cadastro? */}
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
                          onChange={(e) =>
                            setCheckinForm((prev) => ({
                              ...prev,
                              hasGuestAccount: "sim",
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
                          onChange={(e) =>
                            setCheckinForm((prev) => ({
                              ...prev,
                              hasGuestAccount: "nao",
                            }))
                          }
                        />
                        <span>Não</span>
                      </label>
                    </div>
                  </div>

                  {/* 🔹 Se JÁ tem cadastro → campo de busca */}
                 {/* 🔹 Se JÁ tem cadastro → campo de busca */}
{checkinForm.hasGuestAccount === "sim" && (
  <div>
    <label className="block text-sm font-medium text-muted-strong mb-2">
      Buscar hóspede cadastrado
    </label>

    {/* CAMPO DE BUSCA */}
    <input
  type="text"
  placeholder="Digite o nome ou CPF..."
  className="surface-input w-full"
  value={checkinForm.searchGuest}
  onChange={(e) =>
    setCheckinForm((prev) => ({
      ...prev,
      searchGuest: e.target.value,
      selectedGuestId: null,
    }))
  }
/>

{checkinForm.selectedGuestId && (
  <button
    type="button"
    className="mt-2 text-sm text-red-500 underline"
    onClick={clearSelectedGuest}
  >
    Desmarcar hóspede
  </button>
)}



    {/* LISTA DE RESULTADOS */}
    {checkinForm.showSearch !== false &&
 filteredGuests.length > 0 &&
 checkinForm.searchGuest.trim().length > 0 && (

      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:bg-slate-800">
       {filteredGuests.map((guest) => (
  <div
  key={guest.id}
  className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
  onClick={() => {
  setCheckinForm(prev => ({
    ...prev,

    // identifica o hóspede
    selectedGuestId: guest.id,
    selectedGuestFullData: guest,

    // preenche o formulário automaticamente
    guestName: guest.fullName,
    guestCPF: guest.cpf,
    guestEmail: guest.email || "",
    guestPhone: guest.phone || "",

    // também preenche os campos auxiliares (resumo)
    selectedGuestName: guest.fullName,
    selectedGuestCPF: guest.cpf,
    selectedGuestEmail: guest.email || "",
    selectedGuestPhone: guest.phone || "",

    // coloca o nome no campo de busca
    searchGuest: guest.fullName,

    // 🔥 OCULTA a lista
    showSearch: false,
  }));
}}

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
                              guestPhone: e.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* ETAPA 2 — Acompanhantes */}
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
                          const count =
                            rawValue === "" ? 0 : parseInt(rawValue);

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
    // Aplica a máscara sempre que o valor de CPF for alterado
    onChange={(e) =>
      updateCompanion(index, "cpf", maskCPF(e.target.value))  // Aplica a máscara
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

              {checkinStep === 4 && (
                <div className="space-y-6">
                  {/* PERGUNTA PRINCIPAL */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Vincular a uma empresa?
                    </label>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="hasCompany"
                          value="sim"
                          checked={checkinForm.hasCompany === "sim"}
                          onChange={() =>
                            setCheckinForm((prev) => ({
                              ...prev,
                              hasCompany: "sim",
                              hasCompanyAccount: null,
                              selectedCompanyId: null,
                            }))
                          }
                        />
                        <span>Sim</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="hasCompany"
                          value="nao"
                          checked={checkinForm.hasCompany === "nao"}
                          onChange={() =>
                            setCheckinForm((prev) => ({
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

                  {/* SE NÃO TEM EMPRESA → nada mais aparece */}
                  {checkinForm.hasCompany === "nao" && (
                    <p className="text-sm text-muted">
                      Nenhuma empresa será vinculada.
                    </p>
                  )}

                  {/* SE TEM EMPRESA → PERGUNTA SE TEM CADASTRO */}
                  {checkinForm.hasCompany === "sim" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        A empresa já possui cadastro?
                      </label>

                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="hasCompanyAccount"
                            value="sim"
                            checked={checkinForm.hasCompanyAccount === "sim"}
                            onChange={() =>
                              setCheckinForm((prev) => ({
                                ...prev,
                                hasCompanyAccount: "sim",
                              }))
                            }
                          />
                          <span>Sim</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="hasCompanyAccount"
                            value="nao"
                            checked={checkinForm.hasCompanyAccount === "nao"}
                            onChange={() =>
                              setCheckinForm((prev) => ({
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

                  {/* BUSCA DE EMPRESA */}
                    
                     {/* BUSCA DE EMPRESA */}
{checkinForm.hasCompany === "sim" &&
  checkinForm.hasCompanyAccount === "sim" && (
    <div>
      <label className="block text-sm font-medium mb-2">
        Buscar empresa
      </label>

      {/* INPUT */}
      <input
        type="text"
        className="surface-input w-full"
        placeholder="Digite o nome ou CNPJ..."
        value={checkinForm.searchCompany || ""}
        onChange={(e) =>
          setCheckinForm((prev) => ({
            ...prev,
            searchCompany: e.target.value,
            showCompanySearch: true, // faz a lista aparecer
          }))
        }
      />

      {/* LISTA DE EMPRESAS (AUTOCOMPLETE) */}
      {checkinForm.showCompanySearch &&
        filteredCompanies.length > 0 &&
        checkinForm.searchCompany.trim().length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white dark:bg-slate-800">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() =>
                  setCheckinForm((prev) => ({
                    ...prev,
                    selectedCompanyId: company.id,
                    selectedCompanyName: company.name,
                    selectedCompanyCNPJ: company.cnpj,
                    selectedCompanyFullData: company,
                    searchCompany: company.name, // Preenche o input
                    showCompanySearch: false, // Esconde a lista
                  }))
                }
              >
                <p className="font-medium">{company.name}</p>
                <p className="text-xs text-muted">{company.cnpj}</p>
              </div>
            ))}
          </div>
        )}

      {/* BOTÃO DESMARCAR EMPRESA */}
      {checkinForm.selectedCompanyId && (
        <button
          type="button"
          className="mt-2 text-sm text-red-500 underline"
          onClick={() =>
            setCheckinForm((prev) => ({
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


                  {/* FORMULÁRIO COMPLETO DE NOVA EMPRESA */}
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
                                setCheckinForm((prev) => ({
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
                                setCheckinForm((prev) => ({
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
                                setCheckinForm((prev) => ({
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
                                setCheckinForm((prev) => ({
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
                              setCheckinForm((prev) => ({
                                ...prev,
                                companyPhone: e.target.value,
                              }))
                            }
                            placeholder="(00) 00000-0000"
                          />
                        </label>
                      </div>
                    )}
                </div>
              )}

              {checkinStep === 5 && (
                <div className="space-y-6">
                  {/* CAMPO DE OBSERVAÇÕES — PEQUENO */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Observações
                    </label>

                    <textarea
                      className="surface-input w-full h-16 resize-none text-sm"
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

                  {/* RESUMO — COMPACTO */}
                  <div className="rounded-lg border border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/40">
                    <h4 className="font-semibold mb-2 text-sm">
                      Resumo do check-in
                    </h4>

                    <div className="space-y-2 text-sm">
                     {/* Hóspede */}
<div>
  <strong>Hóspede:</strong>
  <p>
    {checkinForm.hasGuestAccount === "sim"
      ? checkinForm.selectedGuestName || "—"
      : checkinForm.guestName || "—"}
  </p>
</div>

{/* CPF */}
<div>
  <strong>CPF:</strong>
  <p>
    {checkinForm.hasGuestAccount === "sim"
      ? checkinForm.selectedGuestCPF || "—"
      : checkinForm.guestCPF || "—"}
  </p>
</div>

                      {/* Datas */}
                      <div>
                        <strong>Datas:</strong>
                        <p>
                          Entrada: {checkinForm.checkInDate} <br />
                          Saída: {checkinForm.checkOutDate}
                        </p>
                      </div>

                      {/* Acompanhantes */}
                      <div>
                        <strong>Acompanhantes:</strong>
                        <p>
                          {checkinForm.hasCompanions === "nao"
                            ? "Nenhum"
                            : `${checkinForm.companionsCount} acompanhante(s)`}
                        </p>
                      </div>

                      {/* Empresa */}
                      <div>
                      <strong>Empresa vinculada:</strong>
<p>
  {checkinForm.hasCompany === "nao" && "Nenhuma empresa selecionada"}

  {checkinForm.hasCompany === "sim" &&
    checkinForm.hasCompanyAccount === "sim" &&
    (checkinForm.searchCompany || "Empresa selecionada")}

  {checkinForm.hasCompany === "sim" &&
    checkinForm.hasCompanyAccount === "nao" &&
    (checkinForm.companyName || "—")}
</p>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com ações desabilitadas por enquanto */}

            {/* RODAPÉ DO MODAL */}
            <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-7 px-6 pb-5 dark:border-slate-800">
              {/* Botão Voltar (aparece a partir da etapa 2) */}
              {checkinStep > 1 ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={prevStep}
                >
                  Voltar
                </button>
              ) : (
                <div></div> /* espaço vazio para alinhar */
              )}

              {/* Botões à direita */}
              <div className="flex gap-3">
                {/* Cancelar sempre aparece */}
                <button
  type="button"
  className="btn-secondary"
  onClick={() => {
    resetCheckinForm();   // limpa tudo
    setIsCheckinOpen(false); // fecha o modal
  }}
>
  Cancelar
</button>


                {/* Botão avançar (etapas 1 a 4) */}
                {checkinStep < totalCheckinSteps && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={nextStep}
                  >
                    Próximo
                  </button>
                )}

                {/* Botão finalizar na etapa 5 */}
                {checkinStep === totalCheckinSteps && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCheckinSubmit}
                  >
                    Fazer check-in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... (Modal de Criação - O código abaixo está inalterado e pendente) ... */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Novo quarto
                </h2>
                <p className="text-sm text-muted">
                  Defina os dados básicos do quarto antes de disponibilizá-lo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              // AQUI VOCÊ DEVE ADICIONAR A LÓGICA DE SUBMISSÃO PARA O NOVO QUARTO
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                // Lógica de criação de quarto será implementada aqui
                console.log(
                  "Submissão do novo quarto. Implementar lógica de salvamento no Firestore."
                );
                setIsCreateModalOpen(false);
              }}
            >
              <div className="block text-sm font-medium text-muted-strong">
                <span>Imagens do quarto</span>
                <label
                  htmlFor="create-room-images"
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm font-medium text-muted transition hover:border-primary hover:bg-primary/5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-primary dark:focus-within:border-primary"
                >
                  <UploadCloud
                    className="mb-2 h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Arraste e solte as imagens ou clique para selecionar
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    Formatos PNG, JPG ou WEBP até 5MB
                  </span>
                  <input
                    id="create-room-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const files = event.target.files
                        ? Array.from(event.target.files)
                        : [];
                      setCreateImages(files);
                    }}
                    className="sr-only"
                  />
                </label>
                {createImages.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted">
                    {createImages.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <label className="block text-sm font-medium text-muted-strong">
                Número/identificador
                <input
                  required
                  value={createForm.identifier}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      identifier: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                />
              </label>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full">
                  Criar Quarto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ... (Fim Modal de Criação) ... */}
    </div>
  );
}
