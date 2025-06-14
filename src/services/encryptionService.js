// Note Encryption Service using Web Crypto API

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
  }

  // Generate a key from password using PBKDF2
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive actual encryption key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate random bytes
  generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  // Encrypt note content
  async encryptNote(content, password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({
        content,
        timestamp: new Date().toISOString()
      }));
      
      // Generate salt and IV
      const salt = this.generateRandomBytes(16);
      const iv = this.generateRandomBytes(this.ivLength);
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Encrypt the data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );
      
      // Combine salt, IV, and encrypted data
      const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encryptedData), salt.length + iv.length);
      
      // Convert to base64 for storage
      return {
        encryptedContent: this.arrayBufferToBase64(result),
        isEncrypted: true,
        encryptedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt note');
    }
  }

  // Decrypt note content
  async decryptNote(encryptedContent, password) {
    try {
      // Convert from base64
      const encryptedData = this.base64ToArrayBuffer(encryptedContent);
      
      // Extract salt, IV, and encrypted content
      const salt = encryptedData.slice(0, 16);
      const iv = encryptedData.slice(16, 16 + this.ivLength);
      const content = encryptedData.slice(16 + this.ivLength);
      
      // Derive key from password
      const key = await this.deriveKey(password, salt);
      
      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        content
      );
      
      // Convert back to string and parse
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedData);
      const parsedData = JSON.parse(decryptedString);
      
      return {
        content: parsedData.content,
        timestamp: parsedData.timestamp,
        success: true
      };
    } catch (error) {
      console.error('Decryption failed:', error);
      return {
        content: null,
        success: false,
        error: 'Invalid password or corrupted data'
      };
    }
  }

  // Verify password without full decryption
  async verifyPassword(encryptedContent, password) {
    try {
      const result = await this.decryptNote(encryptedContent, password);
      return result.success;
    } catch (error) {
      return false;
    }
  }

  // Generate a secure password
  generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = this.generateRandomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
  }

  // Check password strength
  checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    let feedback = [];
    
    if (password.length >= minLength) score++;
    else feedback.push(`At least ${minLength} characters`);
    
    if (hasUpperCase) score++;
    else feedback.push('Include uppercase letters');
    
    if (hasLowerCase) score++;
    else feedback.push('Include lowercase letters');
    
    if (hasNumbers) score++;
    else feedback.push('Include numbers');
    
    if (hasSpecialChar) score++;
    else feedback.push('Include special characters');
    
    const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : score <= 4 ? 'strong' : 'very strong';
    
    return {
      score,
      strength,
      feedback,
      isValid: score >= 3
    };
  }

  // Utility functions
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // Hash password for verification (one-way)
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }
}

export default new EncryptionService();