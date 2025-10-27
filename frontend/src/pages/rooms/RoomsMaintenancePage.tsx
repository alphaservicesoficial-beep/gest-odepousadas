import { Search, X } from "lucide-react";
import { FormEvent, useState } from "react";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

const MAINTENANCE_TASKS = [
  {
    id: "MT-001",
    room: "101",
    description: "Revisar ar-condicionado",
    priority: "alta",
    status: "em andamento",
    reportedOn: "10/10/2025",
    completedOn: "-",
  },
  {
    id: "MT-002",
    room: "305",
    description: "Troca de enxoval",
    priority: "média",
    status: "pendente",
    reportedOn: "12/10/2025",
    completedOn: "-",
  },
];

function RoomsMaintenancePage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: "em andamento",
    completedOn: "",
    notes: "",
  });

  const selectedTask = selectedTaskId
    ? (MAINTENANCE_TASKS.find((task) => task.id === selectedTaskId) ?? null)
    : null;

  const closeModal = () => {
    setSelectedTaskId(null);
    setUpdateForm({
      status: "em andamento",
      completedOn: "",
      notes: "",
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Integração futura: atualizar status da tarefa no backend.
    closeModal();
  };

  return (
    <div className="space-y-6">
      <Card
        title="Manutenções"
        description="Gerencie as tarefas abertas, em andamento e concluídas."
      >
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Buscar por quarto ou descrição..."
              className="surface-input pl-9"
            />
          </div>
          <select className="surface-input">
            <option value="">Status</option>
            <option value="pendente">Pendente</option>
            <option value="em andamento">Em andamento</option>
            <option value="concluído">Concluído</option>
          </select>
          <select className="surface-input">
            <option value="">Prioridade</option>
            <option value="baixa">Baixa</option>
            <option value="média">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

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
              {MAINTENANCE_TASKS.map((task) => (
                <tr key={task.id} className="surface-table-row">
                  <td className="px-4 py-3 font-medium text-emphasis">
                    {task.room}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {task.description}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={task.priority}
                      status={
                        task.priority === "alta"
                          ? "danger"
                          : task.priority === "média"
                            ? "warning"
                            : "info"
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={task.status}
                      status={
                        task.status === "concluído" ? "success" : "warning"
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">{task.reportedOn}</td>
                  <td className="px-4 py-3 text-muted">{task.completedOn}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn-secondary btn-sm uppercase tracking-wide"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      Atualizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {MAINTENANCE_TASKS.map((task) => (
            <div
              key={task.id}
              className="surface-toolbar flex flex-col gap-3 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emphasis">
                  Quarto {task.room}
                </span>
                <StatusBadge
                  label={task.priority}
                  status={
                    task.priority === "alta"
                      ? "danger"
                      : task.priority === "média"
                        ? "warning"
                        : "info"
                  }
                />
              </div>
              <p className="text-sm text-muted-strong">{task.description}</p>
              <div className="flex items-center justify-between">
                <StatusBadge
                  label={task.status}
                  status={task.status === "concluído" ? "success" : "warning"}
                />
                <button
                  className="btn-secondary btn-sm uppercase tracking-wide"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  Atualizar
                </button>
              </div>
              <div className="grid gap-1 text-xs text-muted">
                <span>Reportado em: {task.reportedOn}</span>
                <span>Concluído em: {task.completedOn}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
                  {selectedTask.room}.
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
                  value={updateForm.status}
                  onChange={(event) =>
                    setUpdateForm((values) => ({
                      ...values,
                      status: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                >
                  <option value="pendente">Pendente</option>
                  <option value="em andamento">Em andamento</option>
                  <option value="concluído">Concluído</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Concluído em
                <input
                  type="date"
                  value={updateForm.completedOn}
                  onChange={(event) =>
                    setUpdateForm((values) => ({
                      ...values,
                      completedOn: event.target.value,
                    }))
                  }
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
                  className="surface-input mt-2"
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
