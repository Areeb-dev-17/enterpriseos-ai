
import { useMemo, useState } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Layers3,
} from "lucide-react";

import StatCard from "../pages/components/StatCard";
import InventoryTable, {
  initialInventoryData,
  getStockStatus,
} from "./components/InventoryTable";

export default function InventoryPage() {
  const [products, setProducts] = useState(initialInventoryData);

  const stats = useMemo(() => {
    const inStock = products.filter(
      (product) => getStockStatus(product.availableStock, product.reorderLevel) === "In Stock"
    ).length;

    const lowStock = products.filter(
      (product) => getStockStatus(product.availableStock, product.reorderLevel) === "Low Stock"
    ).length;

    const outOfStock = products.filter(
      (product) => getStockStatus(product.availableStock, product.reorderLevel) === "Out of Stock"
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
            Monitor products, stock levels, and inventory health across your operations.
          </p>
        </div>
        <span className="demo-data-label">DEMO DATA</span>
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

        <InventoryTable products={products} setProducts={setProducts} />
      </section>
    </div>
  );
}
