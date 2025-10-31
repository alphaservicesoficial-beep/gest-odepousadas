import { PlusCircle, Search, X, Edit, Trash2 } from "lucide-react";
import { useState, useEffect, FormEvent, ChangeEvent } from "react"; // Adicionei ChangeEvent
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import Card from "../../components/ui/Card";

// -----------------------------------------------------------------------
// 💡 TIPAGEM
// -----------------------------------------------------------------------

type Guest = {
  id: string;
  fullName: string;
  cpf: string;
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
  status: "disponível" | "ocupado" | "reservado" | "manutenção" | string; // Status detalhado
  amenities: string[];
};

// --- Funções de Máscara (Utilitárias) ---
const maskCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .substring(0, 14);
};

const maskPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
        .substring(0, 15);
};

// 💡 LISTA COMPLETA DE AMENIDADES PARA OS CHECKBOXES



export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<Partial<Guest>>({
    fullName: "",
    cpf: "",
    email: "",
    phone: "",
    roomId: "",
    roomNumber: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    amenities: [],
    value: "",
    notes: "",
  });

  // -----------------------------------------------------------------------
  // 💡 LÓGICA DE CARREGAMENTO E FILTRO
  // -----------------------------------------------------------------------

  // Carregar hóspedes e quartos
// --- Carregar hóspedes e quartos do backend ---
async function loadData() {
  try {
    const guestsRes = await fetch("http://127.0.0.1:8000/api/guests");
    const roomsRes = await fetch("http://127.0.0.1:8000/api/rooms");

    const guestsData = await guestsRes.json();
    const roomsData = await roomsRes.json();

    // ✅ Garante que cada hóspede tenha o número do quarto atualizado
    const enrichedGuests = guestsData.map((g: any) => {
      const room = roomsData.find((r: any) => r.id === g.roomId);
      return {
        ...g,
        roomNumber: room ? room.identifier : g.roomNumber || "—",
      };
    });

    setGuests(enrichedGuests);
    setRooms(roomsData);
  } catch (error) {
    console.error("Erro ao carregar hóspedes:", error);
    setGuests([]);
    setRooms([]);
  }
}

useEffect(() => {
  loadData();
}, []);

  
  // 💡 Quartos disponíveis para a seleção (dropdown)
  // Mostrar quartos disponíveis e reservados, mas nunca duplicar o quarto atual
const availableRooms = rooms.filter((room) => {
  // Mostra se estiver disponível
  if (room.status === "disponível") return true;
  
  // Mostra se for o quarto atual do hóspede em edição
  if (isEditing && room.id === form.roomId) return true;
  
  // Caso contrário, não exibe
  return false;
});


  // -----------------------------------------------------------------------
  // 💡 LÓGICA DE FORMULÁRIO (incluindo máscaras)
  // -----------------------------------------------------------------------

  function resetForm() {
    setForm({
      fullName: "",
      cpf: "",
      email: "",
      phone: "",
      roomId: "",
      roomNumber: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      amenities: [],
      value: "",
      notes: "",
    });
  }
  
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "cpf") {
      newValue = maskCPF(value);
    } else if (name === "phone") {
      newValue = maskPhone(value);
    }
    
    setForm((values) => ({
      ...values,
      [name]: newValue,
    }));
  };

  const handleEdit = (guest: Guest) => {
    // 💡 Ao editar, precisamos garantir que o quarto atual do hóspede esteja na lista.
    // Como estamos usando Firebase, a lista 'rooms' já deve conter todos os quartos.
    setForm(guest);
    setIsEditing(true);
    setIsModalOpen(true);
    setSelectedGuest(null);
  };
  
  // -----------------------------------------------------------------------
  // 💡 LÓGICA DE PERSISTÊNCIA (handleSave)
  // -----------------------------------------------------------------------

  // --- Criar ou editar hóspede ---
// --- Criar ou editar hóspede + atualizar status do quarto ---
// --- Criar ou editar hóspede ---
async function handleSave(e: FormEvent) {
  e.preventDefault();

  const dataToSave = {
    ...form,
    cpf: form.cpf?.replace(/\D/g, ""),
    phone: form.phone?.replace(/\D/g, ""),
  } as Guest;

  try {
    if (isEditing && dataToSave.id) {
      // 1️⃣ Atualiza hóspede existente
      await fetch(`http://127.0.0.1:8000/api/guests/${dataToSave.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      // 2️⃣ Atualizar status do quarto (se trocou o quarto)
      const oldGuest = guests.find((g) => g.id === dataToSave.id);
      if (oldGuest && oldGuest.roomId !== dataToSave.roomId) {
        // Libera o quarto antigo
        await fetch(`http://127.0.0.1:8000/api/rooms/${oldGuest.roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "disponível" }),
        });

        // Reserva o novo quarto
        await fetch(`http://127.0.0.1:8000/api/rooms/${dataToSave.roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "reservado" }),
        });
      }

    } else {
      // 3️⃣ Cria novo hóspede
      await fetch("http://127.0.0.1:8000/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      // Marca quarto como reservado
      if (dataToSave.roomId) {
        await fetch(`http://127.0.0.1:8000/api/rooms/${dataToSave.roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "reservado" }),
        });
      }
    }

    await loadData();
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();

  } catch (error) {
    console.error("Erro ao salvar hóspede:", error);
  }
}

// --- Excluir hóspede ---
async function handleDelete(guestToDelete: Guest) {
  if (!confirm("Tem certeza que deseja excluir este hóspede?")) return;

  try {
    // Exclui hóspede
    await fetch(`http://127.0.0.1:8000/api/guests/${guestToDelete.id}`, {
      method: "DELETE",
    });

    // Libera o quarto
    if (guestToDelete.roomId) {
      await fetch(`http://127.0.0.1:8000/api/rooms/${guestToDelete.roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disponível" }),
      });
    }

    await loadData();
    setSelectedGuest(null);

  } catch (error) {
    console.error("Erro ao excluir hóspede:", error);
  }
}

  
  // -----------------------------------------------------------------------
  // Lógica de Filtro
  // -----------------------------------------------------------------------
  const filteredGuests = guests.filter((guest) => {
    const searchLower = searchTerm.toLowerCase();

    if (!searchLower) return true;

    return (
      guest.fullName.toLowerCase().includes(searchLower) ||
      guest.cpf.toLowerCase().includes(searchLower) ||
      guest.roomNumber.toLowerCase().includes(searchLower)
    );
  });
  
  
  // -----------------------------------------------------------------------
  // 💡 RENDERIZAÇÃO
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-0 relative">
      <Card
        title="Hóspedes"
        description="Gerencie os hóspedes e suas reservas."
        headerAction={
          <button
            className="btn-primary gap-2"
            onClick={() => {
              setIsEditing(false);
              setIsModalOpen(true);
              resetForm();
            }}
          >
            <PlusCircle size={18} />
            Novo hóspede
          </button>
        }
      >
       <div className="mb-4 flex items-center gap-3">
  <div className="flex items-center gap-2 surface-input w-full px-3">
    <Search size={16} className="text-muted" />
    <input
      type="search"
      placeholder="Pesquisar hóspede por nome, CPF ou quarto..."
      className="bg-transparent outline-none flex-1"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>

        

        {/* Tabela de Hóspedes */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Quarto</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {filteredGuests.map((g) => (
                <tr key={g.id} className="surface-table-row">
                  <td className="px-4 py-3 font-medium text-emphasis">
                    {g.fullName}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {maskCPF(g.cpf) || "—"}
                  </td>
                  <td className="px-4 py-3 text-primary font-semibold">
                    {g.roomNumber}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {g.checkIn}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {g.checkOut}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setSelectedGuest(g)}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                    <td colSpan={6} className="py-4 text-center text-muted">
                        Nenhum hóspede encontrado.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de criar/editar (AGORA LARGO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          {/* 💡 LARGURA DO MODAL DEFINIDA AQUI: max-w-5xl */}
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  {isEditing ? "Editar hóspede" : "Novo hóspede"}
                </h2>
                <p className="text-sm text-muted">
                  Preencha os dados do hóspede e os detalhes da reserva.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6 grid grid-cols-6 gap-4">
              {/* Nome completo */}
              <label className="flex flex-col col-span-3">
                <span className="text-sm mb-1">Nome completo</span>
                <input
                  name="fullName"
                  className="surface-input"
                  value={form.fullName || ""}
                  onChange={handleFormChange}
                  required
                />
              </label>

              {/* CPF / Documento */}
              <label className="flex flex-col col-span-3">
                <span className="text-sm mb-1">CPF / Documento</span>
                <input
                  name="cpf"
                  className="surface-input"
                  value={maskCPF(form.cpf || "")}
                  onChange={handleFormChange}
                  placeholder="000.000.000-00"
                />
              </label>

              {/* E-mail */}
              <label className="flex flex-col col-span-2">
                <span className="text-sm mb-1">E-mail</span>
                <input
                  name="email"
                  type="email"
                  className="surface-input"
                  value={form.email || ""}
                  onChange={handleFormChange}
                  placeholder="email@exemplo.com"
                />
              </label>

              {/* Telefone */}
              <label className="flex flex-col col-span-2">
                <span className="text-sm mb-1">Telefone</span>
                <input
                  name="phone"
                  className="surface-input"
                  value={maskPhone(form.phone || "")}
                  onChange={handleFormChange}
                  placeholder="(00) 00000-0000"
                />
              </label>
              
              {/* Valor (R$) */}
              <label className="flex flex-col col-span-2">
                <span className="text-sm mb-1">Valor (R$)</span>
                <input
                  name="value"
                  className="surface-input"
                  value={form.value || ""}
                  onChange={handleFormChange}
                  placeholder="Ex: 150,00"
                />
              </label>
              
              {/* --- Separador de Reserva --- */}
              <div className="col-span-6 border-t border-slate-200 pt-4 dark:border-slate-800 mt-2">
                <p className="text-md font-bold text-emphasis mb-2">Detalhes da Reserva</p>
              </div>

              {/* Nº do quarto (FILTRADO) */}
              <label className="flex flex-col col-span-2">
                <span className="text-sm mb-1">Nº do quarto</span>
                <select
  name="roomId"
  className="surface-input"
  value={form.roomId || ""}
  onChange={(e) => {
    const room = rooms.find((r) => r.id === e.target.value);
    setForm({
      ...form,
      roomId: e.target.value,
      roomNumber: room?.identifier || "",
    });
  }}
  required
>
  <option value="">Selecione um quarto</option>

  {availableRooms.map((r) => (
    <option key={r.id} value={r.id}>
      Quarto {r.identifier}
      {isEditing && r.id === form.roomId ? " (Atual)" : ""}
    </option>
  ))}
</select>

              </label>

              {/* Nº de pessoas */}
              <label className="flex flex-col col-span-2">
                <span className="text-sm mb-1">Nº de pessoas</span>
                <input
                  name="guests"
                  type="number"
                  className="surface-input"
                  value={form.guests || 1}
                  onChange={(e) =>
                    setForm({ ...form, guests: Number(e.target.value) })
                  }
                  min="1"
                  required
                />
              </label>

              {/* Data de entrada */}
              <label className="flex flex-col col-span-1">
                <span className="text-sm mb-1">Check-in</span>
                <input
                  name="checkIn"
                  type="date"
                  className="surface-input"
                  value={form.checkIn || ""}
                  onChange={handleFormChange}
                  required
                />
              </label>

              {/* Data de saída */}
              <label className="flex flex-col col-span-1">
                <span className="text-sm mb-1">Check-out</span>
                <input
                  name="checkOut"
                  type="date"
                  className="surface-input"
                  value={form.checkOut || ""}
                  onChange={handleFormChange}
                  required
                />
              </label>
              

              {/* Observações */}
              <label className="flex flex-col col-span-6">
                <span className="text-sm mb-1">Observações</span>
                <textarea
                  name="notes"
                  className="surface-input min-h-[80px]"
                  value={form.notes || ""}
                  onChange={handleFormChange}
                  placeholder="Notas internas sobre a estadia..."
                />
              </label>

              <div className="col-span-6 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {isEditing ? "Salvar alterações" : "Salvar hóspede"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedGuest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 dark:bg-slate-800 dark:text-slate-100 shadow-2xl text-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Detalhes do hóspede</h2>
              <button onClick={() => setSelectedGuest(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-base text-emphasis">Dados Pessoais</h3>
              <p><strong>Nome:</strong> {selectedGuest.fullName}</p>
              <p><strong>CPF:</strong> {maskCPF(selectedGuest.cpf)}</p>
              <p><strong>Email:</strong> {selectedGuest.email}</p>
              <p><strong>Telefone:</strong> {maskPhone(selectedGuest.phone)}</p>
              
              <h3 className="font-bold text-base text-emphasis pt-3 border-t border-slate-200 dark:border-slate-700">Detalhes da Reserva</h3>
              <p><strong>Quarto:</strong> {selectedGuest.roomNumber}</p>
              <p><strong>Check-in:</strong> {selectedGuest.checkIn} | <strong>Check-out:</strong> {selectedGuest.checkOut}</p>
              <p><strong>Pessoas:</strong> {selectedGuest.guests}</p>
              <p><strong>Valor:</strong> R$ {selectedGuest.value || '0,00'}</p>
              <p><strong>Objetos no Quarto:</strong> {selectedGuest.amenities?.join(", ") || "Nenhum"}</p>
              
              {selectedGuest.notes && (
                  <p className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <strong>Observações:</strong> {selectedGuest.notes}
                  </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-outline text-red-500 flex items-center gap-1"
                onClick={() => handleDelete(selectedGuest)}
              >
                <Trash2 size={14} /> Excluir
              </button>
              <button
                className="btn-primary flex items-center gap-1"
                onClick={() => handleEdit(selectedGuest)}
              >
                <Edit size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}