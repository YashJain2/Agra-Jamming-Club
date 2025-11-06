import crypto from 'crypto';

// Encryption key - should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted string (base64 encoded)
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get auth tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param encryptedText - Encrypted string (base64 encoded)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 * @param text - Text to hash
 * @returns Hashed string
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Mask sensitive data for display (e.g., email, phone, card numbers)
 * @param text - Text to mask
 * @param type - Type of data to mask
 * @returns Masked string
 */
export function maskSensitiveData(text: string, type: 'email' | 'phone' | 'card' | 'default' = 'default'): string {
  if (!text) return '';
  
  switch (type) {
    case 'email':
      const [localPart, domain] = text.split('@');
      if (localPart.length <= 2) return text;
      const maskedLocal = localPart.slice(0, 2) + '*'.repeat(Math.min(localPart.length - 2, 4)) + localPart.slice(-1);
      return `${maskedLocal}@${domain}`;
    
    case 'phone':
      if (text.length <= 4) return text;
      return text.slice(0, 2) + '*'.repeat(text.length - 6) + text.slice(-4);
    
    case 'card':
      if (text.length <= 4) return text;
      return '*'.repeat(text.length - 4) + text.slice(-4);
    
    default:
      if (text.length <= 4) return text;
      return text.slice(0, 2) + '*'.repeat(Math.min(text.length - 4, 8)) + text.slice(-2);
  }
}

/**
 * Encrypt payment gateway response data
 * @param data - Payment gateway response object
 * @returns Encrypted data object
 */
export function encryptPaymentData(data: {
  paymentId?: string;
  orderId?: string;
  signature?: string;
  [key: string]: any;
}): Record<string, string> {
  const encrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'string' && (key.includes('Id') || key.includes('signature') || key.includes('token'))) {
      encrypted[key] = encrypt(value);
    } else {
      encrypted[key] = value as string;
    }
  }
  
  return encrypted;
}

/**
 * Decrypt payment gateway response data
 * @param data - Encrypted payment gateway response object
 * @returns Decrypted data object
 */
export function decryptPaymentData(data: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'string' && (key.includes('Id') || key.includes('signature') || key.includes('token'))) {
      try {
        decrypted[key] = decrypt(value);
      } catch (error) {
        // If decryption fails, return original value (might not be encrypted)
        decrypted[key] = value;
      }
    } else {
      decrypted[key] = value;
    }
  }
  
  return decrypted;
}

/**
 * Encrypt user PII (Personally Identifiable Information)
 * @param data - User data object
 * @returns Encrypted user data object
 */
export function encryptUserPII(data: {
  email?: string;
  phone?: string;
  [key: string]: any;
}): Record<string, string> {
  const encrypted: Record<string, any> = { ...data };
  
  if (data.email) {
    encrypted.email = encrypt(data.email);
  }
  
  if (data.phone) {
    encrypted.phone = encrypt(data.phone);
  }
  
  return encrypted;
}

/**
 * Decrypt user PII
 * @param data - Encrypted user data object
 * @returns Decrypted user data object
 */
export function decryptUserPII(data: Record<string, any>): Record<string, any> {
  const decrypted: Record<string, any> = { ...data };
  
  if (data.email && typeof data.email === 'string') {
    try {
      decrypted.email = decrypt(data.email);
    } catch (error) {
      decrypted.email = data.email; // Might not be encrypted
    }
  }
  
  if (data.phone && typeof data.phone === 'string') {
    try {
      decrypted.phone = decrypt(data.phone);
    } catch (error) {
      decrypted.phone = data.phone; // Might not be encrypted
    }
  }
  
  return decrypted;
}

