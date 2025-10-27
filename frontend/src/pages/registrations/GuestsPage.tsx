import { PlusCircle, Search, X } from "lucide-react";
import { FormEvent, useState } from "react";

import Card from "../../components/ui/Card";

const MOCK_GUESTS = [
  {
    id: "GST-001",
    fullName: "Maria Silva",
    cpf: "123.456.789-00",
    email: "maria.silva@example.com",
    phone: "(11) 91234-5678",
  },
  {
    id: "GST-002",
    fullName: "Ednara Morinho",
    cpf: "RG: Jai Ronaldo",
    email: "ednara.morinho@example.com",
    phone: "(00) 00000-0000",
  },
];

function GuestsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<
    (typeof MOCK_GUESTS)[number] | null
  >(null);
  const [formValues, setFormValues] = useState({
    fullName: "",
    cpf: "",
    email: "",
    phone: "",
  });

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormValues({
      fullName: "",
      cpf: "",
      email: "",
      phone: "",
    });
  };

  const openDetailsModal = (guest: (typeof MOCK_GUESTS)[number]) => {
    setSelectedGuest(guest);
  };

  const closeDetailsModal = () => setSelectedGuest(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Integração futura: enviar dados para o backend e atualizar a lista.
    closeCreateModal();
  };

  return (
    <div className="space-y-6">
      <Card
        title="Cadastros de Hóspedes"
        description="Gerencie os registros dos hóspedes e envie links de pré check-in."
        headerAction={
          <button className="btn-primary gap-2" onClick={openCreateModal}>
            <PlusCircle size={18} />
            Novo hóspede
          </button>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Pesquisar por nome, CPF ou telefone..."
              className="surface-input pl-9"
            />
          </div>
          <button className="btn-secondary">Copiar link pré check-in</button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nome completo</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {MOCK_GUESTS.map((guest) => (
                <tr key={guest.id} className="surface-table-row">
                  <td className="px-4 py-3 text-xs font-semibold text-muted-strong">
                    {guest.id}
                  </td>
                  <td className="px-4 py-3 text-emphasis">{guest.fullName}</td>
                  <td className="px-4 py-3 text-muted-strong">{guest.cpf}</td>
                  <td className="px-4 py-3 text-muted">{guest.email}</td>
                  <td className="px-4 py-3 text-muted">{guest.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => openDetailsModal(guest)}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {MOCK_GUESTS.map((guest) => (
            <div
              key={guest.id}
              className="surface-toolbar flex flex-col gap-2 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-soft">
                  {guest.id}
                </span>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => openDetailsModal(guest)}
                >
                  Ver detalhes
                </button>
              </div>
              <div>
                <p className="text-emphasis">{guest.fullName}</p>
                <p className="text-muted text-sm">{guest.email}</p>
              </div>
              <div className="grid gap-1 text-xs text-muted-strong sm:grid-cols-2">
                <span>CPF: {guest.cpf}</span>
                <span>Telefone: {guest.phone}</span>
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
                  Novo hóspede
                </h2>
                <p className="text-sm text-muted">
                  Preencha os dados principais para criar o cadastro do hóspede.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-muted-strong">
                Nome completo
                <input
                  type="text"
                  required
                  value={formValues.fullName}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      fullName: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Ex.: João da Silva"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                CPF / Documento
                <input
                  type="text"
                  required
                  value={formValues.cpf}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      cpf: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="000.000.000-00"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                E-mail
                <input
                  type="email"
                  required
                  value={formValues.email}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      email: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="nome@empresa.com"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Telefone
                <input
                  type="tel"
                  required
                  value={formValues.phone}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      phone: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="(00) 00000-0000"
                />
              </label>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar hóspede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Detalhes do hóspede
                </h2>
                <p className="text-sm text-muted">
                  Informações cadastradas para consulta rápida.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetailsModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-strong">
              <div>
                <p className="text-xs uppercase text-muted-soft">
                  Nome completo
                </p>
                <p className="mt-1 text-emphasis">{selectedGuest.fullName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Documento</p>
                <p className="mt-1">{selectedGuest.cpf}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">E-mail</p>
                <p className="mt-1 break-words text-muted">
                  {selectedGuest.email}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Telefone</p>
                <p className="mt-1">{selectedGuest.phone}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={closeDetailsModal}
                aria-label="Fechar detalhes do hóspede"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button className="btn-primary btn-sm">Editar hóspede</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestsPage;
