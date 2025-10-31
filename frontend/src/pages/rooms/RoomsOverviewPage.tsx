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
    onSnapshot, 
} from "firebase/firestore";

// 🔹 Tipagem para hóspedes (Guest) e quartos (Room)
type Guest = {
  id: string;
  fullName?: string; // pode ser hóspede ou empresa
  companyName?: string; // nome da empresa
  cpf?: string;
  cnpj?: string;
  email: string;
  phone: string;
  roomId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amenities: string[];
  value?: string;
  notes?: string;
};


type Room = {
  id: string;
  identifier: string;
  type: string;
  status: "disponível" | "ocupado" | "reservado" | "manutenção";
  description: string;
  amenities: string[];
  images?: string[];
  // 💡 Campos adicionados para resolver o erro no JSX:
  guest?: string | null; // Nome ou identificador do hóspede (que está no JSX)
  guestNotes?: string | null; // Observações sobre a estadia/hóspede (que está no JSX)
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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1505692185631-7a516a654f30";
const DOUBLE_SINGLE_IMAGE = new URL(
  "../../../img/Cama de casal e solteiro.jpg",
  import.meta.url,
).href;
const DOUBLE_DOUBLE_IMAGE = new URL(
  "../../../img/Duas camas de casal.jpg",
  import.meta.url,
).href;
const SINGLE_IMAGE = new URL("../../../img/Camas solteiro.jpg", import.meta.url)
  .href;
const BATHROOM_IMAGE = new URL(
  "../../../img/Banheiro quartos.jpg",
  import.meta.url,
).href;

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
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${index === current ? "opacity-100" : "opacity-0"}`}
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
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${index === current ? "bg-white" : "bg-white/50 hover:bg-white/80"}`}
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
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Acomoda até 3 hóspedes com vista lateral para o jardim.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV Smart 43"',
      "Cofre digital",
      "Frigobar",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-106",
    identifier: "106",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Primeiro andar com 2 camas de casal e área de estar. Ideal para famílias maiores ou grupos de amigas.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado digital",
      'TV Smart 50"',
      "Varanda privativa",
      "Cafeteira de cápsulas",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-107",
    identifier: "107",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Opção versátil para casais com criança.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Escrivaninha",
      "Roupeiro amplo",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-108",
    identifier: "108",
    type: "Quarto Família",
    status: "manutenção", 
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Em manutenção preventiva do sistema de climatização.",
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Fechadura eletrônica"],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-109",
    identifier: "109",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Vista para a piscina e iluminação natural abundante.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Cortinas blackout",
      "Frigobar",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-110",
    identifier: "110",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Ambiente silencioso próximo ao jardim interno.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Secador de cabelo",
      "Amenities premium",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-111",
    identifier: "111",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Reservado por família com crianças pequenas.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Berço sob demanda",
      "Serviço de quarto 24h",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-112",
    identifier: "112",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Primeiro andar com 4 camas de solteiro. Perfeito para equipes esportivas ou grupos de amigos.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários individuais",
      "Mesa compartilhada",
    ],
    imageSet: "single",
  },
  {
    id: "RM-113",
    identifier: "113",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Banheiro renovado com chuveiro com aquecimento a gás.",
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Chuveiro pressurizado"],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-114",
    identifier: "114",
    type: "Quarto Família",
    status: "manutenção", 
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Passando por revisão elétrica programada.",
    amenities: ["Wi-Fi", "Ar-condicionado", "TV", "Detector de fumaça"],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-115",
    identifier: "115",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Check-out previsto para amanhã às 11h.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Mesa de trabalho",
      "Cofre digital",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-116",
    identifier: "116",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Primeiro andar com 1 cama de casal e 1 de solteiro. Unidade de esquina com melhor ventilação.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Varanda francesa",
      "Amenities premium",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-200",
    identifier: "200",
    type: "Quarto Casal",
    status: "disponível",
    description:
      "Segundo andar com 1 cama de casal. Ambiente planejado para casais em busca de privacidade e conforto.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV Smart 43"',
      "Amenities premium",
      "Varanda francesa",
    ],
  },
  {
    id: "RM-201",
    identifier: "201",
    type: "Quarto Casal",
    status: "ocupado", 
    description:
      "Segundo andar com 1 cama de casal. Quarto com vista parcial para o mar, reservado para estadia romântica.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Iluminação dimerizável",
      "Serviço de quarto",
    ],
  },
  {
    id: "RM-202",
    identifier: "202",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Segundo andar com 4 camas de solteiro. Ideal para excursões e grupos corporativos em eventos.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Lockers individuais",
      "Mesa compartilhada",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-203",
    identifier: "203",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Segundo andar com 1 cama de casal e 1 de solteiro. Quartos integrados e preparados para crianças.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV Smart",
      "Berço sob demanda",
      "Cofre digital",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-204",
    identifier: "204",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 1 cama de casal e 1 de solteiro. Banheiro reformado com ducha aquecida e nichos iluminados.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Secador profissional",
      "Kit amenities completo",
    ],
    imageSet: "doubleSingle",
  },
  {
    id: "RM-205",
    identifier: "205",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Living integrado e bancada para refeições rápidas.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado split",
      'TV 55"',
      "Cafeteira de cápsulas",
      "Mini adega",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-206",
    identifier: "206",
    type: "Quarto Família",
    status: "manutenção", 
    description:
      "Segundo andar com 2 camas de casal. Passando por manutenção preventiva do sistema hidráulico.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV 4K",
      "Cofre digital",
      "Fechadura eletrônica",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-207",
    identifier: "207",
    type: "Quarto Grupo",
    status: "ocupado", 
    description:
      "Segundo andar com 4 camas de solteiro. Reservado por equipe esportiva em competição regional.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários com tranca",
      "Mesa para reuniões rápidas",
    ],
    imageSet: "single",
  },
  {
    id: "RM-208",
    identifier: "208",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Sacada com vista panorâmica e kit de boas-vindas diferenciado.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV 55"',
      "Varanda privativa",
      "Amenities premium",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-209",
    identifier: "209",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Segundo andar com 2 camas de casal. Destaque para a iluminação natural e área de leitura.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Poltronas de leitura",
      "Mesa de trabalho",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-210",
    identifier: "210",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Segundo andar com 3 camas de solteiro. Projetado para viajantes solo que desejam compartilhar a mesma suíte.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Armários individuais",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-211",
    identifier: "211",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Segundo andar com 2 camas de casal. Estadia de longa duração com serviço de limpeza personalizado.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV 4K",
      "Serviço de quarto 24h",
      "Cafeteira de cápsulas",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-301",
    identifier: "301",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Espaço amplo com vista para o mar, ideal para grupos de viagem.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários individuais",
      "Mesa compartilhada",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-302",
    identifier: "302",
    type: "Quarto Grupo",
    status: "ocupado", 
    description:
      "Terceiro andar com 4 camas de solteiro. Reservado por grupo de executivos em evento regional.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Lockers com chave",
      "Mesa de reuniões",
    ],
    imageSet: "single",
  },
  {
    id: "RM-303",
    identifier: "303",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Layout flexível, com cabeceiras independentes e iluminação individual.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Mesa compartilhada",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-304",
    identifier: "304",
    type: "Quarto Grupo",
    status: "manutenção", 
    description:
      "Terceiro andar com 4 camas de solteiro. Em manutenção preventiva da iluminação decorativa.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários individuais",
      "Mesa de apoio",
    ],
    imageSet: "single",
  },
  {
    id: "RM-305",
    identifier: "305",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Terceiro andar com 2 camas de casal. Sacada com vista privilegiada e banheira de hidromassagem.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV 55"',
      "Banheira de hidromassagem",
      "Cafeteira de cápsulas",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-306",
    identifier: "306",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Terceiro andar com 2 camas de casal. Reservado por família em estadia de férias prolongada.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV Smart 55"',
      "Serviço de quarto 24h",
      "Frigobar abastecido",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-307",
    identifier: "307",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Perfeito para eventos de confraternização e retiros corporativos.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários com tranca",
      "Mesa coletiva",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-308",
    identifier: "308",
    type: "Quarto Família",
    status: "manutenção", 
    description:
      "Terceiro andar com 2 camas de casal. Revisão programada do sistema de climatização central.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado digital",
      "TV",
      "Varanda privativa",
      "Mini adega",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-309",
    identifier: "309",
    type: "Quarto Família",
    status: "disponível",
    description:
      "Terceiro andar com 2 camas de casal. Destaque para o living integrado com vista para o pôr do sol.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      'TV 55"',
      "Poltronas de leitura",
      "Mesa de trabalho",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-310",
    identifier: "310",
    type: "Quarto Família",
    status: "ocupado", 
    description:
      "Terceiro andar com 2 camas de casal. Reservado para casamento com decoração especial e amenities de boas-vindas.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV 4K",
      "Champanhe de cortesia",
      "Cafeteira de cápsulas",
    ],
    imageSet: "doubleDouble",
  },
  {
    id: "RM-311",
    identifier: "311",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Equipado com tomadas individuais e iluminação em LED nos painéis.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "Armários individuais",
      "Mesa compartilhada",
      "Cortinas blackout",
    ],
    imageSet: "single",
  },
  {
    id: "RM-312",
    identifier: "312",
    type: "Quarto Grupo",
    status: "disponível",
    description:
      "Terceiro andar com 4 camas de solteiro. Opção flexível com decoração em tons neutros e iluminação natural.",
    amenities: [
      "Wi-Fi",
      "Ar-condicionado",
      "TV",
      "Lockers com chave",
      "Cortinas blackout",
    ],
    imageSet: "single",
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
  (a, b) => a.localeCompare(b, "pt-BR"),
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
            
            const initialStatus = room.status === 'manutenção' ? 'manutenção' : 'disponível';

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
    selectedRoom, setSelectedRoom, setEditingRoom, setMaintenanceRoom, setMaintenanceForm 
}: { 
    selectedRoom: Room | null, 
    setSelectedRoom: (room: Room | null) => void,
    setEditingRoom: (room: Room | null) => void,
    setMaintenanceRoom: (room: Room | null) => void,
    setMaintenanceForm: React.Dispatch<React.SetStateAction<{ issue: string; priority: "baixa" | "média" | "alta" }>>,
}) {
    if (!selectedRoom) return null;
    
    // Funções auxiliares para ícones (mantidas)
    const amenityIcons: Record<string, JSX.Element> = {
          "wi-fi": <Wifi size={18} className="text-primary" />,
          "ar-condicionado": <Thermometer size={18} className="text-primary" />,
          "tv": <Tv size={18} className="text-primary" />,
          "cama": <Bed size={18} className="text-primary" />,
          "frigobar": <Tv size={18} className="text-primary" />, 
          "cofre": <Tv size={18} className="text-primary" />,    
      };
      
    const getAmenityIcon = (amenity: string) => {
        const key = amenity.toLowerCase().split(/[\s-]/).slice(0, 2).join(' ');
        
        if (key.includes('wi')) return amenityIcons['wi-fi'];
        if (key.includes('ar')) return amenityIcons['ar-condicionado'];
        if (key.includes('tv')) return amenityIcons['tv'];
        if (key.includes('frigobar')) return amenityIcons['frigobar'];
        if (key.includes('cofre')) return amenityIcons['cofre'];
        
        return amenityIcons['cama'];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950">
                <div className="relative">
                    <RoomImageCarousel
                        images={selectedRoom.images ?? []}
                        alt={`Detalhes do Quarto ${selectedRoom.identifier}`}
                    />
                    
                    <button
                        type="button"
                        onClick={() => setSelectedRoom(null)} 
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/60 text-white shadow backdrop-blur hover:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                    
                    <h3 className="mt-4 text-md font-semibold text-emphasis">Amenidades</h3>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-muted-strong">
                        {selectedRoom.amenities.map((amenity) => (
                            <div key={amenity} className="flex items-center gap-2">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                            </div>
                        ))}
                    </div>

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
                          disabled={selectedRoom.status === 'manutenção'}
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
    setMaintenanceForm: React.Dispatch<React.SetStateAction<{ issue: string; priority: "baixa" | "média" | "alta" }>>;
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
                            O status será alterado para **Manutenção** e o quarto ficará indisponível.
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
    editingRoom, setEditingRoom, handleEditSubmit, ALL_AMENITIES, ROOM_TYPES 
}: { 
    editingRoom: Room | null, 
    setEditingRoom: React.Dispatch<React.SetStateAction<Room | null>>, 
    handleEditSubmit: (event: FormEvent) => Promise<void>,
    ALL_AMENITIES: string[],
    ROOM_TYPES: string[],
}) {
    if (!editingRoom) return null;
    
    // Funções internas (handleAmenityChange) permanecem iguais, mas agora definidas dentro do EditModal
    const handleAmenityChange = (amenity: string, isChecked: boolean) => {
        setEditingRoom((prev) => {
            if (!prev) return null;
            // ... (lógica de adicionar/remover amenidade) ...
            const currentAmenities = prev.amenities || [];
              
            if (isChecked) {
                if (!currentAmenities.includes(amenity)) {
                    return { ...prev, amenities: [...currentAmenities, amenity] };
                }
            } else {
                return { 
                    ...prev, 
                    amenities: currentAmenities.filter((a) => a !== amenity) 
                };
            }
            return prev;
        });
    };
    
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
                                    setEditingRoom((prev) => prev ? { ...prev, type: event.target.value } : null)
                                }
                                className="surface-input mt-2"
                            >
                              {ROOM_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                        </label>
                        
                        <label className="block text-sm font-medium text-muted-strong">
                            Status Atual
                            <select
                                required
                                value={editingRoom.status}
                                onChange={(event) =>
                                    setEditingRoom((prev) => prev ? { ...prev, status: event.target.value as Room["status"] } : null)
                                }
                                className="surface-input mt-2"
                            >
                              <option value="disponível">Disponível</option>
                              <option value="ocupado" disabled>Ocupado (Automático)</option>
                              <option value="reservado" disabled>Reservado (Automático)</option>
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
                                setEditingRoom((prev) => prev ? { ...prev, description: event.target.value } : null)
                            }
                            rows={3}
                            placeholder="Descrição detalhada do quarto e suas características."
                            className="surface-input mt-2 resize-none"
                        />
                    </label>
                    
                    {/* 🎯 SEÇÃO DE AMENIDADES */}
                    <div>
                        <h3 className="text-sm font-medium text-muted-strong mb-3">
                            Amenidades
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                            {ALL_AMENITIES.map((amenity) => (
                                <label key={amenity} className="flex items-center space-x-2 text-sm text-muted-strong">
                                    <input
                                        type="checkbox"
                                        checked={editingRoom.amenities?.includes(amenity)}
                                        onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
                                    />
                                    <span>{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
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

  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

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
  
  
  // 🔹 Controle de Scroll do Body (CORREÇÃO DO BUG)
  useEffect(() => {
    // Verifica se algum modal está aberto
    const isModalOpen = selectedRoom || maintenanceRoom || isCreateModalOpen || editingRoom;

    if (isModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Função de limpeza para garantir que a classe seja removida ao desmontar
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [selectedRoom, maintenanceRoom, isCreateModalOpen, editingRoom]);


  // 🔹 Função para recarregar apenas os quartos após uma mudança (Mantida)
  async function reloadRooms() {
        const roomSnap = await getDocs(collection(db, "rooms"));
        const roomData: Room[] = roomSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            identifier: data.identifier || docSnap.id.split('-').pop() || '000', 
            type: data.type || "Desconhecido", 
            status: (data.status ?? "disponível") as Room["status"],
            description: data.description || "",
            amenities: data.amenities || [],
            images: data.images || [],
            guest: data.guest || "",
            guestNotes: data.guestNotes || "",
          } as Room; 
        });
        
        const updatedRooms = updateRoomStatuses(roomData, guests); 
        setRooms(updatedRooms); 
  }


  // 🔹 Função que define o status do quarto com base nas reservas (Mantida)
 function toStartOfDay(v: any) {
  if (!v) return null;
  const d =
    typeof v?.seconds === "number" ? new Date(v.seconds * 1000) :
    typeof v === "string" ? new Date(v) :
    v instanceof Date ? new Date(v) : null;
  if (!d || isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function updateRoomStatuses(roomsList: Room[], guestList: Guest[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return roomsList.map((room) => {
    const resGuest = guestList.find((g) => g.roomId === room.id);

    const displayName = resGuest?.companyName || resGuest?.fullName || room.guest || "";
    const displayNotes = resGuest?.notes ?? room.guestNotes ?? "";

    // 🔹 Respeita o status vindo do Firestore (automático do backend)
    if (room.status === "manutenção" || room.status === "ocupado" || room.status === "disponível") {
      return { ...room, guest: displayName, guestNotes: displayNotes };
    }

    // 🔹 Só calcula por data se for reserva futura
    if (resGuest) {
      const checkIn = toStartOfDay(resGuest.checkIn);
      const checkOut = toStartOfDay(resGuest.checkOut);

      if (checkIn && checkOut) {
        if (today > checkIn && today <= checkOut) {
          return { ...room, status: "ocupado" as const, guest: displayName, guestNotes: displayNotes };
        }
        if (today <= checkIn) {
          return { ...room, status: "reservado" as const, guest: displayName, guestNotes: displayNotes };
        }
      }
    }

    return { ...room, status: "disponível" as const, guest: room.guest ?? "", guestNotes: room.guestNotes ?? "" };
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
        amenities: data.amenities ?? [],
        value: data.value ?? "",
        notes: data.notes ?? "",
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
          amenities: data.amenities || [],
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
      amenities: data.amenities ?? [],
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
      const response = await fetch(`${baseUrl}/reservations`, {
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
            amenities: form.amenities, 
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
        <RoomImageCarousel
          images={room.images ?? []}
          alt={`Quarto ${room.identifier}`}
        />

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

      {/* 🔹 Amenidades (mantidas) */}
      <div className="mt-4">
        <p className="text-xs uppercase text-muted-soft">Amenidades</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {room.amenities.map((amenity) => (
            <span key={amenity} className="chip-muted">
              {amenity}
            </span>
          ))}
        </div>
      </div>

      {/* 🔹 Hóspede e observações (novos, só aparecem se estiver reservado ou ocupado) */}
      {(room.status === "ocupado" || room.status === "reservado") && (
  <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
    <p className="text-xs uppercase text-muted-soft">Hóspede</p>
    <p className="text-sm font-medium text-emphasis">
      {room.guest || "—"} {/* Mostra o nome do hóspede ou um traço se não houver hóspede */}
    </p>

    {room.guestNotes && (
      <>
        <p className="mt-1 text-xs uppercase text-muted-soft">Observações</p>
        <p className="text-sm text-muted-strong">{room.guestNotes}</p>
      </>
    )}
  </div>
)}


      <div className="mt-4 flex gap-2">
        <button
          className="btn-secondary btn-sm flex-auto uppercase tracking-wide"
          onClick={() => setSelectedRoom(room)}
        >
          Detalhes
        </button>
        <button
          className="btn-outline-danger btn-sm flex-auto uppercase tracking-wide"
          onClick={() => {
            setMaintenanceRoom(room);
            setMaintenanceForm({ issue: "", priority: "média" });
          }}
          disabled={room.status === "manutenção"}
        >
          Manutenção
        </button>
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
                console.log("Submissão do novo quarto. Implementar lógica de salvamento no Firestore.");
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
                  <span>Arraste e solte as imagens ou clique para selecionar</span>
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