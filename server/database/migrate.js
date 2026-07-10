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

    await sequelize.query(`
      ALTER TABLE "work_orders"
      ADD COLUMN IF NOT EXISTS "current_stage_date" DATE,
      ADD COLUMN IF NOT EXISTS "work_location" VARCHAR(200);
    `);

    await sequelize.query(`
      UPDATE "work_orders"
      SET "current_stage_date" = COALESCE("completed_date", "updated_at"::date, "created_at"::date)
      WHERE "current_stage_date" IS NULL;
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
