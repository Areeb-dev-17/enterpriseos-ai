
import { useLocation } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Command,
} from "lucide-react";

const pageTitles = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Your business operations at a glance.",
  },
  "/dashboard/inventory": {
    title: "Inventory",
    subtitle: "Manage and monitor your inventory.",
  },
  "/dashboard/stockout-risks": {
    title: "Stockout Risks",
    subtitle: "Identify products that need attention.",
  },
  "/dashboard/purchase-orders": {
    title: "Purchase Orders",
    subtitle: "Review and manage replenishment orders.",
  },
  "/dashboard/ai-assistant": {
    title: "AI Assistant",
    subtitle: "Get insights into your business operations.",
  },
  "/dashboard/analytics": {
    title: "Analytics",
    subtitle: "Understand your business performance.",
  },
  "/dashboard/settings": {
    title: "Settings",
    subtitle: "Manage your workspace preferences.",
  },
};

export default function DashboardTopbar() {
  const location = useLocation();

  const page =
    pageTitles[location.pathname] ?? pageTitles["/dashboard"];

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const userName = user?.name || "User";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="dashboard-topbar">
      <div className="topbar-page-info">
        <h1 className="topbar-title">{page.title}</h1>
        <p className="topbar-subtitle">{page.subtitle}</p>
      </div>

      <div className="topbar-actions">
        <label className="topbar-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search anything"
          />

          <span className="search-shortcut">
            <Command size={12} /> K
          </span>
        </label>

        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="notification-indicator" />
        </button>

        <button
          type="button"
          className="topbar-profile"
          aria-label="User profile"
          title={userName}
        >
          <span className="profile-avatar">{initials}</span>

          <span className="profile-details">
            <span className="profile-name">{userName}</span>
            <span className="profile-role">
              {user?.role || "Workspace Member"}
            </span>
          </span>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
