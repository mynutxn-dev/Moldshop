const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  'postgres',
  'postgres.vrttehtkletviugcsxfv',
  'Mynutsmurf11!N',
  {
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    dialectModule: require('pg'),
  }
);

async function check() {
  try {
    await sequelize.authenticate();
    const tableInfo = await sequelize.getQueryInterface().describeTable('maintenance_requests');
    console.log(Object.keys(tableInfo));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
