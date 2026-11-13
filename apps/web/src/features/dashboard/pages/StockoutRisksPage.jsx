
import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AlertTriangle,
  AlertCircle,
  Clock3,
  Package,
  Search,
  X,
  ArrowRight,
} from "lucide-react";

import { getStockoutRisks } from "../../../services/stockoutRiskService";
import StatCard from "./components/StatCard";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function RiskBadge({ severity }) {
  return (
    <span className={`risk-badge risk-${severity.toLowerCase()}`}>
      <span className="risk-dot" />
      {severity}
    </span>
  );
}

function RiskLevelRenderer({ value }) {
  return <RiskBadge severity={value} />;
}

function ProductNameRenderer({ data }) {
  return (
    <div className="risk-product-cell">
      <div className="risk-product-name">{data.name}</div>
      <div className="risk-product-sku">{data.sku}</div>
    </div>
  );
}

function RiskDetailsModal({ product, onClose }) {
  if (!product) return null;

  const stockDifference = product.stock - product.reorderLevel;

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
            <span className="risk-modal-eyebrow">
              STOCKOUT RISK DETAILS
            </span>
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
            {product.stock === 0
              ? "This product is currently out of stock."
              : `${product.stock} units currently available.`}
          </span>
        </div>

        <div className="risk-detail-grid">
          <div>
            <span>Available stock</span>
            <strong>{product.stock} units</strong>
          </div>

          <div>
            <span>Reorder level</span>
            <strong>{product.reorderLevel} units</strong>
          </div>

          <div>
            <span>Stock vs reorder level</span>
            <strong>
              {stockDifference >= 0
                ? `${stockDifference} units above`
                : `${Math.abs(stockDifference)} units below`}
            </strong>
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

          <p>
            {product.stock === 0
              ? "Available inventory has reached zero."
              : product.stock <= product.reorderLevel
                ? "Available inventory has reached or fallen below its configured reorder level."
                : "Available inventory is approaching the configured reorder threshold."}
          </p>
        </div>

        <div className="risk-modal-actions">
          <button
            type="button"
            className="risk-secondary-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

export default function StockoutRisksPage() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRisks = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getStockoutRisks(controller.signal);

        const mappedProducts = data.products.map((product) => ({
          id: product.id,
          name: product.productName,
          sku: product.sku,
          category: product.category,
          stock: Number(product.availableStock),
          reorderLevel: Number(product.reorderLevel),
          unitPrice: Number(product.unitPrice),
          severity: product.riskLevel,
        }));

        setRisks(mappedProducts);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load stockout risks.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRisks();

    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(risks.map((product) => product.category).filter(Boolean))]
        .sort(),
    [risks]
  );

  const filteredRisks = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return risks.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

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

  const columnDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: "Product",
        flex: 1.5,
        minWidth: 190,
        cellRenderer: ProductNameRenderer,
      },
      {
        field: "category",
        headerName: "Category",
        minWidth: 120,
      },
      {
        field: "stock",
        headerName: "Available Stock",
        minWidth: 140,
        filter: "agNumberColumnFilter",
        valueFormatter: (params) => `${params.value} units`,
      },
      {
        field: "reorderLevel",
        headerName: "Reorder Level",
        minWidth: 130,
        filter: "agNumberColumnFilter",
        valueFormatter: (params) => `${params.value} units`,
      },
      {
        field: "unitPrice",
        headerName: "Unit Price",
        minWidth: 120,
        filter: "agNumberColumnFilter",
        valueFormatter: (params) => formatCurrency(params.value),
      },
      {
        field: "severity",
        headerName: "Risk Level",
        minWidth: 130,
        cellRenderer: RiskLevelRenderer,
      },
      {
        headerName: "Actions",
        field: "actions",
        minWidth: 135,
        maxWidth: 145,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params) => (
          <div className="inventory-row-actions">
            <button
              type="button"
              title="View risk details"
              onClick={() => params.context.onView(params.data)}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  const context = useMemo(
    () => ({
      onView: (product) => setSelectedProduct(product),
    }),
    []
  );

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

        <span className="demo-data-label">LIVE DATA</span>
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
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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

        <div className="inventory-grid-wrapper">
          <div className="ag-theme-quartz-dark inventory-grid">
            <AgGridReact
              rowData={filteredRisks}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              context={context}
              getRowId={(params) => String(params.data.id)}
              pagination={true}
              paginationPageSize={10}
              loading={loading}
              animateRows
            />
          </div>
        </div>

        <div className="stockout-risk-footer">
          <AlertTriangle size={14} />
          Risk levels are calculated using available stock and configured
          reorder levels.
        </div>
      </section>

      {selectedProduct && (
        <RiskDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
