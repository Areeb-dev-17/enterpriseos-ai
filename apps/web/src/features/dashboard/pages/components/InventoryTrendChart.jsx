
import Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";

const inventoryData = [
  { month: "May", value: 38.2 },
  { month: "Jun", value: 40.5 },
  { month: "Jul", value: 39.8 },
  { month: "Aug", value: 43.1 },
  { month: "Sep", value: 45.4 },
  { month: "Oct", value: 48.6 },
];

const options = {
  chart: {
    type: "areaspline",
    backgroundColor: "transparent",
    height: 280,
    style: {
      fontFamily: "Inter, sans-serif",
    },
    spacing: [15, 5, 5, 5],
  },

  title: {
    text: null,
  },

  credits: {
    enabled: false,
  },

  exporting: {
    enabled: false,
  },

  xAxis: {
    categories: inventoryData.map((item) => item.month),
    lineColor: "#303030",
    tickColor: "transparent",
    tickLength: 0,
    labels: {
      style: {
        color: "#A1A1AA",
        fontSize: "11px",
      },
    },
  },

  yAxis: {
    title: {
      text: null,
    },
    gridLineColor: "#292929",
    labels: {
      style: {
        color: "#777777",
        fontSize: "10px",
      },
      formatter() {
        return `₹${this.value}L`;
      },
    },
  },

  tooltip: {
    backgroundColor: "#202020",
    borderColor: "#D4AF62",
    borderRadius: 8,
    style: {
      color: "#F5F5F5",
    },
    pointFormat:
      '<span style="color:#D4AF62">●</span> Inventory value: <b>₹{point.y}L</b>',
  },

  legend: {
    enabled: false,
  },

  plotOptions: {
    areaspline: {
      lineWidth: 2.5,
      marker: {
        enabled: false,
        symbol: "circle",
        radius: 4,
        fillColor: "#D4AF62",
        lineWidth: 2,
        lineColor: "#181818",
      },
      states: {
        hover: {
          lineWidth: 3,
        },
      },
      fillColor: {
        linearGradient: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 1,
        },
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
        condition: {
          maxWidth: 500,
        },
        chartOptions: {
          chart: {
            height: 230,
          },
        },
      },
    ],
  },
};

export default function InventoryTrendChart() {
  return (
    <div className="inventory-trend-chart">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
      />
    </div>
  );
}
