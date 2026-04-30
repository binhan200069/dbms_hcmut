const db = require('./config/db');

async function test() {
    try {
        await db.query('SELECT 1');
        console.log('DB connected successfully');
    } catch (error) {
        console.error('DB connection error:', error.message);
    }
    process.exit();
}

test();