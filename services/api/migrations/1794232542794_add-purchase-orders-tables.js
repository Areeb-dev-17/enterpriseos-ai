
export const up = (pgm) => {
    // 1. Parent table
    pgm.createTable("purchase_orders", {
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
      supplier_name: {
        type: "varchar(255)",
        notNull: true,
      },
      status: {
        type: "varchar(30)",
        notNull: true,
        default: "Pending",
      },
      expected_date: {
        type: "date",
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
  
    // Composite unique key for organization + PO
    pgm.addConstraint("purchase_orders", "purchase_orders_org_id_unique", {
      unique: ["organization_id", "id"],
    });
  
    // Composite unique key for organization + product
    pgm.addConstraint("products", "products_org_id_id_unique", {
      unique: ["organization_id", "id"],
    });
  
    // 2. Child table
    pgm.createTable("purchase_order_items", {
      id: {
        type: "uuid",
        primaryKey: true,
        notNull: true,
        default: pgm.func("gen_random_uuid()"),
      },
      organization_id: {
        type: "uuid",
        notNull: true,
      },
      purchase_order_id: {
        type: "uuid",
        notNull: true,
      },
      product_id: {
        type: "uuid",
        notNull: true,
      },
      quantity: {
        type: "integer",
        notNull: true,
      },
      received_quantity: {
        type: "integer",
        notNull: true,
        default: 0,
      },
      unit_cost: {
        type: "numeric(12,2)",
        notNull: true,
      },
    });
  
    // 3. Composite foreign keys
    pgm.addConstraint("purchase_order_items", "po_items_org_po_fk", {
      foreignKeys: {
        columns: ["organization_id", "purchase_order_id"],
        references: "purchase_orders(organization_id, id)",
        onDelete: "CASCADE",
      },
    });
  
    pgm.addConstraint("purchase_order_items", "po_items_org_product_fk", {
      foreignKeys: {
        columns: ["organization_id", "product_id"],
        references: "products(organization_id, id)",
        onDelete: "RESTRICT",
      },
    });
  
    // 4. Prevent duplicate products in one PO
    pgm.addConstraint("purchase_order_items", "po_items_unique_product", {
      unique: ["purchase_order_id", "product_id"],
    });
  
    // 5. Status validation
    pgm.addConstraint("purchase_orders", "purchase_orders_status_check", {
      check: "status IN ('Pending', 'Approved', 'Partially Received', 'Received', 'Cancelled')",
    });
  
    // 6. Quantity validation
    pgm.addConstraint("purchase_order_items", "po_items_quantity_positive", {
      check: "quantity > 0",
    });
  
    pgm.addConstraint("purchase_order_items", "po_items_received_quantity_valid", {
      check: "received_quantity >= 0 AND received_quantity <= quantity",
    });
  
    pgm.addConstraint("purchase_order_items", "po_items_unit_cost_non_negative", {
      check: "unit_cost >= 0",
    });
  
    // 7. Indexes
    pgm.createIndex("purchase_orders", "organization_id");
    pgm.createIndex("purchase_orders", "status");
    pgm.createIndex("purchase_order_items", "purchase_order_id");
    pgm.createIndex("purchase_order_items", "product_id");
    pgm.createIndex("purchase_order_items", "organization_id");
  };
  
  export const down = (pgm) => {
    pgm.dropTable("purchase_order_items");
    pgm.dropTable("purchase_orders");
  
    // Remove the extra unique constraint added to products.
    pgm.dropConstraint("products", "products_org_id_id_unique");
  };
  