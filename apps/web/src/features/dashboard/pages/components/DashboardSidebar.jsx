
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  ShoppingCart,
  Bot,
  ChartNoAxesCombined,
  Settings,
  PanelLeftClose,
} from "lucide-react";

const navigation = [
  {
    label: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Inventory",
    path: "/dashboard/inventory",
    icon: Package,
  },
  {
    label: "Stockout Risks",
    path: "/dashboard/stockout-risks",
    icon: AlertTriangle,
  },
  {
    label: "Purchase Orders",
    path: "/dashboard/purchase-orders",
    icon: ShoppingCart,
  },
  {
    label: "AI Assistant",
    path: "/dashboard/ai-assistant",
    icon: Bot,
  },
  {
    label: "Analytics",
    path: "/dashboard/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Settings",
    path: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">E</div>

        <div className="sidebar-brand-copy">
          <span className="sidebar-brand-name">EnterpriseOS</span>
          <span className="sidebar-brand-subtitle">AI OPERATIONS</span>
        </div>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>

      <nav className="sidebar-navigation" aria-label="Main navigation">
        {navigation.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              `sidebar-nav-link${isActive ? " active" : ""}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-plan">
          <div className="sidebar-plan-icon">
            <Bot size={18} />
          </div>

          <div>
            <div className="sidebar-plan-title">AI Intelligence</div>
            <div className="sidebar-plan-description">
              Enterprise workspace
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-collapse-button"
          aria-label="Sidebar collapse is not yet implemented"
          disabled
        >
          <PanelLeftClose size={17} />
        </button>
      </div>
    </aside>
  );
}
