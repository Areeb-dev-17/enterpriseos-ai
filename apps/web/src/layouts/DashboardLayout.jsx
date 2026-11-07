
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../features/dashboard/pages/components/DashboardSidebar";
import DashboardTopbar from "../features/dashboard/pages/components/DashboardTopbar";
import "../features/dashboard/pages/styles/dashboard.css";

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <div className="dashboard-main">
        <DashboardTopbar />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
