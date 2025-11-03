import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { setSession } from "../lib/auth"; // 👈 IMPORTANTE

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const baseUrl = "https://pousada-backend-iccs.onrender.com/api";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Usuário ou senha incorretos!");
      }

      const user = await response.json();

      if (!user || !user.role || !user.name) {
        throw new Error("Erro inesperado: resposta inválida do servidor.");
      }

      // ✅ Salva sessão global + localStorage
      login({ name: user.name, role: user.role });
      setSession(user.role, user.name);

      console.log("✅ Login bem-sucedido!", user);

      // ✅ Redireciona após login
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);
      setError(err.message || "Ocorreu um erro ao fazer login. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md text-center border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <Building2 size={48} className="text-blue-600 mb-2" />
          <h2 className="text-gray-800 font-semibold">
            Gestão Hoteleira Simplificada.
          </h2>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Bem-vindo(a)! Insira suas credenciais para acessar o sistema.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center border rounded-lg px-3 py-2 bg-white border-slate-300">
            <Mail size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="E-mail (ex: admin@admin)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center border rounded-lg px-3 py-2 bg-white border-slate-300">
            <Lock size={18} className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <LogIn size={18} /> Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
