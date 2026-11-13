import { apiRequest } from "./apiService";

export const getStockoutRisks = (signal) =>
  apiRequest("/api/v1/stockout-risks", {
    method: "GET",
    signal,
  });