require('dotenv').config();
const { sequelize } = require('./server/config/database');
const { User } = require('./server/models');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection successful.');
        const users = await User.findAll();
        console.log('Users:');
        users.forEach(u => {
            console.log(`- ${u.username}: ${u.password.substring(0, 10)}... (Length: ${u.password.length})`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkUsers();
