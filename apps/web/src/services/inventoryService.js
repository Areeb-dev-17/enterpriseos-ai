
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const inventoryRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Authentication required. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Inventory request failed");
  }

  return result.data;
};

// GET all products
export const getInventory = (signal) => {
  return inventoryRequest("/api/v1/inventory", {
    method: "GET",
    signal,
  });
};

// POST create product
export const createInventoryProduct = (product) => {
  return inventoryRequest("/api/v1/inventory", {
    method: "POST",
    body: JSON.stringify(product),
  });
};

// PATCH update product
export const updateInventoryProduct = (id, product) => {
  return inventoryRequest(`/api/v1/inventory/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
};

// DELETE product
export const deleteInventoryProduct = (id) => {
  return inventoryRequest(`/api/v1/inventory/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};
