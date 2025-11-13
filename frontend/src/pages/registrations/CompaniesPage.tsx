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
    name: string;        // Nome da empresa (obrigatório)
    responsible: string; // Responsável (obrigatório)
    cnpj: string;        // CNPJ (obrigatório)
    email?: string;      // Opcional
    phone?: string;      // Opcional
    createdAt?: string;
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
  

  // --- Função utilitária para ordenação (mais recente → mais antigo)
function getCompanySortKey(c: { createdAt?: string; checkIn?: string }) {
  if (c.createdAt) return Date.parse(c.createdAt);
  if (c.checkIn) return Date.parse(c.checkIn);
  return 0;
}

  
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
    responsible: "",
    cnpj: "",
    email: "",
    phone: "",
  });
  
  
    // --- Funções de Estado e Modal ---
    function resetForm() {
    setForm({
      name: "",
      responsible: "",
      cnpj: "",
      email: "",
      phone: "",
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

  // Ordena do mais recente (último criado) para o mais antigo
  const sortedCompanies = data.sort(
    (a: any, b: any) => getCompanySortKey(b) - getCompanySortKey(a)
  );
  
  setCompanies(sortedCompanies);
  

      } catch (error) {
          // console.error("Erro ao carregar empresas do Firebase. Usando array vazio.", error);
          setCompanies([]); // Retorna vazio se houver erro no Firebase
      }
    }
  
    useEffect(() => {
      loadCompanies();
    }, []);

  
  
  
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

  if (!isEditing) {
    dataToSave.createdAt = new Date().toISOString();
  }

  try {
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
      const savedCompany = await response.json();
      if (savedCompany?.id) {
        dataToSave.id = savedCompany.id;
      }
    }

    // ✅ Atualiza lista e fecha modal automaticamente
    await loadCompanies();
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();

  } catch (error) {
    console.error("Erro ao salvar empresa:", error);
  }
}


    // ====================================================
    // 2️⃣ ATUALIZAR STATUS DOS QUARTOS (LIBERAR / RESERVAR)
    // ====================================================
    
// e aqui começa a outra função fora dela
async function handleGenerateNewReservation() {
  if (!form.id) {
    alert("Empresa não identificada.");
    return;
  }

  try {
    const payload = {
      ...form,
      cnpj: form.cnpj?.replace(/\D/g, ""),
      phone: form.phone?.replace(/\D/g, ""),
    };

    const response = await fetch(`${baseUrl}/companies/${form.id}/new_reservation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Erro ao gerar nova reserva.");

    alert("✅ Nova reserva criada para esta empresa!");
    await loadCompanies();
    setIsModalOpen(false);
    setIsEditing(false);
    resetForm();
  } catch (error) {
    console.error("Erro ao gerar nova reserva:", error);
    alert("Erro ao gerar nova reserva. Verifique o console.");
  }
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
    company.responsible.toLowerCase().includes(searchLower)
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
  {/* 🔍 Campo de busca */}
  <div className="mb-4 flex items-center gap-3">
    <div className="flex items-center gap-2 surface-input w-full px-3">
      <Search size={16} className="text-muted" />
      <input
        type="search"
        placeholder="Pesquisar empresa por nome, responsável ou CNPJ..."
        className="bg-transparent outline-none flex-1"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  </div>

  {/* 💻 Tabela Desktop */}
  <div className="hidden overflow-x-auto md:block">
    <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
      <thead className="surface-table-head">
        <tr>
          <th className="px-3 py-1.5 text-left w-[30%]">Empresa (Razão Social)</th>
          <th className="px-3 py-1.5 text-left w-[25%]">Responsável</th>
          <th className="px-3 py-1.5 text-left w-[20%]">CNPJ</th>
          <th className="px-3 py-1.5 text-left w-[15%]">Telefone</th>
          <th className="px-3 py-1.5 text-center w-[10%]">Ações</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
        {filteredCompanies.map((company) => (
          <tr key={company.id} className="surface-table-row hover:bg-slate-100/5 transition-colors">
            <td className="px-3 py-2 font-medium text-emphasis text-left">
              {company.name}
            </td>
            <td className="px-3 py-2 text-muted-strong text-left">
              {company.responsible}
            </td>
            <td className="px-3 py-2 text-muted-strong text-left">
              {maskCNPJ(company.cnpj)}
            </td>
            <td className="px-3 py-2 text-muted-strong text-left">
              {maskPhone(company.phone || "")}
            </td>
            <td className="px-2 py-2 text-center">
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

  {/* 📱 Lista Mobile */}
  <div className="space-y-3 md:hidden">
    {filteredCompanies.map((company) => (
      <div
        key={company.id}
        className="surface-toolbar flex flex-col gap-2 p-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-emphasis font-medium">{company.name}</p>
          <button
            className="btn-secondary btn-sm"
            onClick={() => setSelectedCompany(company)}
          >
            Ver detalhes
          </button>
        </div>
        <div className="grid gap-1 text-xs text-muted-strong">
          <span>CNPJ: {maskCNPJ(company.cnpj)}</span>
          <span>Contato: {company.responsible}</span>
          <span>Telefone: {maskPhone(company.phone || "")}</span>
          <span>E-mail: {company.email || "-"}</span>
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
            
  
  {/* Nome da empresa */}
<label className="flex flex-col col-span-3">
  <span className="text-sm mb-1">Razão Social *</span>
  <input
    name="name"
    required
    value={form.name || ""}
    onChange={handleFormChange}
    className="surface-input"
    placeholder="Ex.: Pousada Bela Vista"
  />
</label>

{/* Responsável */}
<label className="flex flex-col col-span-3">
  <span className="text-sm mb-1">Responsável *</span>
  <input
    name="responsible"
    required
    value={form.responsible || ""}
    onChange={handleFormChange}
    className="surface-input"
    placeholder="Nome do responsável"
  />
</label>

{/* CNPJ */}
<label className="flex flex-col col-span-3">
  <span className="text-sm mb-1">CNPJ *</span>
  <input
    name="cnpj"
    required
    value={maskCNPJ(form.cnpj || "")}
    onChange={handleFormChange}
    className="surface-input"
    placeholder="00.000.000/0000-00"
  />
</label>

{/* Email */}
<label className="flex flex-col col-span-3">
  <span className="text-sm mb-1">E-mail</span>
  <input
    name="email"
    type="email"
    value={form.email || ""}
    onChange={handleFormChange}
    className="surface-input"
    placeholder="contato@empresa.com"
  />
</label>

{/* Telefone */}
<label className="flex flex-col col-span-3">
  <span className="text-sm mb-1">Telefone</span>
  <input
    name="phone"
    value={maskPhone(form.phone || "")}
    onChange={handleFormChange}
    className="surface-input"
    placeholder="(00) 00000-0000"
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
  
              <div className="mt-4 space-y-2 text-sm">
  <p><strong>Responsável:</strong> {selectedCompany.responsible}</p>
  <p><strong>CNPJ:</strong> {maskCNPJ(selectedCompany.cnpj)}</p>
  <p><strong>E-mail:</strong> {selectedCompany.email || "-"}</p>
  <p><strong>Telefone:</strong> {maskPhone(selectedCompany.phone || "")}</p>
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
                className="btn-primary flex items-center gap-1"
                onClick={() => handleEdit(selectedCompany)}
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