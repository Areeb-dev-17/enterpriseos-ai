
import { useEffect, useMemo, useState } from "react";
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
  Trash2,
} from "lucide-react";

import StatCard from "../pages/components/StatCard";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  receivePurchaseOrder
} from "../../../services/purchaseOrderService";
import { getInventory } from "../../../services/inventoryService";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Converts the backend purchase order response into the UI format.
const mapPurchaseOrder = (order) => {
  const products = (order.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName,
    sku: item.sku,
    quantity: Number(item.quantity),
    receivedQuantity: Number(item.receivedQuantity || 0),
    unitPrice: Number(item.unitCost),
  }));

  const amount = products.reduce(
    (total, product) =>
      total + product.quantity * product.unitPrice,
    0
  );

  return {
    id: order.id,
    poNumber: `PO-${String(order.id).slice(0, 8).toUpperCase()}`,
    supplier: order.supplierName,
    items: products.length,
    orderDate: order.createdAt,
    expectedDelivery: order.expectedDate,
    amount,
    status: order.status,
    products,
    notes: "",
  };
};

function PurchaseOrderStatus({ value }) {
  const statusClass = String(value || "pending")
    .toLowerCase()
    .replaceAll(" ", "-");

  return (
    <span className={`po-status po-status-${statusClass}`}>
      {value || "Pending"}
    </span>
  );
}

function PurchaseOrderModal({
  order,
  inventory = [],
  onClose,
  onSave,
  onReceive,
  saving = false,
  receiving = false,
}) {
  const isView = Boolean(order);

  const [form, setForm] = useState({
    supplier: "",
    expectedDelivery: "",
  });

  const [items, setItems] = useState([
    {
      productId: "",
      quantity: 1,
      unitCost: "",
    },
  ]);

  const [error, setError] = useState("");
  const [receiveQuantities, setReceiveQuantities] = useState({});

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleReceiveQuantityChange = (itemId, value) => {
    console.log("Receiving input:", { itemId, value });

    setReceiveQuantities((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };
  const getRemainingQuantity = (product) =>
    product.quantity - product.receivedQuantity;


  const handleReceive = async () => {
    setError("");
  
    const receivedItems = order.products
      .map((product) => {
        const enteredValue = receiveQuantities[product.id];
  
        return {
          itemId: product.id,
          enteredValue,
          quantity: Number(enteredValue),
          remaining: getRemainingQuantity(product),
        };
      })
      .filter((item) => item.enteredValue !== undefined && item.enteredValue !== "");
  
    if (receivedItems.length === 0) {
      setError(
        `No quantity captured. Current values: ${JSON.stringify(receiveQuantities)}`
      );
      return;
    }
  
    const invalidItem = receivedItems.find(
      (item) =>
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > item.remaining
    );
  
    if (invalidItem) {
      setError("Enter a valid quantity within the remaining amount.");
      return;
    }
  
    try {
      await onReceive(
        order.id,
        receivedItems.map(({ itemId, quantity }) => ({
          itemId,
          quantity,
        }))
      );
  
      setReceiveQuantities({});
    } catch (err) {
      setError(err.message || "Failed to receive stock.");
    }
  };

  const updateItem = (index, field, value) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const handleProductChange = (index, productId) => {
    const selectedProduct = inventory.find(
      (product) => product.id === productId
    );

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              unitCost: selectedProduct
                ? String(selectedProduct.unitPrice ?? 0)
                : "",
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: 1,
        unitCost: "",
      },
    ]);
  };

  const removeItem = (index) => {
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const totalAmount = items.reduce((total, item) => {
    return (
      total +
      Number(item.quantity || 0) * Number(item.unitCost || 0)
    );
  }, 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.supplier.trim()) {
      setError("Please enter a supplier name.");
      return;
    }

    if (!form.expectedDelivery) {
      setError("Please select an expected delivery date.");
      return;
    }

    if (!items.length) {
      setError("Please add at least one product.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.productId ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isFinite(Number(item.unitCost)) ||
        Number(item.unitCost) < 0
    );

    if (invalidItem) {
      setError(
        "Please select a product and enter a valid quantity and unit cost for every item."
      );
      return;
    }

    const productIds = items.map((item) => item.productId);

    if (new Set(productIds).size !== productIds.length) {
      setError("A product can only be added once to a purchase order.");
      return;
    }

    try {
      await onSave({
        supplierName: form.supplier.trim(),
        expectedDate: form.expectedDelivery,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      });
    } catch (err) {
      setError(err.message || "Failed to create purchase order.");
    }
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
              {isView
                ? "Purchase Order Details"
                : "Create Purchase Order"}
            </h3>
            <p>
              {isView
                ? "Review supplier and order information."
                : "Add supplier details and products to your order."}
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
              <h4>Order Products</h4>

              {order.products?.length ? (
                order.products.map((product, index) => (
                  <div className="po-product-row" key={product.id || index}>
                    <div>
                      <span>{product.name}</span>
                      {product.sku && (
                        <small>{product.sku}</small>
                      )}
                    </div>
                    <div>
  <strong>
    {product.quantity} × {formatCurrency(product.unitPrice)}
  </strong>

  <small style={{marginLeft:"17px",fontSize:"unset"}}>
    Received: {product.receivedQuantity} / {product.quantity}
    {" · "}
    Remaining: {getRemainingQuantity(product)}
  </small>

  {getRemainingQuantity(product) > 0 && (
    <div className="receive-quantity-control">
      <label htmlFor={`receive-${product.id}`}>
        Receive now
      </label>

      <input
  id={`receive-${product.id}`}
  type="number"
  min="1"
  max={getRemainingQuantity(product)}
  step="1"
  value={receiveQuantities[product.id] ?? ""}
  onChange={(event) => {
    const value = event.target.value;

    setReceiveQuantities((current) => ({
      ...current,
      [product.id]: value,
    }));
  }}
  placeholder={`Max ${getRemainingQuantity(product)}`}
/>
    </div>
  )}
</div>
                  </div>
                ))
              ) : (
                <p>No products found for this order.</p>
              )}
            </div>
            {error && (
  <p className="inventory-form-error">{error}</p>
)}

<div className="po-modal-actions">
  <button
    type="button"
    className="inventory-secondary-button"
    onClick={onClose}
    disabled={receiving}
  >
    Close
  </button>

  {order.products?.some(
    (product) => getRemainingQuantity(product) > 0
  ) && (
    <button
      type="button"
      className="inventory-add-button"
      onClick={handleReceive}
      disabled={receiving}
    >
      <Truck size={15} />
      {receiving ? "Receiving..." : "Receive Stock"}
    </button>
  )}
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
                  maxLength={255}
                />
              </label>

              <label className="inventory-form-field po-form-full">
                Expected Delivery *
                <input
  type="date"
  name="expectedDelivery"
  value={form.expectedDelivery}
  onChange={updateField}
  min={new Date().toISOString().slice(0, 10)}
  onClick={(event) => {
    if (event.currentTarget.showPicker) {
      event.currentTarget.showPicker();
    }
  }}
  required
/>
              </label>
            </div>

            <div className="po-products-list">
              <div className="po-modal-header">
                <div>
                  <h4>Products</h4>
                  <p>Select products from your inventory.</p>
                </div>

                <button
                  type="button"
                  className="inventory-add-button"
                  onClick={addItem}
                  disabled={inventory.length === 0}
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>

              {inventory.length === 0 && (
                <p className="inventory-form-error">
                  No inventory products are available. Add products to
                  inventory before creating a purchase order.
                </p>
              )}

              {items.map((item, index) => {
                const selectedProduct = inventory.find(
                  (product) => product.id === item.productId
                );

                return (
                  <div className="po-product-row" key={index}>
                    <div className="po-form-grid">
                      <label className="inventory-form-field po-form-full">
                        Product *
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            handleProductChange(index, event.target.value)
                          }
                        >
                          <option value="">Select a product</option>

                          {inventory.map((product) => {
                            const alreadySelected = items.some(
                              (otherItem, otherIndex) =>
                                otherIndex !== index &&
                                otherItem.productId === product.id
                            );

                            return (
                              <option
                                key={product.id}
                                value={product.id}
                                disabled={alreadySelected}
                              >
                                {product.productName} ({product.sku})
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      {selectedProduct && (
                        <p className="inventory-result-count">
                          Available stock:{" "}
                          {selectedProduct.availableStock}
                        </p>
                      )}

                      <label className="inventory-form-field">
                        Quantity *
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                        />
                      </label>

                      <label className="inventory-form-field">
                        Unit Cost (₹) *
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) =>
                            updateItem(index, "unitCost", event.target.value)
                          }
                        />
                      </label>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        className="po-close-button"
                        onClick={() => removeItem(index)}
                        title="Remove product"
                        aria-label="Remove product"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="po-details-grid">
              <div>
                <span>Total Products</span>
                <strong>{items.length}</strong>
              </div>

              <div>
                <span>Total Order Amount</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>

            {error && (
              <p className="inventory-form-error">{error}</p>
            )}

            <div className="po-modal-actions">
              <button
                type="button"
                className="inventory-secondary-button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inventory-add-button"
                disabled={saving || inventory.length === 0}
              >
                <Plus size={15} />
                {saving ? "Creating..." : "Create Purchase Order"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function PurchaseOrdersTable({
  orders,
  inventory,
  onOrderCreated,
  onOrderUpdated,
  onInventoryUpdated,

}) {
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [modalOrder, setModalOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [receiving, setReceiving] = useState(false);

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
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const matchesStatus =
        selectedStatus === "All" || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchText, selectedStatus]);

  const createOrder = async (orderData) => {
    setSaving(true);

    try {
      const createdOrder = await createPurchaseOrder(orderData);

      if (createdOrder) {
        onOrderCreated(mapPurchaseOrder(createdOrder));
      }

      setShowCreateModal(false);
      showToast("Purchase order created successfully.");
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async (orderId, items) => {
    setReceiving(true);
  
    try {
      // 1. Send received quantities to the backend.
      const updatedOrder = await receivePurchaseOrder(orderId, items);
  
      // 2. Convert the backend response into our UI format.
      const mappedOrder = mapPurchaseOrder(updatedOrder);
  
      // 3. Update the purchase order in the parent component.
      onOrderUpdated(mappedOrder);
  
      // 4. Keep the modal updated with the latest PO details.
      setModalOrder(mappedOrder);
  
      // 5. Fetch inventory again because stock has changed.
      const updatedInventory = await getInventory();
  
      onInventoryUpdated(updatedInventory);
  
      showToast("Stock received and inventory updated successfully.");
    } finally {
      setReceiving(false);
    }
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
        minWidth: 145,
        cellRenderer: PurchaseOrderStatus,
      },
      {
        headerName: "Actions",
        minWidth: 90,
        maxWidth: 110,
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
          </div>
        ),
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      //filter: false,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  const context = useMemo(
    () => ({
      onView: (order) => setModalOrder(order),
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
          <option value="Partially Received">Partially Received</option>
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
          onReceive={handleReceive}
    receiving={receiving}

        />
      )}

      {showCreateModal && (
        <PurchaseOrderModal
          inventory={inventory}
          saving={saving}
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
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadPageData = async () => {
      try {
        setLoading(true);
        setError("");

        const [purchaseOrders, products] = await Promise.all([
          getPurchaseOrders(controller.signal),
          getInventory(controller.signal),
        ]);

        if (controller.signal.aborted) return;

        setOrders(purchaseOrders.map(mapPurchaseOrder));
        setInventory(products);
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          setError(
            err.message || "Failed to load purchase orders."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPageData();

    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => order.status === "Pending"
    ).length;

    const approved = orders.filter(
      (order) => order.status === "Approved"
    ).length;

    const received = orders.filter(
      (order) => order.status === "Received"
    ).length;

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

  const handleOrderCreated = (newOrder) => {
    setOrders((current) => [newOrder, ...current]);
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
  };
  
  const handleInventoryUpdated = (updatedInventory) => {
    setInventory(updatedInventory);
  };

  return (
    <div className="dashboard-overview">
      <div className="overview-heading">
        <div>
          <h2>Purchase Orders</h2>
          <p>
            Manage supplier orders, track approvals, and monitor incoming stock.
          </p>
        </div>

        <span className="demo-data-label">LIVE DATA</span>
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

        {loading ? (
          <p className="inventory-empty-state">
            Loading purchase orders...
          </p>
        ) : error ? (
          <p className="inventory-form-error">{error}</p>
        ) : (
          <PurchaseOrdersTable
            orders={orders}
            inventory={inventory}
            onOrderCreated={handleOrderCreated}
            onOrderUpdated={handleOrderUpdated}
            onInventoryUpdated={handleInventoryUpdated}
          
          />
        )}
      </section>
    </div>
  );
}
