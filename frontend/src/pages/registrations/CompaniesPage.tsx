import {
    PlusCircle,
    Search,
    X,
    Edit,
    Trash2,
    // Icones de amenitys não estão sendo usados diretamente, mas mantidos nos imports
  } from "lucide-react";
  import { useState, useEffect, FormEvent, ChangeEvent } from "react";
  
  // Importações simuladas do Firebase (assumindo que você tem o arquivo de configuração)
  import { db } from "../../lib/firebase"; 
  import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
  } from "firebase/firestore";
  
  import Card from "../../components/ui/Card"; 
  // import StatusBadge from "../../components/ui/StatusBadge"; // Não usado neste componente
  
  // -----------------------------------------------------------------------
  // 💡 TIPAGEM E DADOS DE QUARTOS (BASEADO NO SEU INPUT)
  // -----------------------------------------------------------------------
  const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

  type Room = {
      id: string;
      identifier: string;
    
      status: "disponível" | "ocupado" | "reservado" | "manutenção";
      description: string;
      amenities: string[];
      images?: string[];
      guest?: string | null;
      guestNotes?: string | null;
      imageSet?: string; 
  };
  
  // Tipo para os dados da Empresa (adaptado para incluir a reserva como Opcional)
  type Company = {
      id: string;
      name: string; // Razão social
      cnpj: string;
      mainContact: string; // Contato principal (Nome do representante)
      email: string;
      phone: string;
      // Campos de Reserva (Opcionais)
      checkIn?: string;
      checkOut?: string;
      guests?: number;
      roomId?: string; // ID do Quarto
      roomNumber?: string; // Número/Identificador do Quarto
      amenities?: string[];
      value?: string;
      notes?: string; // Observações gerais
  };
  

  // 💡 LISTA COMPLETA DE AMENIDADES PARA OS CHECKBOXES

  
  // --- Funções de Máscara (Utilitárias) ---
  const maskCNPJ = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };
  
  const maskPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(\d{4})-(\d)(\d{4})/, "$1$2-$3")
      .substring(0, 15);
  };
  
  
  export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
  // Lista de quartos disponíveis vindos da API
const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    const [isEditing, setIsEditing] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
  
    const [form, setForm] = useState<Partial<Company>>({
      name: "",
      cnpj: "",
      mainContact: "",
      email: "",
      phone: "",
      notes: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      amenities: [],
      value: "",
      roomId: "",
      roomNumber: "",
    });
  
    // --- Funções de Estado e Modal ---
    function resetForm() {
      setForm({
        name: "",
        cnpj: "",
        mainContact: "",
        email: "",
        phone: "",
        notes: "",
        checkIn: "",
        checkOut: "",
        guests: 1,
        amenities: [],
        value: "",
        roomId: "",
        roomNumber: "",
      });
    }
  
    const openCreateModal = () => {
      setIsEditing(false);
      resetForm();
      setIsModalOpen(true);
    };
  
    const handleEdit = (company: Company) => {
      setForm(company);
      setIsEditing(true);
      setIsModalOpen(true);
      setSelectedCompany(null);
    };
  
    const handleFormChange = (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      let newValue = value;
  
      if (name === "cnpj") {
        newValue = maskCNPJ(value);
      } else if (name === "phone") {
        newValue = maskPhone(value);
      }
      
      setForm((values) => ({
        ...values,
        [name]: newValue,
      }));
    };
    
    // --- Funções Firebase ---
    async function loadCompanies() {
      // Se o Firebase não estiver configurado, descomente esta linha para simular dados:
      // setCompanies([{ id: "1", name: "Simulada", cnpj: "00000000000101", mainContact: "Contato", email: "a@b.com", phone: "11999999999", checkIn: "2025-10-01", roomNumber: "105" }]);
      
      try {
          const response = await fetch(`${baseUrl}/companies`);
const data = await response.json();
setCompanies(data);

      } catch (error) {
          // console.error("Erro ao carregar empresas do Firebase. Usando array vazio.", error);
          setCompanies([]); // Retorna vazio se houver erro no Firebase
      }
    }
  
    useEffect(() => {
      loadCompanies();
    }, []);

  // Carregar quartos disponíveis ao abrir a página
  useEffect(() => {
    async function loadAvailableRooms() {
      try {
        const currentRoomId = isEditing && form.roomId ? form.roomId : "";
        const response = await fetch(
          `${baseUrl}/available-rooms${currentRoomId ? `?current_room_id=${currentRoomId}` : ""}`
        );
        if (!response.ok) throw new Error("Erro ao buscar quartos disponíveis");
        const data = await response.json();
        setAvailableRooms(data);
      } catch (error) {
        console.error("Erro ao buscar quartos disponíveis:", error);
        setAvailableRooms([]);
      }
    }
  
    loadAvailableRooms();
  }, [isEditing, form.roomId]);
  

  
  
    // --- Função de Suporte: ATUALIZAÇÃO DO QUARTO ---
    /**
     * Atualiza o status de um quarto no Firebase.
     * @param roomId O ID do quarto a ser atualizado (ex: "RM-106").
     * @param newStatus O novo status do quarto ("ocupado", "reservado" ou "disponível").
     */
   async function updateRoomStatus(
    roomId: string,
    newStatus: Room["status"]
) {
    if (!roomId) return; // Garante que há um ID de quarto

    try {
        // Assumindo que a coleção de quartos se chama "rooms"
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, { 
            status: newStatus,
            // Opcional: Se quiser limpar ou definir o hóspede
            guest: newStatus === 'disponível' ? null : 'ID da Empresa (se quiser)', 
        });
        console.log(`Status do Quarto ${roomId} atualizado para: ${newStatus}`);
    } catch (error) {
        console.error(`Erro ao atualizar o status do Quarto ${roomId}:`, error);
    }
}

  
  async function handleSave(e: FormEvent) {
  e.preventDefault();

  const dataToSave = {
    ...form,
    cnpj: form.cnpj ? form.cnpj.replace(/\D/g, "") : "",
    phone: form.phone ? form.phone.replace(/\D/g, "") : "",
  } as Company;

  try {
    // ====================================================
    // 1️⃣ SALVAR / ATUALIZAR EMPRESA NA API LOCAL
    // ====================================================
    if (isEditing && dataToSave.id) {
      await fetch(`${baseUrl}/companies/${dataToSave.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
    } else {
      const response = await fetch(`${baseUrl}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      // ✅ Garante que o ID retornado da empresa criada é salvo
      const savedCompany = await response.json();
      if (savedCompany?.id) {
        dataToSave.id = savedCompany.id;
      }
    }

    // ====================================================
    // 2️⃣ ATUALIZAR STATUS DOS QUARTOS (LIBERAR / RESERVAR)
    // ====================================================
    if (isEditing) {
      const oldCompany = companies.find((c) => c.id === dataToSave.id);
      const oldRoomId = oldCompany?.roomId;

      // Se o quarto foi trocado, libera o anterior
      if (oldRoomId && oldRoomId !== dataToSave.roomId) {
        await updateRoomStatus(oldRoomId, "disponível");
        console.log(`🟢 Quarto ${oldRoomId} liberado (empresa editada)`);
      }
    }

    // Marca o novo quarto como reservado
    if (dataToSave.roomId) {
      await updateRoomStatus(dataToSave.roomId, "reservado");
      console.log(`✅ Quarto ${dataToSave.roomId} marcado como reservado`);
    }

    // ====================================================
    // 3️⃣ CRIAR OU ATUALIZAR RESERVA NO FIRESTORE
    // ====================================================
    if (dataToSave.roomId && dataToSave.id) {
      const reservationsRef = collection(db, "reservations");

      // Busca reservas existentes para esta empresa
      const existingReservationsSnap = await getDocs(reservationsRef);
      const existingReservation = existingReservationsSnap.docs.find(
        (doc) => doc.data().companyId === dataToSave.id
      );

      const reservationData = {
        companyId: dataToSave.id,
        companyName: dataToSave.name,
        roomId: dataToSave.roomId,
        checkIn: dataToSave.checkIn || "",
        checkOut: dataToSave.checkOut || "",
        guests: dataToSave.guests || 1,
        notes: dataToSave.notes || "",
        value: dataToSave.value || "",
        status: "reservado",
        createdAt: new Date().toISOString(),
      };

      if (existingReservation) {
        // 🔁 Atualiza a reserva existente
        const reservationDoc = doc(db, "reservations", existingReservation.id);
        await updateDoc(reservationDoc, reservationData);
        console.log(`🔁 Reserva atualizada para empresa: ${dataToSave.name}`);
      } else {
        // 🆕 Cria nova reserva
        await addDoc(reservationsRef, reservationData);
        console.log(`🆕 Nova reserva criada para empresa: ${dataToSave.name}`);
      }
    }

  } catch (error) {
    console.error("❌ Erro ao salvar empresa e/ou atualizar quarto:", error);
    alert("Houve um erro ao salvar os dados. Verifique o console.");
  }

  // ====================================================
  // 4️⃣ RECARREGAR LISTA E RESETAR FORMULÁRIO
  // ====================================================
  await loadCompanies();
  setIsModalOpen(false);
  setIsEditing(false);
  resetForm();
}


  
    async function handleDelete(companyToDelete: Company) {
      const confirmDelete = confirm(
        "Tem certeza que deseja excluir esta empresa?"
      );
      if (!confirmDelete) return;
  
      try {
          // 1. Excluir a empresa
          await fetch(`${baseUrl}/companies/${companyToDelete.id}`, {
  method: "DELETE",
});

          // 2. LIBERAR O QUARTO associado, se houver
          if (companyToDelete.roomId) {
              await updateRoomStatus(companyToDelete.roomId, 'disponível');
          }
  
          // 3. Recarregar a lista
          await loadCompanies(); 
          setSelectedCompany(null); 
      } catch (error) {
          console.error("Erro ao excluir empresa:", error);
          alert("Houve um erro ao excluir a empresa. Verifique o console.");
      }
    }
  
    // --- Lógica de Filtro ---
    const filteredCompanies = companies.filter((company) => {
      const searchLower = searchTerm.toLowerCase();
  
      if (!searchLower) return true;
  
      return (
        company.name.toLowerCase().includes(searchLower) ||
        company.cnpj.toLowerCase().includes(searchLower) ||
        company.mainContact.toLowerCase().includes(searchLower)
      );
    });
  
    // --- Renderização ---
    return (
      <div className="space-y-0 relative">
        <Card
          title="Cadastros de Empresas"
          description="Mantenha os registros das empresas e parcerias corporativas."
          headerAction={
            <button className="btn-primary gap-2" onClick={openCreateModal}>
              <PlusCircle size={18} />
              Nova empresa
            </button>
          }
        >
         

 <div className="mb-4 flex items-center gap-3">
  <div className="flex items-center gap-2 surface-input w-full px-3">
    <Search size={16} className="text-muted" />
    <input
      type="search"
      placeholder="Pesquisar empresa por nome, CNPJ ou quarto..."
      className="bg-transparent outline-none flex-1"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>
          {/* Tabela Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="surface-table-head">
                <tr>
                  <th className="px-4 py-3">Empresa (Razão Social)</th>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Contato Principal</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="surface-table-row">
                    <td className="px-4 py-3 font-medium text-emphasis">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-muted-strong">
                      {maskCNPJ(company.cnpj)}
                    </td>
                    <td className="px-4 py-3 text-muted-strong">
                      {company.mainContact}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {maskPhone(company.phone)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => setSelectedCompany(company)}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Lista Mobile */}
          <div className="space-y-3 md:hidden">
              {filteredCompanies.map((company) => (
                  <div
                      key={company.id}
                      className="surface-toolbar flex flex-col gap-2 p-4"
                  >
                      <div className="flex items-center justify-between">
                          <p className="text-emphasis">{company.name}</p>
                          <button
                              className="btn-secondary btn-sm"
                              onClick={() => setSelectedCompany(company)}
                          >
                              Ver detalhes
                          </button>
                      </div>
                      <div className="grid gap-1 text-xs text-muted-strong">
                          <span>CNPJ: {maskCNPJ(company.cnpj)}</span>
                          <span>Contato: {company.mainContact}</span>
                          <span>E-mail: {company.email}</span>
                      </div>
                  </div>
              ))}
              {filteredCompanies.length === 0 && (
                  <div className="py-4 text-center text-muted">
                      Nenhuma empresa encontrada.
                  </div>
              )}
          </div>
        </Card>
  
        {/* Modal de criar/editar: AGORA LARGO E COM QUARTOS FILTRADOS */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
            {/* 💡 LARGURA DO MODAL DEFINIDA AQUI: max-w-3xl */}
            <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-emphasis">
                    {isEditing ? "Editar empresa" : "Nova empresa"}
                  </h2>
                  <p className="text-sm text-muted">
                    {isEditing
                      ? "Atualize os dados básicos da empresa e, se houver, a reserva atual."
                      : "Cadastre a empresa e, se necessário, faça a reserva inicial."}
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
  
              {/* FORMULÁRIO (Usando 6 colunas) */}
              <form className="mt-6 grid grid-cols-6 gap-4" onSubmit={handleSave}>
            
  
  
                {/* Razão social */}
                <label className="flex flex-col col-span-2">
                  <span className="text-sm mb-1">Razão social</span>
                  <input
                    name="name" 
                    required
                    value={form.name || ""}
                    onChange={handleFormChange}
                    className="surface-input"
                    placeholder="Ex.: Viagens Brasil LTDA"
                  />
                </label>
  
                {/* Contato Principal */}
                <label className="flex flex-col col-span-2">
                  <span className="text-sm mb-1">Contato</span>
                  <input
                    name="mainContact" 
                    required
                    value={form.mainContact || ""}
                    onChange={handleFormChange}
                    className="surface-input"
                    placeholder="Nome do responsável"
                  />
                </label>
  
                {/* CNPJ */}
                <label className="flex flex-col col-span-2">
                  <span className="text-sm mb-1">CNPJ</span>
                  <input
                    name="cnpj" 
                    required
                    value={maskCNPJ(form.cnpj || "")}
                    onChange={handleFormChange}
                    className="surface-input"
                    placeholder="00.000.000/0000-00"
                  />
                </label>
  
                {/* E-mail */}
                <label className="flex flex-col col-span-2">
                  <span className="text-sm mb-1">E-mail</span>
                  <input
                    name="email" 
                    type="email"
                    required
                    value={form.email || ""}
                    onChange={handleFormChange} 
                    className="surface-input"
                    placeholder="contato@empresa.com"
                  />
                </label>

    {/* Telefone */}
    <label className="flex flex-col col-span-2">
      <span className="text-sm mb-1">Telefone</span>
      <input
        name="phone"
        required
        value={maskPhone(form.phone || "")}
        onChange={handleFormChange}
        className="surface-input"
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
                    placeholder="Ex: 500,00"
                  />
                </label>
  
                {/* --- Separador de Seção --- */}
                <div className="col-span-6 border-t border-slate-200 pt-4 dark:border-slate-800 mt-2">
                  <p className="text-md font-bold text-emphasis mb-2">Detalhes da Reserva </p>
                </div>
  
                {/* Nº do quarto (FILTRADO) */}
{/* Nº do quarto (FILTRADO) */}
<label className="flex flex-col col-span-2">
  <span className="text-sm mb-1">Nº do quarto</span>
  <select
    name="roomId"
    className="surface-input"
    value={form.roomId || ""}
    onChange={(e) => {
      const room = availableRooms.find((r) => r.id === e.target.value);
      setForm({
        ...form,
        roomId: e.target.value,
        roomNumber: room?.identifier || "",
      });
    }}
  >
    <option value="">Selecione um quarto disponível</option>

    {/* ✅ Quartos disponíveis */}
    {availableRooms.map((r) => (
      <option key={r.id} value={r.id}>
        Quarto {r.identifier}
      </option>
    ))}

    {/* ✅ Se o quarto atual não estiver disponível, exibe mesmo assim */}
    {isEditing &&
      form.roomId &&
      !availableRooms.some((r) => r.id === form.roomId) && (
        <option key={form.roomId} value={form.roomId}>
          Quarto {form.roomNumber || form.roomId} (Atual - Ocupado/Reservado)
        </option>
      )}
  </select>
</label>


  
                {/* Nº de pessoas */}
                <label className="flex flex-col col-span-2">
                  <span className="text-sm mb-1">Nº pessoas</span>
                  <input
                    name="guests" 
                    type="number"
                    className="surface-input"
                    value={form.guests || 1}
                    onChange={(e) =>
                      setForm({ ...form, guests: Number(e.target.value) })
                    }
                    min="1"
                  />
                </label>
  
               
                
                {/* Data de entrada */}
                <label className="flex flex-col col-span-1">
                  <span className="text-sm mb-1">Entrada</span>
                  <input
                    name="checkIn" 
                    type="date"
                    className="surface-input"
                    value={form.checkIn || ""}
                    onChange={handleFormChange}
                  />
                </label>
  
                {/* Data de saída */}
                <label className="flex flex-col col-span-1">
                  <span className="text-sm mb-1">Saída</span>
                  <input
                    name="checkOut" 
                    type="date"
                    className="surface-input"
                    value={form.checkOut || ""}
                    onChange={handleFormChange}
                  />
                </label>
  
              
  
                {/* Observações */}
                <label className="flex flex-col col-span-6">
                  <span className="text-sm mb-1">Observações (Geral/Reserva)</span>
                  <textarea
                    name="notes" 
                    className="surface-input min-h-[80px]"
                    value={form.notes || ""}
                    onChange={handleFormChange}
                    placeholder="Notas internas sobre a empresa ou detalhes da reserva..."
                  />
                </label>
                
                {/* Bloco de Ações */}
                <div className="col-span-6 flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {isEditing ? "Salvar alterações" : "Salvar empresa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
  
        {/* Modal de detalhes (Mantido) */}
        {selectedCompany && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <div 
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-emphasis">{selectedCompany.name}</h2>
                  <p className="text-sm text-muted">CNPJ: {maskCNPJ(selectedCompany.cnpj)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                  aria-label="Fechar detalhes"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
  
              <div className="mt-4 space-y-3 text-sm">
                  <p className="text-md font-bold text-emphasis border-b border-slate-200 dark:border-slate-800 pb-1">Contato</p>
                  <p><strong>Contato Principal:</strong> {selectedCompany.mainContact}</p>
                  <p><strong>E-mail:</strong> {selectedCompany.email}</p>
                  <p><strong>Telefone:</strong> {maskPhone(selectedCompany.phone)}</p>
  
                  {(selectedCompany.roomId || selectedCompany.checkIn) && (
                      <>
                          <p className="text-md font-bold text-emphasis border-b border-slate-200 dark:border-slate-800 pt-3 pb-1">Reserva</p>
                          {selectedCompany.roomNumber && <p><strong>Quarto:</strong> {selectedCompany.roomNumber}</p>}
                          {selectedCompany.checkIn && <p><strong>Check-in:</strong> {new Date(selectedCompany.checkIn).toLocaleDateString('pt-BR')}</p>}
                          {selectedCompany.checkOut && <p><strong>Check-out:</strong> {new Date(selectedCompany.checkOut).toLocaleDateString('pt-BR')}</p>}
                          {selectedCompany.guests && <p><strong>Pessoas:</strong> {selectedCompany.guests}</p>}
                          {selectedCompany.value && <p><strong>Valor Negociado (R$):</strong> {selectedCompany.value}</p>}
                          {selectedCompany.notes && <p><strong>Notas:</strong> {selectedCompany.notes}</p>}
                      </>
                  )}
                  
              </div>
  
              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="btn-outline text-red-500 flex items-center gap-1"
                  onClick={() => {
                    handleDelete(selectedCompany);
                    setSelectedCompany(null);
                  }}
                >
                  <Trash2 size={16} /> Excluir
                </button>
                <button
                  className="btn-secondary btn-sm gap-1"
                  onClick={() => {
                    handleEdit(selectedCompany);
                  }}
                >
                  <Edit size={16} /> Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }