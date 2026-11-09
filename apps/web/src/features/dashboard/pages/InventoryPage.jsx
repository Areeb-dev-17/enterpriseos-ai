
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Layers3,
} from "lucide-react";

import StatCard from "../pages/components/StatCard";
import InventoryTable, {
  getStockStatus,
} from "./components/InventoryTable";

import { getInventory } from "../../../services/inventoryService";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const controller = new AbortController();
  
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError("");
  
        const data = await getInventory(controller.signal);
        setProducts(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load inventory.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
  
    fetchInventory();
  
    return () => {
      controller.abort();
    };
  }, []);
  

  const stats = useMemo(() => {
    const inStock = products.filter(
      (product) =>
        getStockStatus(
          product.availableStock,
          product.reorderLevel
        ) === "In Stock"
    ).length;

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

    return [
      {
        title: "Total Products",
        value: products.length.toLocaleString("en-IN"),
        description: "Products in this inventory",
        icon: Package,
        trend: "up",
      },
      {
        title: "In Stock",
        value: inStock.toLocaleString("en-IN"),
        description: "Above reorder level",
        icon: CheckCircle2,
        trend: "up",
      },
      {
        title: "Low Stock",
        value: lowStock.toLocaleString("en-IN"),
        description: "At or below reorder level",
        icon: AlertTriangle,
        trend: "down",
      },
      {
        title: "Out of Stock",
        value: outOfStock.toLocaleString("en-IN"),
        description: "Require replenishment",
        icon: Layers3,
        trend: "down",
      },
    ];
  }, [products]);

  return (
    <div className="dashboard-overview">
      <div className="overview-heading">
        <div>
          <h2>Inventory Management</h2>
          <p>
            Monitor products, stock levels, and inventory health across
            your operations.
          </p>
        </div>
        <span className="demo-data-label">LIVE DATABASE</span>
      </div>

      <div className="dashboard-stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <section className="dashboard-panel inventory-table-panel">
        <div className="dashboard-panel-header">
          <div>
            <h3>All Products</h3>
            <p>Manage and monitor your product inventory</p>
          </div>
        </div>

        {loading && <p>Loading inventory...</p>}

        {!loading && error && (
          <p role="alert">{error}</p>
        )}

        {!loading && !error && (
          <InventoryTable
            products={products}
            setProducts={setProducts}
          />
        )}
      </section>
    </div>
  );
}
