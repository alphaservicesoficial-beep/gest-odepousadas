import { Route, Routes, Navigate } from "react-router-dom";
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

import { useAuth } from "./context/AuthContext"; // ✅ Usando o contexto global

export default function App() {
  const { isAuthenticated, loading } = useAuth(); // ✅ Agora observa o estado global

  // 🚀 Mostra um loading enquanto o contexto verifica o localStorage
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-600">
        Carregando sessão...
      </div>
    );
  }

  return (
    <Routes>
      {/* 🔹 Tela de Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* 🔸 Raiz */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 🔒 Rotas protegidas */}
      {isAuthenticated ? (
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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
