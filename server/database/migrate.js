const { sequelize } = require('../config/database');

async function migrate() {
  try {
    await sequelize.authenticate();

    await sequelize.query(`
      ALTER TABLE "maintenance_requests"
      ALTER COLUMN "mold_id" DROP NOT NULL;
    `);

    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'enum_maintenance_requests_type'
        ) THEN
          ALTER TYPE "enum_maintenance_requests_type" ADD VALUE IF NOT EXISTS 'other';
        END IF;
      END
      $$;
    `);

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrate();
