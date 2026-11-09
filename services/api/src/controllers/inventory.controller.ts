
import type { Request, Response } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  InventoryError,
} from "../services/inventory.service.js";

import type {
  ProductInput,
  ProductUpdateInput,
} from "../repositories/inventory.repository.js";

const getOrganizationId = (req: Request): string => {
  if (!req.user?.organizationId) {
    throw new InventoryError("Organization not found in token", 401);
  }

  return req.user.organizationId;
};

const handleError = (error: unknown, res: Response) => {
  if (error instanceof InventoryError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // PostgreSQL unique violation: duplicate SKU within an organization.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return res.status(409).json({
      success: false,
      message: "A product with this SKU already exists",
    });
  }

  console.error("Inventory API error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export const createInventoryProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = getOrganizationId(req);
    const product = await createProduct(
      organizationId,
      req.body as ProductInput
    );

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getInventoryProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = getOrganizationId(req);
    const products = await getProducts(organizationId);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getInventoryProductById = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = getOrganizationId(req);
    const productId = String(req.params.id);

    const product = await getProductById(productId, organizationId);

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const updateInventoryProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = getOrganizationId(req);
    const productId = String(req.params.id);

    const product = await updateProduct(
      productId,
      organizationId,
      req.body as ProductUpdateInput
    );

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteInventoryProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const organizationId = getOrganizationId(req);
    const productId = String(req.params.id);

    await deleteProduct(productId, organizationId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return handleError(error, res);
  }
};
