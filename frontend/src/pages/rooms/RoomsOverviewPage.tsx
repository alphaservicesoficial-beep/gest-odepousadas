import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

type Room = {
  id: string;
  identifier: string;
  type: string;
  status: "disponível" | "ocupado" | "manutenção";
  description: string;
  amenities: string[];
  images?: string[];
};

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

const ROOM_DATA: RoomSeed[] = [
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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
    type: "Suíte Premium",
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

const STATUS_TONE: Record<Room["status"], "success" | "info" | "warning"> = {
  disponível: "success",
  ocupado: "info",
  manutenção: "warning",
};

function RoomsOverviewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<
    Room["status"] | undefined
  >();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [createForm, setCreateForm] = useState({
    identifier: "",
    type: "",
    status: "disponível" as Room["status"],
    description: "",
  });
  const [createImages, setCreateImages] = useState<File[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({
    issue: "",
    priority: "média",
  });

  const filteredRooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return ROOMS.filter((room) => {
      const matchesSearch =
        !normalizedSearch ||
        room.identifier.toLowerCase().includes(normalizedSearch) ||
        room.description.toLowerCase().includes(normalizedSearch);

      const matchesType = !typeFilter || room.type === typeFilter;
      const matchesStatus = !statusFilter || room.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
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
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Pesquisar por número ou descrição..."
              className="surface-input pl-9"
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
                value="manutenção"
                checked={statusFilter === "manutenção"}
                onChange={() => setStatusFilter("manutenção")}
              />
              Manutenção
            </label>
          </div>
        </div>

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

              <p className="mt-3 text-sm text-muted-strong">
                {room.description}
              </p>

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
                >
                  Abrir manutenção
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
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
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setIsCreateModalOpen(false);
                setCreateForm({
                  identifier: "",
                  type: "",
                  status: "disponível" as Room["status"],
                  description: "",
                });
                setCreateImages([]);
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
                  placeholder="Ex.: 203"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Tipo do quarto
                <input
                  required
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Standard, Deluxe, Família..."
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: event.target.value as Room["status"],
                    }))
                  }
                  className="surface-input mt-2"
                >
                  <option value="disponível">Disponível</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="manutenção">Manutenção</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Descrição
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Resumo do quarto e diferenciais."
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateForm({
                        identifier: "",
                        type: "",
                        status: "disponível" as Room["status"],
                        description: "",
                      });
                      setCreateImages([]);
                    }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar quarto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Detalhes do quarto
                </h2>
                <p className="text-sm text-muted">
                  Visualize rapidamente as informações cadastradas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-strong">
              <div>
                <p className="text-xs uppercase text-muted-soft">
                  Identificador
                </p>
                <p className="mt-1 text-emphasis">{selectedRoom.identifier}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Tipo</p>
                <p className="mt-1">{selectedRoom.type}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Status</p>
                <p className="mt-1 capitalize">{selectedRoom.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Descrição</p>
                <p className="mt-1 text-muted">{selectedRoom.description}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Amenidades</p>
                <p className="mt-1 text-muted">
                  {selectedRoom.amenities.length > 0
                    ? selectedRoom.amenities.join(", ")
                    : "Não informado"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setSelectedRoom(null)}
                aria-label="Fechar detalhes do quarto"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button className="btn-primary btn-sm">Editar quarto</button>
            </div>
          </div>
        </div>
      )}

      {maintenanceRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Abrir manutenção
                </h2>
                <p className="text-sm text-muted">
                  Informe o problema identificado no quarto{" "}
                  {maintenanceRoom.identifier}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceRoom(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar manutenção"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setMaintenanceRoom(null);
                setMaintenanceForm({ issue: "", priority: "média" });
              }}
            >
              <label className="block text-sm font-medium text-muted-strong">
                Descrição do problema
                <textarea
                  rows={3}
                  required
                  value={maintenanceForm.issue}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      issue: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Relate o que precisa ser verificado ou consertado."
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Prioridade
                <select
                  value={maintenanceForm.priority}
                  onChange={(event) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      priority: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                >
                  <option value="baixa">Baixa</option>
                  <option value="média">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setMaintenanceRoom(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsOverviewPage;
