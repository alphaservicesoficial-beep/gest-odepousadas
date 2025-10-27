import { PlusCircle, Search, X } from "lucide-react";
import { FormEvent, useState } from "react";

import Card from "../../components/ui/Card";

const MOCK_COMPANIES = [
  {
    id: "CMP-001",
    name: "Viagens Brasil LTDA",
    cnpj: "12.345.678/0001-00",
    mainContact: "Carlos Pereira",
    email: "carlos@viagensbrasil.com",
    phone: "(11) 95432-1000",
  },
];

function CompaniesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<
    (typeof MOCK_COMPANIES)[number] | null
  >(null);
  const [formValues, setFormValues] = useState({
    name: "",
    cnpj: "",
    mainContact: "",
    email: "",
    phone: "",
  });

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormValues({
      name: "",
      cnpj: "",
      mainContact: "",
      email: "",
      phone: "",
    });
  };

  const openDetailsModal = (company: (typeof MOCK_COMPANIES)[number]) => {
    setSelectedCompany(company);
  };

  const closeDetailsModal = () => setSelectedCompany(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Integração futura com backend.
    closeCreateModal();
  };

  return (
    <div className="space-y-6">
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
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              placeholder="Pesquisar por nome, CNPJ ou contato..."
              className="surface-input pl-9"
            />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <thead className="surface-table-head">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {MOCK_COMPANIES.map((company) => (
                <tr key={company.id} className="surface-table-row">
                  <td className="px-4 py-3 font-medium text-emphasis">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {company.cnpj}
                  </td>
                  <td className="px-4 py-3 text-muted-strong">
                    {company.mainContact}
                  </td>
                  <td className="px-4 py-3 text-muted">{company.email}</td>
                  <td className="px-4 py-3 text-muted">{company.phone}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => openDetailsModal(company)}
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
          {MOCK_COMPANIES.map((company) => (
            <div
              key={company.id}
              className="surface-toolbar flex flex-col gap-2 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-emphasis">{company.name}</p>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => openDetailsModal(company)}
                >
                  Ver detalhes
                </button>
              </div>
              <div className="grid gap-1 text-xs text-muted-strong">
                <span>CNPJ: {company.cnpj}</span>
                <span>Contato: {company.mainContact}</span>
                <span>E-mail: {company.email}</span>
                <span>Telefone: {company.phone}</span>
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
                  Nova empresa
                </h2>
                <p className="text-sm text-muted">
                  Cadastre os dados básicos da empresa parceira.
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
                Razão social
                <input
                  required
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      name: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Ex.: Viagens Brasil LTDA"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                CNPJ
                <input
                  required
                  value={formValues.cnpj}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      cnpj: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="00.000.000/0000-00"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Contato principal
                <input
                  required
                  value={formValues.mainContact}
                  onChange={(event) =>
                    setFormValues((values) => ({
                      ...values,
                      mainContact: event.target.value,
                    }))
                  }
                  className="surface-input mt-2"
                  placeholder="Nome do responsável"
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
                  placeholder="contato@empresa.com"
                />
              </label>

              <label className="block text-sm font-medium text-muted-strong">
                Telefone
                <input
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
                  Salvar empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-[22rem] rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-2xl transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emphasis">
                  Detalhes da empresa
                </h2>
                <p className="text-sm text-muted">
                  Consulte rapidamente os dados cadastrados para esta parceria.
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
                  Razão social
                </p>
                <p className="mt-1 text-emphasis">{selectedCompany.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">CNPJ</p>
                <p className="mt-1">{selectedCompany.cnpj}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">
                  Contato principal
                </p>
                <p className="mt-1">{selectedCompany.mainContact}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">E-mail</p>
                <p className="mt-1 break-words text-muted">
                  {selectedCompany.email}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-soft">Telefone</p>
                <p className="mt-1">{selectedCompany.phone}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={closeDetailsModal}
                aria-label="Fechar detalhes da empresa"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button className="btn-primary btn-sm">Editar empresa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompaniesPage;
