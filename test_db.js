const { sequelize } = require('./server/config/database');
const MaintenanceRequest = require('./server/models/MaintenanceRequest');

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
