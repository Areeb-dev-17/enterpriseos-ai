import { getInventoryTrend } from "../repositories/inventory-trend.repository.js";

export const getInventoryTrendData = async (
  organizationId: string,
  months = 6
) => {
  if (!organizationId) {
    throw new Error("Organization ID is required");
  }

  if (!Number.isInteger(months) || months < 1 || months > 12) {
    throw new Error("Months must be between 1 and 12");
  }

  return getInventoryTrend(organizationId, months);
};