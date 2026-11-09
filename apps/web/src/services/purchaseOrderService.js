
import { apiRequest } from "./apiService";

export const getPurchaseOrders = (signal) =>
  apiRequest("/api/v1/purchase-orders", {
    method: "GET",
    signal,
  });

export const getPurchaseOrderById = (id) =>
  apiRequest(`/api/v1/purchase-orders/${encodeURIComponent(id)}`, {
    method: "GET",
  });

export const createPurchaseOrder = (purchaseOrder) =>
  apiRequest("/api/v1/purchase-orders", {
    method: "POST",
    body: JSON.stringify(purchaseOrder),
  });
