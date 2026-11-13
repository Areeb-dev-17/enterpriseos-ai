import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import { getInventoryTrend } from "../../../../services/inventoryTrendService";

export default function InventoryTrendChart() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrend = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getInventoryTrend(6, controller.signal);

        setInventoryData(
          data.map((item) => ({
            month: item.month,
            value: Number(item.inventoryValue),
          }))
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch inventory trend:", err);
          setError(err.message || "Failed to load inventory trend");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTrend();

    return () => controller.abort();
  }, []);

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        backgroundColor: "transparent",
        height: 280,
        style: { fontFamily: "Inter, sans-serif" },
        spacing: [15, 5, 5, 5],
      },
      title: { text: null },
      credits: { enabled: false },
      exporting: { enabled: false },
      xAxis: {
        categories: inventoryData.map((item) => item.month),
        lineColor: "#303030",
        tickColor: "transparent",
        tickLength: 0,
        labels: {
          style: { color: "#A1A1AA", fontSize: "11px" },
        },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: "#292929",
        labels: {
          style: { color: "#777777", fontSize: "10px" },
          formatter() {
            return `₹${(this.value / 100000).toFixed(1)}L`;
          },
        },
      },
      tooltip: {
        backgroundColor: "#202020",
        borderColor: "#D4AF62",
        borderRadius: 8,
        style: { color: "#F5F5F5" },
        pointFormat:
          '<span style="color:#D4AF62">●</span> Inventory value: <b>₹{point.y:,.2f}</b>',
      },
      legend: { enabled: false },
      plotOptions: {
        areaspline: {
          lineWidth: 2.5,
          marker: {
            enabled: true,
            symbol: "circle",
            radius: 4,
            fillColor: "#D4AF62",
            lineWidth: 2,
            lineColor: "#181818",
          },
          states: {
            hover: { lineWidth: 3 },
          },
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "rgba(212,175,98,0.25)"],
              [1, "rgba(212,175,98,0.01)"],
            ],
          },
        },
      },
      series: [
        {
          name: "Inventory Value",
          data: inventoryData.map((item) => item.value),
          color: "#D4AF62",
        },
      ],
      responsive: {
        rules: [
          {
            condition: { maxWidth: 500 },
            chartOptions: { chart: { height: 230 } },
          },
        ],
      },
    }),
    [inventoryData]
  );

  if (loading) {
    return <div className="inventory-trend-chart">Loading inventory trend...</div>;
  }

  if (error) {
    return <div className="inventory-trend-chart">{error}</div>;
  }

  if (inventoryData.length === 0) {
    return (
      <div className="inventory-trend-chart">
        No historical inventory data available yet. Daily tracking has started.
      </div>
    );
  }

  return (
    <div className="inventory-trend-chart">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}