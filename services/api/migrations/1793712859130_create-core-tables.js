
exports.up = (pgm) => {
    // 1. Organizations
    pgm.createTable("organizations", {
      id: {
        type: "uuid",
        primaryKey: true,
        default: pgm.func("gen_random_uuid()"),
      },
      name: {
        type: "varchar(150)",
        notNull: true,
      },
      slug: {
        type: "varchar(100)",
        notNull: true,
        unique: true,
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
  
    // 2. Users
    pgm.createTable("users", {
      id: {
        type: "uuid",
        primaryKey: true,
        default: pgm.func("gen_random_uuid()"),
      },
      name: {
        type: "varchar(150)",
        notNull: true,
      },
      email: {
        type: "varchar(255)",
        notNull: true,
        unique: true,
      },
      password_hash: {
        type: "text",
        notNull: true,
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
  
    // 3. Memberships
    pgm.createTable("memberships", {
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
      user_id: {
        type: "uuid",
        notNull: true,
        references: '"users"',
        onDelete: "CASCADE",
      },
      role: {
        type: "varchar(30)",
        notNull: true,
        default: "member",
      },
      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
    });
  
    // A user can belong to an organization only once
    pgm.addConstraint("memberships", "memberships_org_user_unique", {
      unique: ["organization_id", "user_id"],
    });
  
    // Fast lookup of memberships by user
    pgm.createIndex("memberships", "user_id");
  };
  
  exports.down = (pgm) => {
    pgm.dropTable("memberships");
    pgm.dropTable("users");
    pgm.dropTable("organizations");
  };
  