import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { AppLayout } from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import CompaniesPage from "./pages/registrations/CompaniesPage";
import GuestsPage from "./pages/registrations/GuestsPage";
import RoomsOverviewPage from "./pages/rooms/RoomsOverviewPage";
import RoomsMaintenancePage from "./pages/rooms/RoomsMaintenancePage";
import ReservationsMovementsPage from "./pages/reservations/ReservationsMovementsPage";
import ReservationsListPage from "./pages/reservations/ReservationsListPage";
import ReservationsCalendarPage from "./pages/reservations/ReservationsCalendarPage";
import FinancialDashboardPage from "./pages/financial/FinancialDashboardPage";
import FinancialIncomePage from "./pages/financial/FinancialIncomePage";
import FinancialExpensesPage from "./pages/financial/FinancialExpensesPage";
import AIConsultantPage from "./pages/admin/AIConsultantPage";
import SettingsPage from "./pages/admin/SettingsPage";
import LoginPage from "./pages/LoginPage";
import { isAuthenticated } from "./lib/auth"; // ✅ Importa a função correta do auth.ts

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  // ✅ Checa o login assim que o app carrega
  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isAuthenticated();
      setAuthenticated(loggedIn);
    };
    checkAuth();
  }, []);

  // 🚀 Evita piscar tela branca (enquanto verifica o estado)
  if (authenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-600">
        Carregando...
      </div>
    );
  }

  return (
    <Routes>
      {/* 🔹 Tela de Login (fora do layout principal) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 🔸 Redirecionamento da raiz "/" */}
      <Route
        path="/"
        element={
          authenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 🔸 Rotas protegidas */}
      {authenticated ? (
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Cadastros */}
          <Route path="/cadastros/hospedes" element={<GuestsPage />} />
          <Route path="/cadastros/empresas" element={<CompaniesPage />} />

          {/* Quartos */}
          <Route path="/quartos/visao-geral" element={<RoomsOverviewPage />} />
          <Route path="/quartos/manutencao" element={<RoomsMaintenancePage />} />

          {/* Reservas */}
          <Route path="/reservas/movimentos" element={<ReservationsMovementsPage />} />
          <Route path="/reservas/lista" element={<ReservationsListPage />} />
          <Route path="/reservas/calendario" element={<ReservationsCalendarPage />} />

          {/* Financeiro */}
          <Route path="/financeiro/dashboard" element={<FinancialDashboardPage />} />
          <Route path="/financeiro/receitas" element={<FinancialIncomePage />} />
          <Route path="/financeiro/despesas" element={<FinancialExpensesPage />} />

          {/* Administração */}
          <Route path="/admin/consultor-ia" element={<AIConsultantPage />} />
          <Route path="/admin/configuracoes" element={<SettingsPage />} />

          {/* Rota fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        // Se não estiver logado
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
