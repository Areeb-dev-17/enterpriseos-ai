import type { Request, Response } from "express";
import { getOrganizationById } from "../repositories/organization.repository.js";

export const getOrganizations = async (req: Request, res: Response) => {
    try {
      const organizationId = req.user?.organizationId;
  
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: "Organization access denied",
        });
      }
  
      const organization = await getOrganizationById(organizationId);
  
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        count: 1,
        data: [organization],
      });
    } catch (error) {
      console.error("Error fetching organization:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to fetch organization",
      });
    }
  };