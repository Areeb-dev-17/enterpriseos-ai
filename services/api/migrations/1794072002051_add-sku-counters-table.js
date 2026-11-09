export const up = (pgm) => {
    pgm.createTable("sku_counters", {
      organization_id: {
        type: "uuid",
        notNull: true,
        references: "organizations(id)",
        onDelete: "CASCADE",
      },
      prefix: {
        type: "varchar(10)",
        notNull: true,
      },
      last_value: {
        type: "integer",
        notNull: true,
        default: 0,
      },
    });
  
    pgm.addConstraint("sku_counters", "sku_counters_org_prefix_unique", {
      primaryKey: ["organization_id", "prefix"],
    });
  
    // Initialize counters from existing product SKUs.
    // This prevents generating a SKU that is already in use.
    pgm.sql(`
      INSERT INTO sku_counters (organization_id, prefix, last_value)
      SELECT
        organization_id,
        split_part(sku, '-', 1),
        MAX((regexp_match(sku, '^[A-Z]+-([0-9]+)$'))[1]::integer)
      FROM products
      WHERE sku ~ '^[A-Z]+-[0-9]+$'
      GROUP BY organization_id, split_part(sku, '-', 1);
    `);
  };
  
  export const down = (pgm) => {
    pgm.dropTable("sku_counters");
  };