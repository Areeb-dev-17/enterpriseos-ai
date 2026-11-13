
import { useEffect, useState } from "react";
import {
  Package,
  Wallet,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

import StatCard from "./components/StatCard";
import InventoryTrendChart from "./components/InventoryTrendChart";
import StockoutRiskTable from "./components/StockoutRiskTable";
import AIInsightCard from "./components/AIInsightCard";

import { getAnalytics } from "../../../services/analyticsService";
import { getStockoutRisks } from "../../../services/stockoutRiskService";
import { getPurchaseOrders } from "../../../services/purchaseOrderService";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    inventoryValue: 0,
    stockoutRisks: 0,
    pendingOrders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [analytics, risks, purchaseOrders] = await Promise.all([
          getAnalytics(controller.signal),
          getStockoutRisks(controller.signal),
          getPurchaseOrders(controller.signal),
        ]);

        const orders = Array.isArray(purchaseOrders)
          ? purchaseOrders
          : purchaseOrders?.orders || [];

        setDashboardData({
          totalProducts: Number(analytics?.summary?.totalProducts || 0),
          inventoryValue: Number(analytics?.summary?.inventoryValue || 0),
          stockoutRisks: Number(risks?.totalRisks || 0),
          pendingOrders: orders.filter(
            (order) => order.status === "Pending"
          ).length,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => controller.abort();
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: loading ? "—" : dashboardData.totalProducts.toLocaleString("en-IN"),
      description: "Products in your inventory",
      icon: Package,
    },
    {
      title: "Inventory Value",
      value: loading ? "—" : formatCurrency(dashboardData.inventoryValue),
      description: "Current inventory valuation",
      icon: Wallet,
    },
    {
      title: "Stockout Risks",
      value: loading ? "—" : dashboardData.stockoutRisks,
      description: "Products need attention",
      icon: AlertTriangle,
    },
    {
      title: "Pending Orders",
      value: loading ? "—" : dashboardData.pendingOrders,
      description: "Awaiting approval",
      icon: ShoppingCart,
    },
  ];

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
          {loading ? "LOADING" : error ? "DATA ERROR" : "LIVE KPIs"}
        </span>
      </div>

      {error && (
        <div className="stockout-risk-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

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
