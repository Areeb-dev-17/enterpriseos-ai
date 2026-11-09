exports.up = (pgm) => {
    pgm.createTable("refresh_sessions", {
      id: {
        type: "uuid",
        primaryKey: true,
        default: pgm.func("gen_random_uuid()"),
      },
      user_id: {
        type: "uuid",
        notNull: true,
        references: '"users"',
        onDelete: "CASCADE",
      },
      organization_id: {
        type: "uuid",
        notNull: true,
        references: '"organizations"',
        onDelete: "CASCADE",
      },
      token_hash: {
        type: "text",
        notNull: true,
        unique: true,
      },
      expires_at: {
        type: "timestamptz",
        notNull: true,
      },
      revoked_at: {
        type: "timestamptz",
        default: null,
      },
      created_at: {
        type: "timestamptz",
        notNull: true,
        default: pgm.func("current_timestamp"),
      },
    });
  
    pgm.createIndex("refresh_sessions", "user_id");
    pgm.createIndex("refresh_sessions", "organization_id");
    pgm.createIndex("refresh_sessions", "expires_at");
  };
  
  exports.down = (pgm) => {
    pgm.dropTable("refresh_sessions");
  };