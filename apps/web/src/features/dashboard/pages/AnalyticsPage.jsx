
import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import {
  Package,
  IndianRupee,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import { getAnalytics } from "../../../services/analyticsService";

const GOLD = "#D4AF62";

function MetricCard({ title, value, description, icon: Icon }) {
  return (
    <div className="analytics-metric-card">
      <div className="analytics-metric-top">
        <span>{title}</span>
        <Icon size={19} />
      </div>
      <h2>{value}</h2>
      <p>{description}</p>
    </div>
  );
}

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getAnalytics(controller.signal);
        setAnalytics(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load analytics.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => controller.abort();
  }, []);

  const summary = analytics?.summary;

  const categoryData = useMemo(
    () =>
      (analytics?.categoryData || []).map((item) => ({
        name: item.name,
        y: Number(item.value),
      })),
    [analytics]
  );

  const statusCounts = useMemo(() => {
    const counts = {
      "In Stock": 0,
      "Low Stock": 0,
      "Out of Stock": 0,
    };

    (analytics?.statusData || []).forEach((item) => {
      counts[item.name] = Number(item.value);
    });

    return counts;
  }, [analytics]);

  const topProducts = useMemo(
    () =>
      (analytics?.topProducts || []).map((product) => ({
        ...product,
        availableStock: Number(product.availableStock),
        unitPrice: Number(product.unitPrice),
        inventoryValue: Number(product.inventoryValue),
      })),
    [analytics]
  );

  const categoryOptions = useMemo(
    () => ({
      chart: {
        type: "column",
        backgroundColor: "transparent",
        height: 300,
      },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: categoryData.map((item) => item.name),
        lineColor: "#303030",
        labels: { style: { color: "#A1A1AA" } },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: "#303030",
        labels: { style: { color: "#A1A1AA" } },
      },
      tooltip: {
        backgroundColor: "#181818",
        style: { color: "#F5F5F5" },
        borderColor: "#303030",
      },
      plotOptions: {
        column: {
          borderRadius: 5,
          color: GOLD,
        },
      },
      series: [
        {
          name: "Available Units",
          data: categoryData.map((item) => item.y),
        },
      ],
    }),
    [categoryData]
  );

  const statusOptions = useMemo(
    () => ({
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: 300,
      },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      tooltip: {
        pointFormat:
          "<b>{point.y}</b> products ({point.percentage:.1f}%)",
        backgroundColor: "#181818",
        style: { color: "#F5F5F5" },
        borderColor: "#303030",
      },
      plotOptions: {
        pie: {
          innerSize: "65%",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.y}",
            style: {
              color: "#F5F5F5",
              textOutline: "none",
            },
          },
        },
      },
      series: [
        {
          name: "Products",
          data: [
            {
              name: "In Stock",
              y: statusCounts["In Stock"],
              color: "#4CAF82",
            },
            {
              name: "Low Stock",
              y: statusCounts["Low Stock"],
              color: GOLD,
            },
            {
              name: "Out of Stock",
              y: statusCounts["Out of Stock"],
              color: "#E36B6B",
            },
          ],
        },
      ],
    }),
    [statusCounts]
  );

  const topProductsOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        backgroundColor: "transparent",
        height: 300,
      },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: topProducts.map((product) => product.productName),
        lineColor: "#303030",
        labels: {
          style: { color: "#A1A1AA" },
        },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: "#303030",
        labels: {
          style: { color: "#A1A1AA" },
        },
      },
      tooltip: {
        backgroundColor: "#181818",
        style: { color: "#F5F5F5" },
        borderColor: "#303030",
        formatter: function () {
          return `<b>${this.category}</b><br/>Inventory value: ₹${Number(
            this.y
          ).toLocaleString("en-IN")}`;
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          color: GOLD,
        },
      },
      series: [
        {
          name: "Inventory Value",
          data: topProducts.map((product) => product.inventoryValue),
        },
      ],
    }),
    [topProducts]
  );

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="dashboard-overview analytics-page">
        <div className="overview-heading">
          <div>
            <h1>Analytics</h1>
            <p>Loading your inventory analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-overview analytics-page">
        <div className="overview-heading">
          <div>
            <h1>Analytics</h1>
            <p>Unable to load inventory analytics.</p>
          </div>
        </div>
        <p role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview analytics-page">
      <div className="overview-heading">
        <div>
          <h1>Analytics</h1>
          <p>
            Understand your inventory performance and stock distribution.
          </p>
        </div>

        <span className="analytics-demo-label">LIVE DATA</span>
      </div>

      <div className="dashboard-stats-grid">
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(summary?.inventoryValue)}
          description="Current stock value"
          icon={IndianRupee}
        />

        <MetricCard
          title="Total Units"
          value={Number(summary?.totalUnits || 0).toLocaleString("en-IN")}
          description={`${summary?.totalProducts || 0} products`}
          icon={Package}
        />

        <MetricCard
          title="Low Stock Products"
          value={Number(summary?.lowStock || 0)}
          description="Products at reorder level"
          icon={AlertTriangle}
        />

        <MetricCard
          title="Out of Stock"
          value={Number(summary?.outOfStock || 0)}
          description="Products requiring attention"
          icon={XCircle}
        />
      </div>

      <div className="analytics-charts-grid">
        <div className="dashboard-panel analytics-chart-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Category Distribution</h3>
              <p>Available units across product categories</p>
            </div>
          </div>

          <HighchartsReact
            highcharts={Highcharts}
            options={categoryOptions}
          />
        </div>

        <div className="dashboard-panel analytics-chart-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Stock Status</h3>
              <p>Product availability breakdown</p>
            </div>
          </div>

          <HighchartsReact
            highcharts={Highcharts}
            options={statusOptions}
          />
        </div>

        <div className="dashboard-panel analytics-chart-panel analytics-wide-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Top Products by Inventory Value</h3>
              <p>Products with the highest current stock value</p>
            </div>
          </div>

          <HighchartsReact
            highcharts={Highcharts}
            options={topProductsOptions}
          />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
