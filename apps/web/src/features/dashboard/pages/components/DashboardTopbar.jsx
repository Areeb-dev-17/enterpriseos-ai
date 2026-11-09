
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  ChevronDown,
  Command,
  LogOut,
} from "lucide-react";

import { logOut } from "../../../auth/services/authService";

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
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logOut();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("organization");

      setIsProfileOpen(false);
      setIsLoggingOut(false);

      navigate("/login", { replace: true });
    }
  };

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

        <div className="profile-menu">
          <button
            type="button"
            className={`topbar-profile ${
              isProfileOpen ? "active" : ""
            }`}
            aria-label="User profile"
            aria-expanded={isProfileOpen}
            title={userName}
            onClick={() =>
              setIsProfileOpen((previous) => !previous)
            }
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

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <span className="profile-dropdown-name">
                  {userName}
                </span>

                <span className="profile-dropdown-email">
                  {user?.email || ""}
                </span>
              </div>

              <div className="profile-dropdown-divider" />

              <button
                type="button"
                className="profile-dropdown-item logout-item"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={16} />

                <span>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
