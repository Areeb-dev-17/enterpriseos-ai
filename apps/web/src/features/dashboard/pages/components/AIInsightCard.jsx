
import { useEffect, useState } from "react";
import {
  Bot,
  AlertTriangle,
  TrendingUp,
  PackageCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getStockoutRisks } from "../../../../services/stockoutRiskService";
import { getPurchaseOrders } from "../../../../services/purchaseOrderService";

export default function AIInsightCard() {
  const navigate = useNavigate();

  const [risks, setRisks] = useState([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError("");

        const [riskData, orderData] = await Promise.all([
          getStockoutRisks(controller.signal),
          getPurchaseOrders(controller.signal),
        ]);

        setRisks(riskData?.products ?? []);

        const orders = Array.isArray(orderData)
          ? orderData
          : orderData?.orders ?? [];

        setPendingOrders(
          orders.filter((order) => order.status === "Pending").length
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load dashboard insights:", err);
          setError(err.message || "Unable to load operational insights.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInsights();

    return () => controller.abort();
  }, []);

  const criticalProducts = risks.filter(
    (product) => product.riskLevel === "Critical"
  );

  const highRiskProducts = risks.filter(
    (product) => product.riskLevel === "High"
  );

  const mediumRiskProducts = risks.filter(
    (product) => product.riskLevel === "Medium"
  );

  const insights = [];

  if (criticalProducts.length > 0) {
    insights.push({
      id: "critical",
      type: "critical",
      icon: AlertTriangle,
      title: "Critical Stockout Alert",
      description: `${criticalProducts.length} products are currently out of stock: ${criticalProducts
        .slice(0, 3)
        .map((product) => product.productName)
        .join(", ")}${criticalProducts.length > 3 ? ", and others" : ""}.`,
      recommendation: "Review replenishment for these products immediately.",
      action: "Review stockout risks",
      path: "/dashboard/stockout-risks",
    });
  }

  if (highRiskProducts.length > 0) {
    insights.push({
      id: "high-risk",
      type: "warning",
      icon: AlertTriangle,
      title: "High Stock Risk",
      description: `${highRiskProducts.length} products have stock at or below their reorder levels.`,
      recommendation: "Prioritize these products when planning replenishment.",
      action: "View at-risk products",
      path: "/dashboard/stockout-risks",
    });
  }

  if (mediumRiskProducts.length > 0) {
    insights.push({
      id: "medium-risk",
      type: "warning",
      icon: TrendingUp,
      title: "Inventory Needs Monitoring",
      description: `${mediumRiskProducts.length} products are approaching their reorder levels.`,
      recommendation: "Monitor stock levels and review upcoming purchasing needs.",
      action: "View inventory",
      path: "/dashboard/inventory",
    });
  }

  if (pendingOrders > 0) {
    insights.push({
      id: "pending-orders",
      type: "positive",
      icon: PackageCheck,
      title: "Pending Purchase Orders",
      description: `${pendingOrders} purchase orders currently have Pending status.`,
      recommendation: "Review these orders and approve them where appropriate.",
      action: "Review orders",
      path: "/dashboard/purchase-orders",
    });
  }

  if (insights.length === 0 && !loading && !error) {
    insights.push({
      id: "healthy",
      type: "positive",
      icon: CheckCircle2,
      title: "No Immediate Stock Risks",
      description: "No products currently meet the configured stockout-risk thresholds.",
      recommendation: "Continue monitoring inventory as stock levels change.",
      action: "View inventory",
      path: "/dashboard/inventory",
    });
  }

  return (
    <section className="dashboard-panel ai-insights-panel">
      <div className="dashboard-panel-header">
        <div className="ai-insights-heading">
          <div className="ai-insights-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <h3>Operational Insights</h3>
            <p>Recommendations based on your live inventory data</p>
          </div>
        </div>

        <span className="ai-demo-label">
          <Bot size={12} />
          LIVE DATA
        </span>
      </div>

      <div className="ai-insights-list">
        {loading && <p>Loading operational insights...</p>}

        {!loading && error && (
          <p>{error}</p>
        )}

        {!loading &&
          !error &&
          insights.map((insight) => {
            const Icon = insight.icon;

            return (
              <article
                className={`ai-insight-item insight-${insight.type}`}
                key={insight.id}
              >
                <div className="insight-icon">
                  <Icon size={17} />
                </div>

                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>

                  <div className="insight-recommendation">
                    <span>Suggested action:</span>
                    {insight.recommendation}
                  </div>

                  <button
                    type="button"
                    className="insight-action"
                    onClick={() => navigate(insight.path)}
                  >
                    {insight.action}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </article>
            );
          })}
      </div>

      <div className="ai-insights-footer">
        <Sparkles size={13} />
        Insights are derived from live inventory and purchase-order records.
      </div>
    </section>
  );
}
