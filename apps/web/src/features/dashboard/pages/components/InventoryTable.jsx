
import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Package,
  AlertTriangle,
} from "lucide-react";

export const initialInventoryData = [
  { id: 1, productName: "Classic Cotton T-Shirt", sku: "APP-1024", category: "Apparel", availableStock: 42, reorderLevel: 60, unitPrice: 899 },
  { id: 2, productName: "Slim Fit Denim Jeans", sku: "APP-2081", category: "Apparel", availableStock: 86, reorderLevel: 50, unitPrice: 1899 },
  { id: 3, productName: "Leather Crossbody Bag", sku: "ACC-3015", category: "Accessories", availableStock: 120, reorderLevel: 40, unitPrice: 2499 },
  { id: 4, productName: "Running Sneakers", sku: "FOO-4052", category: "Footwear", availableStock: 210, reorderLevel: 80, unitPrice: 3299 },
  { id: 5, productName: "Premium Hoodie", sku: "APP-5093", category: "Apparel", availableStock: 340, reorderLevel: 100, unitPrice: 2199 },
  { id: 6, productName: "Sports Water Bottle", sku: "ACC-6012", category: "Accessories", availableStock: 18, reorderLevel: 50, unitPrice: 499 },
  { id: 7, productName: "Formal Leather Shoes", sku: "FOO-7018", category: "Footwear", availableStock: 64, reorderLevel: 40, unitPrice: 2799 },
  { id: 8, productName: "Linen Casual Shirt", sku: "APP-8033", category: "Apparel", availableStock: 0, reorderLevel: 45, unitPrice: 1499 },
];

export const getStockStatus = (stock, reorderLevel) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= reorderLevel) return "Low Stock";
    return "In Stock";
  };

function StockStatusRenderer({ value }) {
  const statusClass = value.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`inventory-status inventory-status-${statusClass}`}>
      {value}
    </span>
  );
}

const emptyForm = {
  productName: "",
  sku: "",
  category: "Apparel",
  availableStock: "",
  reorderLevel: "",
  unitPrice: "",
};

function ProductModal({ modal, products, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    modal.product
      ? {
          productName: modal.product.productName,
          sku: modal.product.sku,
          category: modal.product.category,
          availableStock: String(modal.product.availableStock),
          reorderLevel: String(modal.product.reorderLevel),
          unitPrice: String(modal.product.unitPrice),
        }
      : emptyForm
  );
  const [error, setError] = useState("");

  const isView = modal.type === "view";
  const isDelete = modal.type === "delete";
  const isEdit = modal.type === "edit";

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const productName = form.productName.trim();
    const sku = form.sku.trim().toUpperCase();
    const availableStock = Number(form.availableStock);
    const reorderLevel = Number(form.reorderLevel);
    const unitPrice = Number(form.unitPrice);

    if (!productName || !sku) {
      setError("Product name and SKU are required.");
      return;
    }

    if (
      form.availableStock === "" ||
      form.reorderLevel === "" ||
      form.unitPrice === ""
    ) {
      setError("Please complete all numeric fields.");
      return;
    }

    if (
      !Number.isInteger(availableStock) ||
      !Number.isInteger(reorderLevel) ||
      availableStock < 0 ||
      reorderLevel < 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      setError("Stock and reorder level must be non-negative whole numbers. Price must be greater than zero.");
      return;
    }

    const duplicateSku = products.some(
      (product) =>
        product.sku.toLowerCase() === sku.toLowerCase() &&
        product.id !== modal.product?.id
    );

    if (duplicateSku) {
      setError("This SKU already exists. Please use a unique SKU.");
      return;
    }

    onSave({
      ...(modal.product || {}),
      productName,
      sku,
      category: form.category,
      availableStock,
      reorderLevel,
      unitPrice,
    });
  };

  const title = {
    add: "Add Product",
    edit: "Edit Product",
    view: "Product Details",
    delete: "Delete Product",
  }[modal.type];

  return (
    <div className="inventory-modal-backdrop" onMouseDown={onClose}>
      <section
        className="inventory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="inventory-modal-header">
          <div>
            <h3 id="inventory-modal-title">{title}</h3>
            <p>
              {isDelete
                ? "Confirm this action before continuing."
                : isView
                  ? "Review the product information."
                  : "Enter the product information below."}
            </p>
          </div>
          <button
            type="button"
            className="inventory-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isDelete ? (
          <div className="inventory-delete-content">
            <div className="inventory-delete-icon">
              <AlertTriangle size={23} />
            </div>
            <p>
              Are you sure you want to delete{" "}
              <strong>{modal.product.productName}</strong>?
            </p>
            <span>This action cannot be undone in this session.</span>
            <div className="inventory-modal-actions">
              <button type="button" className="inventory-secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="inventory-danger-button"
                onClick={() => onDelete(modal.product.id)}
              >
                <Trash2 size={15} /> Delete Product
              </button>
            </div>
          </div>
        ) : isView ? (
          <div className="inventory-details">
            <div className="inventory-details-name">
              <div className="inventory-details-icon"><Package size={21} /></div>
              <div>
                <strong>{modal.product.productName}</strong>
                <span>{modal.product.sku}</span>
              </div>
            </div>
            <div className="inventory-details-grid">
              <div><span>Category</span><strong>{modal.product.category}</strong></div>
              <div><span>Available Stock</span><strong>{modal.product.availableStock}</strong></div>
              <div><span>Reorder Level</span><strong>{modal.product.reorderLevel}</strong></div>
              <div><span>Unit Price</span><strong>₹{modal.product.unitPrice.toLocaleString("en-IN")}</strong></div>
              <div>
                <span>Stock Status</span>
                <StockStatusRenderer value={getStockStatus(modal.product.availableStock, modal.product.reorderLevel)} />
              </div>
              <div>
                <span>Total Stock Value</span>
                <strong>₹{(modal.product.availableStock * modal.product.unitPrice).toLocaleString("en-IN")}</strong>
              </div>
            </div>
            <div className="inventory-modal-actions">
              <button type="button" className="inventory-secondary-button" onClick={onClose}>Close</button>
              <button
                type="button"
                className="inventory-primary-button"
                onClick={() => onSave({ ...modal.product, __edit: true })}
              >
                <Pencil size={14} /> Edit Product
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="inventory-form-grid">
              <label className="inventory-form-field inventory-form-full">
                Product Name
                <input name="productName" value={form.productName} onChange={updateField} placeholder="e.g. Classic Cotton T-Shirt" autoFocus />
              </label>

              <label className="inventory-form-field">
                SKU
                <input name="sku" value={form.sku} onChange={updateField} placeholder="e.g. APP-1024" />
              </label>

              <label className="inventory-form-field">
                Category
                <select name="category" value={form.category} onChange={updateField}>
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Footwear">Footwear</option>
                </select>
              </label>

              <label className="inventory-form-field">
                Available Stock
                <input type="number" min="0" step="1" name="availableStock" value={form.availableStock} onChange={updateField} placeholder="0" />
              </label>

              <label className="inventory-form-field">
                Reorder Level
                <input type="number" min="0" step="1" name="reorderLevel" value={form.reorderLevel} onChange={updateField} placeholder="0" />
              </label>

              <label className="inventory-form-field inventory-form-full">
                Unit Price (₹)
                <input type="number" min="0.01" step="0.01" name="unitPrice" value={form.unitPrice} onChange={updateField} placeholder="e.g. 899" />
              </label>
            </div>

            {error && <p className="inventory-form-error">{error}</p>}

            <div className="inventory-modal-actions">
              <button type="button" className="inventory-secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="inventory-primary-button">
                {isEdit ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default function InventoryTable({ products, setProducts }) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const rowData = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        stockStatus: getStockStatus(product.availableStock, product.reorderLevel),
      })),
    [products]
  );

  const filteredData = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rowData.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.productName,
          product.sku,
          product.category,
          product.availableStock,
          product.reorderLevel,
          product.unitPrice,
          product.stockStatus,
        ].some((value) => String(value).toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All" || product.stockStatus === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rowData, searchText, selectedCategory, selectedStatus]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const saveProduct = (product) => {
    if (product.__edit) {
      setModal({ type: "edit", product: modal.product });
      return;
    }

    if (modal.type === "add") {
      setProducts((current) => [
        { ...product, id: Math.max(0, ...current.map((item) => item.id)) + 1 },
        ...current,
      ]);
      showToast("Product added successfully.");
    } else {
      setProducts((current) =>
        current.map((item) => item.id === product.id ? product : item)
      );
      showToast("Product updated successfully.");
    }

    setModal(null);
  };

  const deleteProduct = (id) => {
    setProducts((current) => current.filter((product) => product.id !== id));
    setModal(null);
    showToast("Product deleted successfully.");
  };

  const columnDefs = useMemo(
    () => [
      { field: "productName", headerName: "Product", flex: 1.5, minWidth: 190 },
      { field: "sku", headerName: "SKU", minWidth: 115 },
      { field: "category", headerName: "Category", minWidth: 120 },
      { field: "availableStock", headerName: "Available Stock", minWidth: 130, filter: "agNumberColumnFilter" },
      { field: "reorderLevel", headerName: "Reorder Level", minWidth: 125, filter: "agNumberColumnFilter" },
      {
        field: "unitPrice",
        headerName: "Unit Price",
        minWidth: 115,
        valueFormatter: (params) => `₹${Number(params.value).toLocaleString("en-IN")}`,
      },
      {
        field: "stockStatus",
        headerName: "Status",
        minWidth: 140,
        cellRenderer: StockStatusRenderer,
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
            <button type="button" title="View product" onClick={() => params.context.onView(params.data)}>
              <Eye size={15} />
            </button>
            <button type="button" title="Edit product" onClick={() => params.context.onEdit(params.data)}>
              <Pencil size={15} />
            </button>
            <button type="button" title="Delete product" onClick={() => params.context.onDelete(params.data)}>
              <Trash2 size={15} />
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
      onView: (product) => setModal({ type: "view", product }),
      onEdit: (product) => setModal({ type: "edit", product }),
      onDelete: (product) => setModal({ type: "delete", product }),
    }),
    []
  );

  return (
    <>
      <div className="inventory-toolbar">
        <div className="inventory-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search products, SKU..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          <option value="All">All Categories</option>
          <option value="Apparel">Apparel</option>
          <option value="Accessories">Accessories</option>
          <option value="Footwear">Footwear</option>
        </select>

        <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
          <option value="All">All Stock Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <span className="inventory-result-count">
          {filteredData.length} of {products.length} products
        </span>

        <button
          type="button"
          className="inventory-add-button"
          onClick={() => setModal({ type: "add", product: null })}
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      <div className="inventory-grid-wrapper">
        <div className="ag-theme-quartz-dark inventory-grid">
          <AgGridReact
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={context}
            getRowId={(params) => String(params.data.id)}
            pagination
            paginationPageSize={10}
            animateRows
          />
        </div>
      </div>

      {modal && (
        <ProductModal
          key={`${modal.type}-${modal.product?.id || "new"}`}
          modal={modal}
          products={products}
          onClose={() => setModal(null)}
          onSave={saveProduct}
          onDelete={deleteProduct}
        />
      )}

      {toast && <div className="inventory-toast" role="status">{toast}</div>}
    </>
  );
}
