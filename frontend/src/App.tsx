import { Route, Routes } from "react-router-dom";

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

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/cadastros/hospedes" element={<GuestsPage />} />
        <Route path="/cadastros/empresas" element={<CompaniesPage />} />
        <Route path="/quartos/visao-geral" element={<RoomsOverviewPage />} />
        <Route path="/quartos/manutencao" element={<RoomsMaintenancePage />} />
        <Route
          path="/reservas/movimentos"
          element={<ReservationsMovementsPage />}
        />
        <Route path="/reservas/lista" element={<ReservationsListPage />} />
        <Route
          path="/reservas/calendario"
          element={<ReservationsCalendarPage />}
        />
        <Route
          path="/financeiro/dashboard"
          element={<FinancialDashboardPage />}
        />
        <Route path="/financeiro/receitas" element={<FinancialIncomePage />} />
        <Route
          path="/financeiro/despesas"
          element={<FinancialExpensesPage />}
        />
        <Route path="/admin/consultor-ia" element={<AIConsultantPage />} />
        <Route path="/admin/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
