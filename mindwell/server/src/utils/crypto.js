import crypto from 'crypto';

/**
 * Encryption strategy
 * -------------------
 * - Every user gets a random 256-bit data key (DEK) at registration.
 * - The DEK is wrapped (encrypted) with a key derived from the user's password
 *   using scrypt, and only the wrapped form is stored in MongoDB.
 * - Journal text is encrypted with the DEK using AES-256-GCM (authenticated
 *   encryption, a fresh random 96-bit IV per value).
 * - On login the DEK is unwrapped with the password and sealed inside the
 *   session token using SERVER_SECRET, so it is never stored in the database.
 *
 * Stored format for every encrypted value: base64(iv) . base64(authTag) . base64(ciphertext)
 */

const ALGO = 'aes-256-gcm';

export const randomKey = () => crypto.randomBytes(32);

export function encrypt(plain, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload, key) {
  const [iv, tag, ct] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

// Password -> 256-bit key encryption key (KEK)
export const deriveKey = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, { N: 2 ** 14, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });

const serverKey = () => crypto.createHash('sha256').update(process.env.SERVER_SECRET).digest();

// Seal / unseal the DEK for transport inside the session token
export const sealKey = (dek) => encrypt(dek.toString('base64'), serverKey());
export const unsealKey = (sealed) => Buffer.from(decrypt(sealed, serverKey()), 'base64');
