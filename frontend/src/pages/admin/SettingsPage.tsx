import { useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import { Trash2, Plus, Loader2 } from "lucide-react";


const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

interface SettingsData {
  propertyName: string;
  phone: string;
  address: string;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  wifiPassword: string;
  notes: string;
}

interface User {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
}

function SettingsPage() {
  const [openItem, setOpenItem] = useState<string | null>("property");
  const [settings, setSettings] = useState<SettingsData>({
    propertyName: "",
    phone: "",
    address: "",
    currency: "BRL",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    cancellationPolicy: "Cancelamentos devem ser informados com 48h de antecedência.",
    wifiPassword: "",
    notes: "",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState<User>({
    name: "",
    email: "",
    password: "",
    role: "camareira",
  });
  const [showModal, setShowModal] = useState(false);

  // 🔹 Carrega dados iniciais
  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, usersRes] = await Promise.all([
          fetch(`${baseUrl}/settings`),
          fetch(`${baseUrl}/settings/users`),
        ]);
        const settingsData = await settingsRes.json();
        const usersData = await usersRes.json();
        setSettings(settingsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData(); 
  }, []);

  // 🔸 Salvar configurações
  async function handleSaveSettings() {
    try {
      setSaving(true);
      const res = await fetch(`${baseUrl}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Erro ao salvar configurações");
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      alert("Erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  // 🔸 Criar novo usuário
  async function handleAddUser() {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Preencha nome, e-mail e senha!");
      return;
    }
    try {
      const res = await fetch("`${baseUrl}/settings/users`", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Erro ao adicionar usuário");
      const updated = await fetch("`${baseUrl}/settings/users`").then((r) => r.json());
      setUsers(updated);
      setShowModal(false);
      setNewUser({ name: "", email: "", password: "", role: "camareira" });
    } catch (error) {
      alert("Erro ao adicionar usuário");
    }
  }

  // 🔸 Excluir usuário
  async function handleDeleteUser(id?: string) {
    if (!id) return;
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await fetch(`${baseUrl}/settings/users/${id}`, { method: "DELETE" });
      setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      alert("Erro ao excluir usuário.");
    }
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Carregando configurações...
      </div>
    );

  return (
    <div className="space-y-6">
      <Card
        title="Configurações do sistema"
        description="Ajuste as preferências da propriedade e gerencie usuários."
      >
        <div className="space-y-4">
          {/* 🔹 Aba de Configurações da Pousada */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <button
              onClick={() => setOpenItem(openItem === "property" ? null : "property")}
              className="flex w-full justify-between px-5 py-4 text-left font-semibold text-slate-200 hover:text-primary"
            >
              Dados da propriedade
              <span className="text-xs uppercase text-slate-500">
                {openItem === "property" ? "Ocultar" : "Exibir"}
              </span>
            </button>

            {openItem === "property" && (
              <div className="border-t border-slate-800 px-5 py-4 grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Nome da pousada"
                  value={settings.propertyName}
                  onChange={(e) => setSettings({ ...settings, propertyName: e.target.value })}
                  className="surface-input"
                />
                <input
                  placeholder="Telefone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="surface-input"
                />
                <input
                  placeholder="Endereço completo"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="surface-input md:col-span-2"
                />
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="surface-input"
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
                <input
                  type="time"
                  value={settings.checkInTime}
                  onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                  className="surface-input"
                  placeholder="Horário de Check-in"
                />
                <input
                  type="time"
                  value={settings.checkOutTime}
                  onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                  className="surface-input"
                  placeholder="Horário de Check-out"
                />
                <textarea
                  value={settings.cancellationPolicy}
                  onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                  className="surface-input md:col-span-2 h-24"
                  placeholder="Política de cancelamento"
                />
                <input
                  placeholder="Senha do Wi-Fi"
                  value={settings.wifiPassword}
                  onChange={(e) => setSettings({ ...settings, wifiPassword: e.target.value })}
                  className="surface-input"
                />
                <textarea
                  placeholder="Notas adicionais (ex: lembretes internos)"
                  value={settings.notes}
                  onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                  className="surface-input md:col-span-2 h-20"
                />

                <div className="md:col-span-2 flex justify-end mt-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary flex items-center"
                  >
                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                    Salvar configurações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🔹 Aba de Usuários */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
            <button
              onClick={() => setOpenItem(openItem === "users" ? null : "users")}
              className="flex w-full justify-between px-5 py-4 text-left font-semibold text-slate-200 hover:text-primary"
            >
              Usuários, convites e perfis
              <span className="text-xs uppercase text-slate-500">
                {openItem === "users" ? "Ocultar" : "Exibir"}
              </span>
            </button>

            {openItem === "users" && (
              <div className="border-t border-slate-800 px-5 py-4 space-y-4">
                <div className="flex justify-end">
                  <button className="btn-primary flex items-center" onClick={() => setShowModal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Novo usuário
                  </button>
                </div>

                <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                  <thead className="bg-slate-900/50 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Nome</th>
                      <th className="px-4 py-2">E-mail</th>
                      <th className="px-4 py-2">Função</th>
                      <th className="px-4 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                        <td className="px-4 py-3">{u.name}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3 capitalize">{u.role}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 🔹 Modal Novo Usuário */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md border border-slate-700 text-white">
            <h2 className="text-lg font-semibold mb-4">Adicionar novo usuário</h2>
            <div className="space-y-3">
              <input
                placeholder="Nome completo"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="surface-input w-full"
              />
              <input
                placeholder="E-mail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="surface-input w-full"
              />
              <input
                placeholder="Senha"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="surface-input w-full"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="surface-input w-full"
              >
                <option value="camareira">Camareira</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end mt-5 gap-3">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleAddUser}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
