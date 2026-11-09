
import { apiRequest } from "./apiService";

export const getInventory = (signal) =>
  apiRequest("/api/v1/inventory", {
    method: "GET",
    signal,
  });

export const createInventoryProduct = (product) =>
  apiRequest("/api/v1/inventory", {
    method: "POST",
    body: JSON.stringify(product),
  });

export const updateInventoryProduct = (id, product) =>
  apiRequest(`/api/v1/inventory/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });

export const deleteInventoryProduct = (id) =>
  apiRequest(`/api/v1/inventory/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
