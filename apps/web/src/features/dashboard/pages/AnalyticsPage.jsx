
import { useMemo } from "react";
import Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import {
  Package,
  IndianRupee,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import {
  initialInventoryData,
  getStockStatus,
} from "./components/InventoryTable";

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
  const analytics = useMemo(() => {
    const products = initialInventoryData;

    const totalProducts = products.length;

    const totalUnits = products.reduce(
      (sum, product) => sum + product.availableStock,
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + product.availableStock * product.unitPrice,
      0
    );

    const lowStock = products.filter(
      (product) =>
        getStockStatus(
          product.availableStock,
          product.reorderLevel
        ) === "Low Stock"
    ).length;

    const outOfStock = products.filter(
      (product) =>
        getStockStatus(
          product.availableStock,
          product.reorderLevel
        ) === "Out of Stock"
    ).length;

    const categoryMap = {};

    products.forEach((product) => {
      categoryMap[product.category] =
        (categoryMap[product.category] || 0) +
        product.availableStock;
    });

    const categoryData = Object.entries(categoryMap).map(
      ([name, value]) => ({ name, y: value })
    );

    const statusCounts = {
      "In Stock": 0,
      "Low Stock": 0,
      "Out of Stock": 0,
    };

    products.forEach((product) => {
      const status = getStockStatus(
        product.availableStock,
        product.reorderLevel
      );

      statusCounts[status]++;
    });

    const topProducts = [...products]
      .sort(
        (a, b) =>
          b.availableStock * b.unitPrice -
          a.availableStock * a.unitPrice
      )
      .slice(0, 5);

    return {
      totalProducts,
      totalUnits,
      inventoryValue,
      lowStock,
      outOfStock,
      categoryData,
      statusCounts,
      topProducts,
    };
  }, []);

  const categoryOptions = {
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
      categories: analytics.categoryData.map((item) => item.name),
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
        data: analytics.categoryData.map((item) => item.y),
      },
    ],
  };

  const statusOptions = {
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
            y: analytics.statusCounts["In Stock"],
            color: "#4CAF82",
          },
          {
            name: "Low Stock",
            y: analytics.statusCounts["Low Stock"],
            color: GOLD,
          },
          {
            name: "Out of Stock",
            y: analytics.statusCounts["Out of Stock"],
            color: "#E36B6B",
          },
        ],
      },
    ],
  };

  const topProductsOptions = {
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
      categories: analytics.topProducts.map(
        (product) => product.productName
      ),
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
        return `<b>${this.category}</b><br/>Inventory value: ₹${this.y.toLocaleString("en-IN")}`;
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
        data: analytics.topProducts.map(
          (product) =>
            product.availableStock * product.unitPrice
        ),
      },
    ],
  };

  return (
    <div className="dashboard-overview analytics-page">
      <div className="overview-heading">
        <div>
          <h1>Analytics</h1>
          <p>
            Understand your inventory performance and stock distribution.
          </p>
        </div>

        <span className="analytics-demo-label">
          DEMO DATA
        </span>
      </div>

      <div className="dashboard-stats-grid">
        <MetricCard
          title="Inventory Value"
          value={`₹${analytics.inventoryValue.toLocaleString("en-IN")}`}
          description="Current stock value"
          icon={IndianRupee}
        />

        <MetricCard
          title="Total Units"
          value={analytics.totalUnits.toLocaleString("en-IN")}
          description={`${analytics.totalProducts} products`}
          icon={Package}
        />

        <MetricCard
          title="Low Stock Products"
          value={analytics.lowStock}
          description="Products at reorder level"
          icon={AlertTriangle}
        />

        <MetricCard
          title="Out of Stock"
          value={analytics.outOfStock}
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
