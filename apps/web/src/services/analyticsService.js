import { apiRequest } from "./apiService";

export const getAnalytics = (signal) =>
  apiRequest("/api/v1/analytics", {
    method: "GET",
    signal,
  });