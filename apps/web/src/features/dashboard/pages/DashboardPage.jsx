
import {
  Package,
  Wallet,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

import StatCard from "../pages/components/StatCard";
import InventoryTrendChart from "../pages/components/InventoryTrendChart";
import StockoutRiskTable from "./components/StockoutRiskTable";
import AIInsightCard from "./components/AIInsightCard";

const stats = [
  {
    title: "Total Products",
    value: "2,450",
    change: "+8.2%",
    description: "vs. last month",
    icon: Package,
    trend: "up",
  },
  {
    title: "Inventory Value",
    value: "₹48.6L",
    change: "+5.4%",
    description: "vs. last month",
    icon: Wallet,
    trend: "up",
  },
  {
    title: "Stockout Risks",
    value: "18",
    change: "+3",
    description: "products need attention",
    icon: AlertTriangle,
    trend: "down",
  },
  {
    title: "Pending Orders",
    value: "12",
    change: "-2",
    description: "awaiting approval",
    icon: ShoppingCart,
    trend: "up",
  },
];

export default function DashboardPage() {
  return (
    <div className="dashboard-overview">
      <div className="overview-heading">
        <div>
          <h2>Business Overview</h2>
          <p>
            Monitor your inventory performance and operational health.
          </p>
        </div>

        <span className="demo-data-label">
          DEMO DATA
        </span>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <section className="dashboard-panel inventory-trend-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>Inventory Value Trend</h3>
          <p>Monthly inventory valuation over time</p>
        </div>

        <span className="panel-period">Last 6 months</span>
      </div>

      <InventoryTrendChart />
    </section>
    <StockoutRiskTable />
    <AIInsightCard />
    </div>
  );
}
