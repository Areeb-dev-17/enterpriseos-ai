import { getInventoryAnalytics } from "../repositories/analytics.repository.js";

export const getAnalytics = async (organizationId: string) => {
  return getInventoryAnalytics(organizationId);
};