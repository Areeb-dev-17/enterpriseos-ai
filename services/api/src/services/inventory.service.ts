import {
    generateProductSku,
    createProduct as createProductRepository,
    getProducts as getProductsRepository,
    getProductById as getProductByIdRepository,
    updateProduct as updateProductRepository,
    deleteProduct as deleteProductRepository,
    type ProductInput,
    type ProductUpdateInput,
  } from "../repositories/inventory.repository.js";


  const categoryPrefixes: Record<string, string> = {
    Apparel: "APP",
    Accessories: "ACC",
    Footwear: "FOO",
  };
  
  export class InventoryError extends Error {
    constructor(
      message: string,
      public statusCode: number
    ) {
      super(message);
      this.name = "InventoryError";
    }
  }
  
  const validateProduct = (data: ProductInput) => {
    if (!data.productName?.trim()) {
      throw new InventoryError("Product name is required", 400);
    }
  
    // if (!data.sku?.trim()) {
    //   throw new InventoryError("SKU is required", 400);
    // }
  
    if (!data.category?.trim()) {
      throw new InventoryError("Category is required", 400);
    }
  
    if (!Number.isInteger(data.availableStock) || data.availableStock < 0) {
      throw new InventoryError(
        "Available stock must be a non-negative integer",
        400
      );
    }
  
    if (!Number.isInteger(data.reorderLevel) || data.reorderLevel < 0) {
      throw new InventoryError(
        "Reorder level must be a non-negative integer",
        400
      );
    }
  
    if (!Number.isFinite(data.unitPrice) || data.unitPrice < 0) {
      throw new InventoryError(
        "Unit price must be a non-negative number",
        400
      );
    }
  };
  
  const validateProductUpdate = (data: ProductUpdateInput) => {
    const allowedFields = [
      "productName",
      "sku",
      "category",
      "availableStock",
      "reorderLevel",
      "unitPrice",
    ];
  
    const providedFields = Object.keys(data);
  
    if (providedFields.length === 0) {
      throw new InventoryError("At least one field is required", 400);
    }
  
    const invalidFields = providedFields.filter(
      (field) => !allowedFields.includes(field)
    );
  
    if (invalidFields.length > 0) {
      throw new InventoryError(
        `Invalid fields: ${invalidFields.join(", ")}`,
        400
      );
    }
  
    if (
      data.productName !== undefined &&
      !data.productName.trim()
    ) {
      throw new InventoryError("Product name cannot be empty", 400);
    }
  
    if (data.sku !== undefined && !data.sku.trim()) {
      throw new InventoryError("SKU cannot be empty", 400);
    }
  
    if (data.category !== undefined && !data.category.trim()) {
      throw new InventoryError("Category cannot be empty", 400);
    }
  
    if (
      data.availableStock !== undefined &&
      (!Number.isInteger(data.availableStock) || data.availableStock < 0)
    ) {
      throw new InventoryError(
        "Available stock must be a non-negative integer",
        400
      );
    }
  
    if (
      data.reorderLevel !== undefined &&
      (!Number.isInteger(data.reorderLevel) || data.reorderLevel < 0)
    ) {
      throw new InventoryError(
        "Reorder level must be a non-negative integer",
        400
      );
    }
  
    if (
      data.unitPrice !== undefined &&
      (!Number.isFinite(data.unitPrice) || data.unitPrice < 0)
    ) {
      throw new InventoryError(
        "Unit price must be a non-negative number",
        400
      );
    }
  };
  
  export const createProduct = async (
    organizationId: string,
    data: ProductInput
  ) => {
    validateProduct(data);
  
    const category = data.category.trim();
    const prefix = categoryPrefixes[category];
  
    if (!prefix) {
      throw new InventoryError("Invalid product category", 400);
    }
  
    const sku = await generateProductSku(organizationId, prefix);
  
    return createProductRepository(organizationId, sku, {
      ...data,
      productName: data.productName.trim(),
      category,
    });
  };
  
  export const getProducts = async (organizationId: string) => {
    return getProductsRepository(organizationId);
  };
  
  export const getProductById = async (
    id: string,
    organizationId: string
  ) => {
    const product = await getProductByIdRepository(id, organizationId);
  
    if (!product) {
      throw new InventoryError("Product not found", 404);
    }
  
    return product;
  };
  
  export const updateProduct = async (
    id: string,
    organizationId: string,
    data: ProductUpdateInput
  ) => {
    validateProductUpdate(data);
  
    const cleanedData: ProductUpdateInput = {
      ...data,
      ...(data.productName !== undefined && {
        productName: data.productName.trim(),
      }),
      ...(data.sku !== undefined && {
        sku: data.sku.trim(),
      }),
      ...(data.category !== undefined && {
        category: data.category.trim(),
      }),
    };
  
    const product = await updateProductRepository(
      id,
      organizationId,
      cleanedData
    );
  
    if (!product) {
      throw new InventoryError("Product not found", 404);
    }
  
    return product;
  };
  
  export const deleteProduct = async (
    id: string,
    organizationId: string
  ) => {
    const product = await deleteProductRepository(id, organizationId);
  
    if (!product) {
      throw new InventoryError("Product not found", 404);
    }
  
    return product;
  };
  