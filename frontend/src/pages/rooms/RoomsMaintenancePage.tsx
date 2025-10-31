import { Search, X } from "lucide-react";
import { FormEvent, useState, useEffect, useMemo, useCallback } from "react";
// 🔹 Importações do Firebase
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc, // Para tarefas concluídas, embora updateDoc + filtro seja melhor
} from "firebase/firestore";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

// 🔹 Tipagens (Herdadas do RoomsOverviewPage)
type MaintenanceStatus = "aberta" | "em andamento" | "concluída";
type MaintenancePriority = "baixa" | "média" | "alta";

type MaintenanceTask = {
  id: string;
  roomId: string; // ID do quarto no 'rooms'
  roomIdentifier: string; // Identificador do quarto (ex: "101")
  issue: string; // Descrição do problema
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  openedAt: string; // Data de abertura (ISO ou Timestamp)
  completedOn: string; // Data de conclusão (string 'YYYY-MM-DD' ou '-')
};

const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

// Mapeamento para Status Badge
const PRIORITY_TONE = {
  alta: "danger",
  média: "warning",
  baixa: "info",
} as const;

const STATUS_TONE = {
  aberta: "warning", // Tarefas recém-criadas (pendentes)
  "em andamento": "info",
  concluída: "success",
} as const;


function RoomsMaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔹 Estados de Filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | "" >("");
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | "" >("");

  // 🔹 Estados do Modal de Atualização
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = useMemo(() => 
    tasks.find((task) => task.id === selectedTaskId) ?? null
  , [selectedTaskId, tasks]);

  const [updateForm, setUpdateForm] = useState<{
    status: MaintenanceStatus;
    completedOn: string;
    notes: string; // Novo campo para notas adicionais
  }>({
    status: "em andamento",
    completedOn: "",
    notes: "",
  });

  // ----------------------------------------------------
  // 🔹 1. LÓGICA DE CARREGAMENTO (CRUD - Read)
  // ----------------------------------------------------
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/maintenance`);
      if (!response.ok) throw new Error("Erro ao carregar manutenções");
  
      const data: MaintenanceTask[] = await response.json(); // ✅ Tipando o retorno
      const sorted = data.sort((a, b) => {
        const priorities = { alta: 3, média: 2, baixa: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });
  
      setTasks(sorted);
    } catch (error) {
      console.error("Erro ao buscar manutenções:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ----------------------------------------------------
  // 🔹 LÓGICA DE FILTRAGEM (Front-end)
  // ----------------------------------------------------
  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
        
        // Filtro de Status: Se o filtro for "concluída", mostra concluídas. Se não, oculta concluídas.
        const matchesStatus = statusFilter 
            ? task.status === statusFilter 
            : task.status !== "concluída"; // Esconde as concluídas por padrão
            
        const matchesPriority = priorityFilter
            ? task.priority === priorityFilter
            : true;

        const matchesSearch =
            !normalizedSearch ||
            task.roomIdentifier.toLowerCase().includes(normalizedSearch) ||
            task.issue.toLowerCase().includes(normalizedSearch);
            
        return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchTerm, statusFilter, priorityFilter, tasks]);


  // ----------------------------------------------------
  // 🔹 LÓGICA DO MODAL (Update)
  // ----------------------------------------------------
  const openModal = (task: MaintenanceTask) => {
    setSelectedTaskId(task.id);
    setUpdateForm({
      status: task.status,
      completedOn: task.completedOn !== "-" ? task.completedOn : "",
      notes: "", // As notas não são salvas no estado da tarefa, mas podem ser adicionadas ao log
    });
  };
  
  const closeModal = () => {
    setSelectedTaskId(null);
    setUpdateForm({
      status: "em andamento",
      completedOn: "",
      notes: "",
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  
    if (!selectedTask) return;
  
    try {
      const newStatus = updateForm.status as MaintenanceStatus;
      const newCompletedOn = newStatus === "concluída" ? updateForm.completedOn : "";
  
      // 🔹 Envia atualização para o backend FastAPI
      const response = await fetch(`${baseUrl}/maintenance/${selectedTask.id}?status=${newStatus}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: updateForm.notes,
          completedOn: newCompletedOn,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Erro ao atualizar manutenção");
      }
  
      const result = await response.json();
      console.log("✅ Atualização feita:", result);
  
      alert(result.message || "Manutenção atualizada com sucesso!");
  
      // 🔄 Atualiza lista
      closeModal();
      await loadTasks();
  
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      alert("Erro ao salvar atualização. Verifique o console.");
    }
  };
  

  return (
    <div className="space-y-6">
      <Card
        title="Manutenções"
        description="Gerencie as tarefas abertas, em andamento e concluídas. As tarefas concluídas são ocultadas por padrão."
      >
        {/* Filtros */}
        <div className="mb-4 grid gap-4 md:grid-cols-3">
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
          
          {/* Filtro de Status */}
          <select 
            className="surface-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | "")}
          >
            <option value="">Status (Padrão: Abertas/Andamento)</option>
            <option value="aberta">Abertas (Pendentes)</option>
            <option value="em andamento">Em andamento</option>
            <option value="concluída">Concluídas (Ver histórico)</option>
          </select>
          
          {/* Filtro de Prioridade */}
          <select 
            className="surface-input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as MaintenancePriority | "")}
          >
            <option value="">Todas as Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="média">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        
        {loading && <p className="text-center p-6 text-muted-strong">Carregando tarefas...</p>}
        
        {/* Tabela (Desktop) */}
        {!loading && (
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="surface-table-head">
                  <tr>
                    <th className="px-4 py-3">Quarto</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reportado em</th>
                    <th className="px-4 py-3">Concluído em</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
                  {filteredTasks.length === 0 && (
                      <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted">
                              Nenhuma tarefa de manutenção encontrada com os filtros atuais.
                          </td>
                      </tr>
                  )}
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="surface-table-row">
                      <td className="px-4 py-3 font-medium text-emphasis">
                        {task.roomIdentifier}
                      </td>
                      <td className="px-4 py-3 text-muted-strong">
                        {task.issue}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={task.priority}
                          status={PRIORITY_TONE[task.priority]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={task.status}
                          status={STATUS_TONE[task.status]}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">{task.openedAt}</td>
                      <td className="px-4 py-3 text-muted">{task.completedOn}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="btn-secondary btn-sm uppercase tracking-wide"
                          onClick={() => openModal(task)}
                          disabled={task.status === 'concluída'}
                        >
                          {task.status === 'concluída' ? 'Concluída' : 'Atualizar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}

        {/* Cards (Mobile) */}
        {!loading && (
            <div className="space-y-3 md:hidden">
              {filteredTasks.length === 0 && (
                  <p className="p-4 text-center text-muted">
                      Nenhuma tarefa de manutenção encontrada com os filtros atuais.
                  </p>
              )}
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="surface-toolbar flex flex-col gap-3 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emphasis">
                      Quarto {task.roomIdentifier}
                    </span>
                    <StatusBadge
                      label={task.priority}
                      status={PRIORITY_TONE[task.priority]}
                    />
                  </div>
                  <p className="text-sm text-muted-strong">{task.issue}</p>
                  <div className="flex items-center justify-between">
                    <StatusBadge
                      label={task.status}
                      status={STATUS_TONE[task.status]}
                    />
                    <button
                      className="btn-secondary btn-sm uppercase tracking-wide"
                      onClick={() => openModal(task)}
                      disabled={task.status === 'concluída'}
                    >
                      {task.status === 'concluída' ? 'Concluída' : 'Atualizar'}
                    </button>
                  </div>
                  <div className="grid gap-1 text-xs text-muted">
                    <span>Reportado em: {task.openedAt}</span>
                    <span>Concluído em: {task.completedOn}</span>
                  </div>
                </div>
              ))}
            </div>
        )}
      </Card>

      {/* Modal de Atualização */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Atualizar manutenção
                </h2>
                <p className="text-sm text-muted">
                  Ajuste o status ou informe conclusão para a tarefa do quarto{" "}
                  {selectedTask.roomIdentifier}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-muted-strong">
                Status
                <select
                  required
                  value={updateForm.status}
                  onChange={(event) => {
                    const newStatus = event.target.value as MaintenanceStatus;
                    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
                    
                    setUpdateForm((values) => ({
                      ...values,
                      status: newStatus,
                      // Preenche a data se mudar para 'concluída'
                      completedOn: newStatus === "concluída" ? today : "", 
                    }));
                  }}
                  className="surface-input mt-2"
                >
                  <option value="aberta">Aberto (Pendente)</option>
                  <option value="em andamento">Em andamento</option>
                  <option value="concluída">Concluído</option>
                </select>
              </label>

              {/* Só mostra o campo de data se o status não for concluído ou a data já estiver preenchida */}
              <label className={`block text-sm font-medium text-muted-strong ${updateForm.status !== 'concluída' ? 'opacity-50' : ''}`}>
                Concluído em
                <input
                  type="date"
                  required={updateForm.status === 'concluída'}
                  value={updateForm.completedOn}
                  onChange={(event) =>
                    setUpdateForm((values) => ({
                      ...values,
                      completedOn: event.target.value,
                    }))
                  }
                  // Desabilita se o status não for 'concluída'
                  disabled={updateForm.status !== 'concluída'} 
                  className="surface-input mt-2"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Notas adicionais
                <textarea
                  rows={3}
                  value={updateForm.notes}
                  onChange={(event) =>
                    setUpdateForm((values) => ({
                      ...values,
                      notes: event.target.value,
                    }))
                  }
                  className="surface-input mt-2 resize-none"
                  placeholder="Informe detalhes importantes sobre a intervenção realizada."
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar atualização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsMaintenancePage;