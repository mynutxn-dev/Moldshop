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
    const MaintenanceRequest = require('./server/models/MaintenanceRequest');
    
    // Check if we can create a simple request
    const count = await MaintenanceRequest.count();
    const requestCode = `MT-TEST-${String(count + 1).padStart(4, '0')}`;
    
    console.log('Testing creation with:', {
      requestCode,
      moldId: 1, // Assume 1 exists
      description: 'Test',
      type: 'repair',
    });
    
    // We expect this to fail or succeed, showing the actual database error
    const req = await MaintenanceRequest.create({
      requestCode,
      moldId: 1,
      description: 'Test',
      type: 'repair',
      requestedById: 1
    });
    console.log('Created successfully:', req.id);
    await req.destroy();
  } catch (err) {
    console.log('Full Error:', err.name);
    if(err.errors) console.log(err.errors);
    if(err.parent) console.log(err.parent);
  } finally {
    process.exit(0);
  }
}
check();
