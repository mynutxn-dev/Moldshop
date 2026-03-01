require('dotenv').config();
const { User } = require('./server/models');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    try {
        const user = await User.findOne({ where: { username: 'admin' } });
        if (!user) {
            console.log('❌ Admin user not found');
            return;
        }
        console.log('✅ Found admin user');
        console.log('- username:', user.username);
        console.log('- hash in DB:', user.password);

        const isMatch = await bcrypt.compare('admin123', user.password);
        console.log('- "admin123" matches hash?', isMatch);

        // Test alternative passwords if any
        const isMatch2 = await bcrypt.compare('password', user.password);
        console.log('- "password" matches hash?', isMatch2);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Override connection settings to use pooler for testing live DB
process.env.DB_HOST = 'aws-1-ap-southeast-1.pooler.supabase.com';
process.env.DB_PORT = '6543';
process.env.DB_USER = 'postgres.vrttehtkletviugcsxfv';
process.env.DB_PASSWORD = 'Mynutsmurf11!N';
process.env.DB_NAME = 'postgres';
process.env.DB_SSL = 'true';

checkAdmin();
