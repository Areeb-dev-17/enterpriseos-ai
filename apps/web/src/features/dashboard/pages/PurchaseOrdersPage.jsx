import { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  Truck,
  Plus,
  Search,
  Eye,
  X,
  Package,
} from "lucide-react";

import StatCard from "../pages/components/StatCard";

const initialPurchaseOrders = [
  {
    id: 1,
    poNumber: "PO-2026-001",
    supplier: "FashionHub Textiles",
    items: 4,
    orderDate: "2026-10-20",
    expectedDelivery: "2026-11-08",
    amount: 145000,
    status: "Pending",
    notes: "Cotton and apparel replenishment.",
    products: [
      { name: "Classic Cotton T-Shirt", quantity: 100, unitPrice: 899 },
      { name: "Premium Hoodie", quantity: 20, unitPrice: 2199 },
    ],
  },
  {
    id: 2,
    poNumber: "PO-2026-002",
    supplier: "Denim Works",
    items: 2,
    orderDate: "2026-10-18",
    expectedDelivery: "2026-11-05",
    amount: 98000,
    status: "Approved",
    notes: "Seasonal denim restock.",
    products: [
      { name: "Slim Fit Denim Jeans", quantity: 40, unitPrice: 1899 },
    ],
  },
  {
    id: 3,
    poNumber: "PO-2026-003",
    supplier: "Urban Accessories Co.",
    items: 3,
    orderDate: "2026-10-15",
    expectedDelivery: "2026-10-30",
    amount: 76500,
    status: "Received",
    notes: "Accessories replenishment.",
    products: [
      { name: "Leather Crossbody Bag", quantity: 20, unitPrice: 2499 },
      { name: "Sports Water Bottle", quantity: 30, unitPrice: 499 },
    ],
  },
  {
    id: 4,
    poNumber: "PO-2026-004",
    supplier: "StepUp Footwear",
    items: 2,
    orderDate: "2026-10-24",
    expectedDelivery: "2026-11-12",
    amount: 212000,
    status: "Pending",
    notes: "Footwear replenishment.",
    products: [
      { name: "Running Sneakers", quantity: 40, unitPrice: 3299 },
    ],
  },
  {
    id: 5,
    poNumber: "PO-2026-005",
    supplier: "Premium Apparel Ltd.",
    items: 5,
    orderDate: "2026-10-10",
    expectedDelivery: "2026-10-28",
    amount: 186000,
    status: "Approved",
    notes: "Monthly apparel order.",
    products: [
      { name: "Linen Casual Shirt", quantity: 80, unitPrice: 1499 },
    ],
  },
];

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function PurchaseOrderStatus({ value }) {
  const statusClass = value.toLowerCase().replaceAll(" ", "-");

  return (
    <span className={`po-status po-status-${statusClass}`}>
      {value}
    </span>
  );
}

function PurchaseOrderModal({ order, onClose, onSave }) {
  const isView = Boolean(order);

  const [form, setForm] = useState({
    supplier: "",
    expectedDelivery: "",
    notes: "",
    amount: "",
  });

  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.supplier.trim() ||
      !form.expectedDelivery ||
      !form.amount
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Please enter a valid order amount.");
      return;
    }

    onSave({
      supplier: form.supplier.trim(),
      expectedDelivery: form.expectedDelivery,
      notes: form.notes.trim(),
      amount: Number(form.amount),
    });
  };

  return (
    <div className="po-modal-backdrop" onMouseDown={onClose}>
      <section
        className="po-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="po-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="po-modal-header">
          <div>
            <h3 id="po-modal-title">
              {isView ? "Purchase Order Details" : "Create Purchase Order"}
            </h3>
            <p>
              {isView
                ? "Review supplier and order information."
                : "Enter the details for your new purchase order."}
            </p>
          </div>

          <button
            type="button"
            className="po-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {isView ? (
          <>
            <div className="po-detail-heading">
              <div className="po-detail-icon">
                <Package size={21} />
              </div>
              <div>
                <strong>{order.poNumber}</strong>
                <span>{order.supplier}</span>
              </div>
              <PurchaseOrderStatus value={order.status} />
            </div>

            <div className="po-details-grid">
              <div>
                <span>Order Date</span>
                <strong>{formatDate(order.orderDate)}</strong>
              </div>
              <div>
                <span>Expected Delivery</span>
                <strong>{formatDate(order.expectedDelivery)}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{order.items}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>{formatCurrency(order.amount)}</strong>
              </div>
            </div>

            <div className="po-products-list">
              <h4>Order Information</h4>
              <p>{order.notes || "No additional notes."}</p>
              {order.products?.map((product, index) => (
                <div className="po-product-row" key={index}>
                  <span>{product.name}</span>
                  <strong>
                    {product.quantity} × {formatCurrency(product.unitPrice)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="po-modal-actions">
              <button
                type="button"
                className="inventory-secondary-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="po-form-grid">
              <label className="inventory-form-field po-form-full">
                Supplier Name *
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={updateField}
                  placeholder="e.g. FashionHub Textiles"
                  autoFocus
                />
              </label>

              <label className="inventory-form-field">
                Expected Delivery *
                <input
                  type="date"
                  name="expectedDelivery"
                  value={form.expectedDelivery}
                  onChange={updateField}
                />
              </label>

              <label className="inventory-form-field">
                Total Amount (₹) *
                <input
                  type="number"
                  min="1"
                  name="amount"
                  value={form.amount}
                  onChange={updateField}
                  placeholder="e.g. 50000"
                />
              </label>

              <label className="inventory-form-field po-form-full">
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Add order details..."
                  rows={3}
                />
              </label>
            </div>

            {error && <p className="inventory-form-error">{error}</p>}

            <div className="po-modal-actions">
              <button
                type="button"
                className="inventory-secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="inventory-primary-button">
                <Plus size={15} /> Create Purchase Order
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function PurchaseOrdersTable({ orders, setOrders }) {
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [modalOrder, setModalOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        [
          order.poNumber,
          order.supplier,
          order.status,
          order.amount,
        ].some((value) => String(value).toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === "All" || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchText, selectedStatus]);

  const createOrder = (orderData) => {
    const nextId = Math.max(0, ...orders.map((order) => order.id)) + 1;

    const newOrder = {
      ...orderData,
      id: nextId,
      poNumber: `PO-2026-${String(nextId).padStart(3, "0")}`,
      items: 0,
      orderDate: new Date().toISOString().slice(0, 10),
      status: "Pending",
      products: [],
    };

    setOrders((current) => [newOrder, ...current]);
    setShowCreateModal(false);
    showToast("Purchase order created successfully.");
  };

  const updateStatus = (order, status) => {
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status } : item
      )
    );
    showToast(`${order.poNumber} marked as ${status}.`);
  };

  const columnDefs = useMemo(
    () => [
      {
        field: "poNumber",
        headerName: "PO Number",
        minWidth: 145,
        flex: 1,
      },
      {
        field: "supplier",
        headerName: "Supplier",
        minWidth: 180,
        flex: 1.4,
      },
      {
        field: "items",
        headerName: "Items",
        minWidth: 85,
      },
      {
        field: "orderDate",
        headerName: "Order Date",
        minWidth: 125,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "expectedDelivery",
        headerName: "Expected Delivery",
        minWidth: 155,
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "amount",
        headerName: "Amount",
        minWidth: 130,
        valueFormatter: (params) => formatCurrency(params.value),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 125,
        cellRenderer: PurchaseOrderStatus,
      },
      {
        headerName: "Actions",
        minWidth: 145,
        maxWidth: 160,
        sortable: false,
        filter: false,
        floatingFilter: false,
        cellRenderer: (params) => (
          <div className="inventory-row-actions">
            <button
              type="button"
              title="View purchase order"
              onClick={() => params.context.onView(params.data)}
            >
              <Eye size={15} />
            </button>
            <select
              className="po-row-status-select"
              aria-label={`Update ${params.data.poNumber} status`}
              value={params.data.status}
              onChange={(event) =>
                params.context.onStatusChange(params.data, event.target.value)
              }
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
      onView: (order) => setModalOrder(order),
      onStatusChange: updateStatus,
    }),
    [orders]
  );

  return (
    <>
      <div className="inventory-toolbar">
        <div className="inventory-search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search PO number, supplier..."
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
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <span className="inventory-result-count">
          {filteredOrders.length} of {orders.length} orders
        </span>

        <button
          type="button"
          className="inventory-add-button"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={15} /> Create Purchase Order
        </button>
      </div>

      <div className="inventory-grid-wrapper">
        <div className="ag-theme-quartz-dark inventory-grid">
          <AgGridReact
            rowData={filteredOrders}
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

      {modalOrder && (
        <PurchaseOrderModal
          key={modalOrder.id}
          order={modalOrder}
          onClose={() => setModalOrder(null)}
        />
      )}

      {showCreateModal && (
        <PurchaseOrderModal
          onClose={() => setShowCreateModal(false)}
          onSave={createOrder}
        />
      )}

      {toast && (
        <div className="inventory-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState(initialPurchaseOrders);

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === "Pending").length;
    const approved = orders.filter((order) => order.status === "Approved").length;
    const received = orders.filter((order) => order.status === "Received").length;

    return [
      {
        title: "Total Orders",
        value: orders.length.toLocaleString("en-IN"),
        description: "Purchase orders created",
        icon: ClipboardList,
        trend: "up",
      },
      {
        title: "Pending",
        value: pending.toLocaleString("en-IN"),
        description: "Awaiting approval",
        icon: Clock3,
        trend: "down",
      },
      {
        title: "Approved",
        value: approved.toLocaleString("en-IN"),
        description: "Approved for fulfillment",
        icon: CheckCircle2,
        trend: "up",
      },
      {
        title: "Received",
        value: received.toLocaleString("en-IN"),
        description: "Orders delivered",
        icon: Truck,
        trend: "up",
      },
    ];
  }, [orders]);

  return (
    <div className="dashboard-overview">
      <div className="overview-heading">
        <div>
          <h2>Purchase Orders</h2>
          <p>
            Manage supplier orders, track approvals, and monitor incoming stock.
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
            <h3>All Purchase Orders</h3>
            <p>Track and manage your supplier purchase orders</p>
          </div>
        </div>

        <PurchaseOrdersTable orders={orders} setOrders={setOrders} />
      </section>
    </div>
  );
}