const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.error('Usage: node scripts/reset-user-password.js <email> <newPassword>');
  process.exit(1);
}

const [email, newPassword] = argv;

(async () => {
  try {
    const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const [result] = await db.query('UPDATE users SET password = ? WHERE email = ?', [hashed, email]);
    if (result.affectedRows === 0) {
      console.error('No user found with that email');
      process.exit(2);
    }
    console.log('Password updated for', email);
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset password:', err.message || err);
    process.exit(1);
  }
})();
