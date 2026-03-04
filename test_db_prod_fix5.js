const { Sequelize } = require('sequelize');
// Force override process.env variables so local dotenv doesn't break testing
process.env.DB_HOST="aws-1-ap-southeast-1.pooler.supabase.com";
process.env.DB_NAME="postgres";
process.env.DB_PASSWORD="Mynutsmurf11!N";
process.env.DB_PORT="6543";
process.env.DB_SSL="true";
process.env.DB_USER="postgres.vrttehtkletviugcsxfv";

const { sequelize } = require('./server/config/database');
const MaintenanceRequest = require('./server/models/MaintenanceRequest');
const Mold = require('./server/models/Mold');

async function check() {
  try {
    await sequelize.authenticate();
    
    // Find any existing mold
    const mold = await Mold.findOne();
    if (!mold) {
      console.log('No molds found in DB to test with');
      return;
    }
    
    // Check if we can create a simple request
    const count = await MaintenanceRequest.count();
    const requestCode = `MT-TEST-${String(count + 1).padStart(4, '0')}`;
    
    console.log('Testing creation with:', {
      requestCode,
      moldId: mold.id,
      description: 'Test',
      type: 'repair',
      reportDate: '2026-03-02',
    });
    
    const req = await MaintenanceRequest.create({
      requestCode,
      moldId: mold.id,
      description: 'Test',
      type: 'repair',
      reportDate: '2026-03-02',
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
