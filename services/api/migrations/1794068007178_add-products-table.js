
/**
 * @type {import('node-pg-migrate').MigrationBuilder}
 */

export const up = (pgm) => {
    pgm.createTable("products", {
      id: {
        type: "uuid",
        primaryKey: true,
        notNull: true,
        default: pgm.func("gen_random_uuid()"),
      },
  
      organization_id: {
        type: "uuid",
        notNull: true,
        references: "organizations(id)",
        onDelete: "CASCADE",
      },
  
      product_name: {
        type: "varchar(255)",
        notNull: true,
      },
  
      sku: {
        type: "varchar(100)",
        notNull: true,
      },
  
      category: {
        type: "varchar(100)",
        notNull: true,
      },
  
      available_stock: {
        type: "integer",
        notNull: true,
        default: 0,
      },
  
      reorder_level: {
        type: "integer",
        notNull: true,
        default: 0,
      },
  
      unit_price: {
        type: "numeric(12,2)",
        notNull: true,
        default: 0,
      },
  
      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
  
      updated_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
    });
  
    pgm.addConstraint("products", "products_org_sku_unique", {
      unique: ["organization_id", "sku"],
    });
  
    pgm.addConstraint("products", "products_stock_non_negative", {
      check: "available_stock >= 0",
    });
  
    pgm.addConstraint("products", "products_reorder_non_negative", {
      check: "reorder_level >= 0",
    });
  
    pgm.addConstraint("products", "products_price_non_negative", {
      check: "unit_price >= 0",
    });
  
    pgm.createIndex("products", "organization_id");
    pgm.createIndex("products", ["organization_id", "category"]);
  };
  
  export const down = (pgm) => {
    pgm.dropTable("products");
  };
  