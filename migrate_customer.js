const { Sequelize, DataTypes } = require('sequelize');

process.env.DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com";
process.env.DB_NAME = "postgres";
process.env.DB_PASSWORD = "Mynutsmurf11!N";
process.env.DB_PORT = "6543";
process.env.DB_SSL = "true";
process.env.DB_USER = "postgres.vrttehtkletviugcsxfv";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false, // For testing, often required for supabase
            },
        },
        pool: { max: 1 },
        dialectModule: require('pg'),
    }
);

async function run() {
    try {
        await sequelize.authenticate();
        console.log("Connected directly to Supabase.");

        await sequelize.query(`ALTER TABLE "work_orders" ADD COLUMN IF NOT EXISTS "customer" VARCHAR(100);`);
        console.log("Successfully added 'customer' column to work_orders.");

    } catch (error) {
        console.error("Migration Error:", error.message);
    } finally {
        process.exit(0);
    }
}

run();
