const { Sequelize } = require('sequelize');
const seq = new Sequelize('postgres', 'postgres.vrttehtkletviugcsxfv', 'Mynutsmurf11!N', {
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    dialectModule: require('pg'),
});
seq.authenticate()
    .then(() => { console.log('✅ Pooler connection OK'); process.exit(0); })
    .catch(e => { console.error('❌ FAIL:', e.message); process.exit(1); });
