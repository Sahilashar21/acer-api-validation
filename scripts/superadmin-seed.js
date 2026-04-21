const dotenv = require('dotenv');
const db = require('../src/config/db');
const userService = require('../src/services/userService');

dotenv.config();

async function seedSuperadmin() {
  const username = process.env.SUPERADMIN_USERNAME || 'ebg_acer_SAdmin';
  const password = process.env.SUPERADMIN_PASSWORD || '12345678';

  try {
    const created = await userService.ensureSystemAdmin({ username, password });
    if (created) {
      console.log(`Superadmin created: ${username}`);
    } else {
      console.log('Superadmin already exists. No changes made.');
    }
  } catch (error) {
    console.error('Superadmin seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

seedSuperadmin();