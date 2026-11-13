import { getStockoutRiskProducts } from "../repositories/stockout-risk.repository.js";

export const getStockoutRisks = async (organizationId: string) => {
  const risks = await getStockoutRiskProducts(organizationId);

  return {
    totalRisks: risks.length,
    criticalCount: risks.filter((item) => item.riskLevel === "Critical").length,
    highCount: risks.filter((item) => item.riskLevel === "High").length,
    mediumCount: risks.filter((item) => item.riskLevel === "Medium").length,
    products: risks,
  };
};