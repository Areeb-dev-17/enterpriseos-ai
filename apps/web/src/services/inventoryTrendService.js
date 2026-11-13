import { apiRequest } from "./apiService";

export const getInventoryTrend = (months = 6, signal) =>
  apiRequest(
    `/api/v1/analytics/inventory-trend?months=${months}`,
    {
      method: "GET",
      signal,
    }
  );