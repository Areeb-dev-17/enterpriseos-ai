
import { Navigate, Route, Routes } from "react-router-dom";

import AuthPage from "./features/auth/pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import InventoryPage from "./features/dashboard/pages/InventoryPage";
import StockoutRisksPage from "./features/dashboard/pages/StockoutRisksPage";
import PurchaseOrdersPage from "./features/dashboard/pages/PurchaseOrdersPage";
import AIAssistantPage from "./features/dashboard/pages/AIAssistantPage";
import AnalyticsPage from "./features/dashboard/pages/AnalyticsPage";
import SettingsPage from "./features/dashboard/pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="stockout-risks" element={<StockoutRisksPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* <Route path="*" element={<Navigate to="/login" replace />} /> */}
    </Routes>
  );
}

export default App;
