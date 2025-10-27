import { useState } from "react";

import Card from "../../components/ui/Card";

const ACCORDION_ITEMS = [
  {
    key: "property",
    title: "Dados da propriedade",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          Nome da pousada
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            placeholder="Pousada Mar Azul"
          />
        </label>
        <label className="text-sm text-slate-300">
          Telefone
          <input
            type="tel"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            placeholder="(11) 99999-8888"
          />
        </label>
        <label className="text-sm text-slate-300 md:col-span-2">
          Endereço
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            placeholder="Rua das Flores, 123"
          />
        </label>
        <div className="md:col-span-2">
          <p className="text-sm text-slate-400">
            Uploads (logo, assinatura, plano de fundo)
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-primary hover:text-primary">
              Enviar logo
            </button>
            <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-primary hover:text-primary">
              Enviar assinatura
            </button>
            <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-primary hover:text-primary">
              Enviar plano de fundo
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "rooms",
    title: "Detalhes globais de quartos",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-slate-200">Amenidades</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm">
              <span>Wi-Fi</span>
              <button className="text-xs text-primary">Editar</button>
            </div>
            <button className="w-full rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-primary hover:text-primary">
              Nova amenidade
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">Tipos de quarto</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2 text-sm">
              <span>Deluxe</span>
              <button className="text-xs text-primary">Editar</button>
            </div>
            <button className="w-full rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-primary hover:text-primary">
              Novo tipo
            </button>
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-slate-200">
            Formas de pagamento aceitas
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Cartão de crédito
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> PIX
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Dinheiro
            </label>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "proximity",
    title: "Gestão de proximidades",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300">
          Categorias de pontos de interesse (Lucide Icons disponíveis para cada
          categoria).
        </p>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
          <p className="font-medium">Praias</p>
          <p className="text-xs text-slate-400">Ícone atual: `Waves`</p>
        </div>
        <button className="rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-primary hover:text-primary">
          Nova categoria
        </button>
      </div>
    ),
  },
  {
    key: "users",
    title: "Usuários, convites e perfis",
    content: (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary/90">
            Convidar novo usuário
          </button>
          <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-primary hover:text-primary">
            Gerenciar papéis
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr className="hover:bg-slate-900/40">
                <td className="px-4 py-3">Usuário Demo</td>
                <td className="px-4 py-3">demo@inn.app</td>
                <td className="px-4 py-3">Gerente</td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-300 hover:border-primary hover:text-primary">
                    Editar permissões
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    key: "notifications",
    title: "Notificações",
    content: (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
          <span>E-mail</span>
          <input type="checkbox" defaultChecked />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
          <span>In-app</span>
          <input type="checkbox" defaultChecked />
        </label>
        <div className="md:col-span-2">
          <p className="text-sm text-slate-400">
            Planos para controles granulares por evento.
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "system",
    title: "Saúde do sistema e logs",
    content: (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Sistema operacional • OK
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
          Backups automáticos: Diários às 23h00
        </div>
        <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-primary hover:text-primary">
          Acessar logs
        </button>
      </div>
    ),
  },
  {
    key: "integrations",
    title: "APIs e integrações",
    content: (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-sm text-slate-300">
        <p>
          Espaço reservado para integrações futuras (Channel Managers, Gateways
          de Pagamento etc.).
        </p>
      </div>
    ),
  },
  {
    key: "backup",
    title: "Backup e restauração",
    content: (
      <div className="space-y-3 text-sm text-slate-300">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
          <p>Último backup automático: 12/10/2025 23:00</p>
          <p>Próximo agendado: 13/10/2025 23:00</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-primary hover:text-primary">
            Iniciar backup manual
          </button>
          <button className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-slate-200 hover:border-primary hover:text-primary">
            Restaurar backup
          </button>
        </div>
      </div>
    ),
  },
];

function SettingsPage() {
  const [openItem, setOpenItem] = useState<string | null>("property");

  return (
    <div className="space-y-6">
      <Card
        title="Configurações do sistema"
        description="Ajuste todas as preferências da propriedade."
      >
        <div className="space-y-4">
          {ACCORDION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-slate-800 bg-slate-900/60"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenItem((prev) => (prev === item.key ? null : item.key))
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-200 hover:text-primary"
              >
                {item.title}
                <span className="text-xs uppercase text-slate-500">
                  {openItem === item.key ? "Ocultar" : "Exibir"}
                </span>
              </button>
              {openItem === item.key && (
                <div className="border-t border-slate-800 px-5 py-4 text-sm">
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default SettingsPage;
