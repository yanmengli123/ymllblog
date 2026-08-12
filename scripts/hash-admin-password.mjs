import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('用法: node scripts/hash-admin-password.mjs "至少12位的强密码"');
  process.exit(1);
}

const N = 32768;
const r = 8;
const p = 1;
const salt = randomBytes(16);
const digest = await scrypt(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
console.log(`scrypt$N=${N},r=${r},p=${p}$${salt.toString('base64url')}$${digest.toString('base64url')}`);
