export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("inventory_snapshots", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    organization_id: {
      type: "uuid",
      notNull: true,
      references: '"organizations"',
      onDelete: "CASCADE",
    },
    snapshot_date: {
      type: "date",
      notNull: true,
    },
    total_products: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    total_units: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    inventory_value: {
      type: "numeric(14,2)",
      notNull: true,
      default: 0,
    },
    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.addConstraint(
    "inventory_snapshots",
    "inventory_snapshots_organization_date_unique",
    {
      unique: ["organization_id", "snapshot_date"],
    }
  );

  pgm.createIndex("inventory_snapshots", ["organization_id", "snapshot_date"]);
};

export const down = (pgm) => {
  pgm.dropTable("inventory_snapshots");
};