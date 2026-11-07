
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stockoutProducts = [
  {
    id: 1,
    name: "Classic Cotton T-Shirt",
    sku: "APP-1024",
    category: "Apparel",
    availableStock: 42,
    dailySales: 18,
    daysRemaining: 2.3,
    risk: "Critical",
  },
  {
    id: 2,
    name: "Slim Fit Denim Jeans",
    sku: "APP-2081",
    category: "Apparel",
    availableStock: 86,
    dailySales: 22,
    daysRemaining: 3.9,
    risk: "High",
  },
  {
    id: 3,
    name: "Leather Crossbody Bag",
    sku: "ACC-3015",
    category: "Accessories",
    availableStock: 120,
    dailySales: 24,
    daysRemaining: 5,
    risk: "High",
  },
  {
    id: 4,
    name: "Running Sneakers",
    sku: "FOO-4052",
    category: "Footwear",
    availableStock: 210,
    dailySales: 30,
    daysRemaining: 7,
    risk: "Medium",
  },
  {
    id: 5,
    name: "Premium Hoodie",
    sku: "APP-5093",
    category: "Apparel",
    availableStock: 340,
    dailySales: 32,
    daysRemaining: 10.6,
    risk: "Medium",
  },
];

function RiskBadge({ risk }) {
  return (
    <span className={`risk-badge risk-${risk.toLowerCase()}`}>
      <span className="risk-dot" />
      {risk}
    </span>
  );
}

export default function StockoutRiskTable() {
  const navigate = useNavigate();

  return (
    <section className="dashboard-panel stockout-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>Products at Risk</h3>
          <p>Products with insufficient inventory coverage</p>
        </div>

        <button
          type="button"
          className="panel-action"
          onClick={() => navigate("/dashboard/stockout-risks")}
        >
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div className="stockout-table-wrapper">
        <table className="stockout-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>AVAILABLE STOCK</th>
              <th>DAILY SALES</th>
              <th>DAYS LEFT</th>
              <th>RISK LEVEL</th>
            </tr>
          </thead>

          <tbody>
            {stockoutProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-name">
                    {product.name}
                  </div>
                  <div className="product-sku">
                    {product.sku} · {product.category}
                  </div>
                </td>

                <td>{product.availableStock} units</td>
                <td>{product.dailySales} units</td>

                <td>
                  <span className="days-remaining">
                    {product.daysRemaining} days
                  </span>
                </td>

                <td>
                  <RiskBadge risk={product.risk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stockout-table-footer">
        <AlertTriangle size={15} />
        <span>
          Showing 5 products requiring inventory attention.
        </span>
      </div>
    </section>
  );
}
