
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Clock3,
  Package,
  Search,
  X,
  ShoppingCart,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import StatCard from "./components/StatCard";

const initialRiskData = [
  {
    id: 1,
    name: "Classic Cotton T-Shirt",
    sku: "APP-1024",
    category: "Apparel",
    stock: 42,
    dailySales: 18,
    leadTime: 5,
    supplier: "Fashion Supply Co.",
    unitPrice: 899,
    severity: "Critical",
    reason: "Current stock is insufficient to cover expected demand during supplier lead time.",
    recommendation: "Prepare an urgent replenishment order for 120 units.",
  },
  {
    id: 2,
    name: "Slim Fit Denim Jeans",
    sku: "APP-2081",
    category: "Apparel",
    stock: 86,
    dailySales: 22,
    leadTime: 4,
    supplier: "Denim Works",
    unitPrice: 1899,
    severity: "High",
    reason: "Sales velocity is high relative to available inventory.",
    recommendation: "Consider replenishing 100 units before the next sales cycle.",
  },
  {
    id: 3,
    name: "Leather Crossbody Bag",
    sku: "ACC-3015",
    category: "Accessories",
    stock: 120,
    dailySales: 24,
    leadTime: 6,
    supplier: "Premium Accessories Ltd.",
    unitPrice: 2499,
    severity: "High",
    reason: "Projected inventory coverage is below the supplier lead time.",
    recommendation: "Prepare a replenishment order for 150 units.",
  },
  {
    id: 4,
    name: "Running Sneakers",
    sku: "FOO-4052",
    category: "Footwear",
    stock: 210,
    dailySales: 30,
    leadTime: 5,
    supplier: "Active Footwear",
    unitPrice: 3299,
    severity: "Medium",
    reason: "Inventory coverage is approaching the expected replenishment window.",
    recommendation: "Review demand and plan a replenishment of 100 units.",
  },
  {
    id: 5,
    name: "Premium Hoodie",
    sku: "APP-5093",
    category: "Apparel",
    stock: 340,
    dailySales: 32,
    leadTime: 8,
    supplier: "Urban Apparel",
    unitPrice: 2199,
    severity: "Medium",
    reason: "Long supplier lead time increases the risk of future stock shortages.",
    recommendation: "Monitor sales velocity and prepare a replenishment plan.",
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function getDaysRemaining(stock, dailySales) {
  if (dailySales <= 0) return Infinity;
  return stock / dailySales;
}

function RiskBadge({ severity }) {
  return (
    <span className={`risk-badge risk-${severity.toLowerCase()}`}>
      <span className="risk-dot" />
      {severity}
    </span>
  );
}

function RiskDetailsModal({ product, onClose, onPrepareOrder }) {
  if (!product) return null;

  const daysRemaining = getDaysRemaining(
    product.stock,
    product.dailySales
  );

  return (
    <div
      className="risk-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="risk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="risk-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="risk-modal-header">
          <div>
            <span className="risk-modal-eyebrow">STOCKOUT RISK DETAILS</span>
            <h2 id="risk-modal-title">{product.name}</h2>
            <p>{product.sku} · {product.category}</p>
          </div>

          <button
            type="button"
            className="risk-modal-close"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="risk-modal-status">
          <RiskBadge severity={product.severity} />
          <span>
            {Number.isFinite(daysRemaining)
              ? `${daysRemaining.toFixed(1)} days of stock remaining`
              : "Sales data unavailable"}
          </span>
        </div>

        <div className="risk-detail-grid">
          <div>
            <span>Available stock</span>
            <strong>{product.stock} units</strong>
          </div>
          <div>
            <span>Daily sales</span>
            <strong>{product.dailySales} units</strong>
          </div>
          <div>
            <span>Supplier lead time</span>
            <strong>{product.leadTime} days</strong>
          </div>
          <div>
            <span>Unit price</span>
            <strong>{formatCurrency(product.unitPrice)}</strong>
          </div>
        </div>

        <div className="risk-explanation">
          <div className="risk-explanation-heading">
            <AlertTriangle size={17} />
            <h3>Why is this product at risk?</h3>
          </div>
          <p>{product.reason}</p>
        </div>

        <div className="risk-recommendation">
          <div className="risk-explanation-heading">
            <Sparkles size={17} />
            <h3>Recommended action</h3>
          </div>
          <p>{product.recommendation}</p>
          <span className="risk-demo-note">
            Illustrative recommendation based on synthetic demo data.
          </span>
        </div>

        <div className="risk-modal-actions">
          <button
            type="button"
            className="risk-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="risk-primary-button"
            onClick={() => onPrepareOrder(product)}
          >
            <ShoppingCart size={15} />
            Prepare Purchase Order
          </button>
        </div>
      </section>
    </div>
  );
}

export default function StockoutRisksPage() {
  const [risks] = useState(initialRiskData);
  const [searchText, setSearchText] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState("");

  const filteredRisks = useMemo(() => {
    return risks.filter((product) => {
      const search = searchText.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search);

      const matchesSeverity =
        selectedSeverity === "All" ||
        product.severity === selectedSeverity;

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [risks, searchText, selectedSeverity, selectedCategory]);

  const criticalCount = risks.filter(
    (product) => product.severity === "Critical"
  ).length;

  const highCount = risks.filter(
    (product) => product.severity === "High"
  ).length;

  const mediumCount = risks.filter(
    (product) => product.severity === "Medium"
  ).length;

  const handlePrepareOrder = (product) => {
    setSelectedProduct(null);
    setToast(`Purchase order draft prepared for ${product.name}.`);

    window.setTimeout(() => {
      setToast("");
    }, 3500);
  };

  return (
    <div className="dashboard-overview stockout-risks-page">
      <div className="overview-heading">
        <div>
          <h2>Stockout Risk Monitoring</h2>
          <p>
            Identify products that may run out of stock and take
            preventive action.
          </p>
        </div>

        <span className="demo-data-label">DEMO DATA</span>
      </div>

      <div className="dashboard-stats-grid">
        <StatCard
          title="Total At-Risk Products"
          value={risks.length}
          description="Products requiring attention"
          icon={Package}
          trend="down"
        />

        <StatCard
          title="Critical Risk"
          value={criticalCount}
          description="Immediate attention required"
          icon={AlertCircle}
          trend="down"
        />

        <StatCard
          title="High Risk"
          value={highCount}
          description="Replenishment recommended"
          icon={AlertTriangle}
          trend="down"
        />

        <StatCard
          title="Medium Risk"
          value={mediumCount}
          description="Monitor inventory closely"
          icon={Clock3}
          trend="up"
        />
      </div>

      <section className="dashboard-panel stockout-risk-table-panel">
        <div className="dashboard-panel-header">
          <div>
            <h3>At-Risk Products</h3>
            <p>
              Products ranked by their current stockout risk.
            </p>
          </div>

          <span className="risk-record-count">
            {filteredRisks.length} products
          </span>
        </div>

        <div className="stockout-risk-toolbar">
          <div className="stockout-risk-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search product or SKU..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={selectedSeverity}
            onChange={(event) => setSelectedSeverity(event.target.value)}
            aria-label="Filter by severity"
          >
            <option value="All">All severity</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            <option value="Apparel">Apparel</option>
            <option value="Accessories">Accessories</option>
            <option value="Footwear">Footwear</option>
          </select>
        </div>

        <div className="stockout-risk-table-wrapper">
          <table className="stockout-risk-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>AVAILABLE STOCK</th>
                <th>DAILY SALES</th>
                <th>DAYS LEFT</th>
                <th>LEAD TIME</th>
                <th>RISK LEVEL</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {filteredRisks.map((product) => {
                const daysRemaining = getDaysRemaining(
                  product.stock,
                  product.dailySales
                );

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="risk-product-name">
                        {product.name}
                      </div>
                      <div className="risk-product-sku">
                        {product.sku}
                      </div>
                    </td>

                    <td>{product.stock} units</td>
                    <td>{product.dailySales} units</td>

                    <td>
                      <strong className="risk-days-left">
                        {Number.isFinite(daysRemaining)
                          ? `${daysRemaining.toFixed(1)} days`
                          : "N/A"}
                      </strong>
                    </td>

                    <td>{product.leadTime} days</td>

                    <td>
                      <RiskBadge severity={product.severity} />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="risk-view-button"
                        onClick={() => setSelectedProduct(product)}
                      >
                        View details
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRisks.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="stockout-risk-empty">
                      <Package size={28} />
                      <strong>No matching products</strong>
                      <span>
                        Try changing your search or filter selections.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="stockout-risk-footer">
          <AlertTriangle size={14} />
          Risk calculations shown here use illustrative synthetic data.
          Production risk scores will use inventory, demand and supplier data.
        </div>
      </section>

      {selectedProduct && (
        <RiskDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onPrepareOrder={handlePrepareOrder}
        />
      )}

      {toast && (
        <div className="inventory-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
