import { describe, it, expect } from 'vitest';
import { encryptWebCrypto, decryptWebCrypto } from './webCrypto';

// Mock window.crypto for the test environment
// Vitest/JSDOM might not have full SubtleCrypto support depending on version
describe('WebCrypto Utils', () => {
  it('should encrypt and decrypt a string correctly', async () => {
    const original = { message: 'secret webcrypto message' };
    const password = 'secure-password';
    
    const result = await encryptWebCrypto(original, password);
    expect(result).toHaveProperty('cipher');
    expect(result).toHaveProperty('salt');
    expect(result).toHaveProperty('iv');
    
    const decrypted = await decryptWebCrypto(result.cipher, result.salt, result.iv, password);
    expect(decrypted).toEqual(original);
  });

  it('should return null for incorrect password', async () => {
    const original = { message: 'secret webcrypto message' };
    const password = 'secure-password';
    const wrongPassword = 'wrong-password';
    
    const result = await encryptWebCrypto(original, password);
    const decrypted = await decryptWebCrypto(result.cipher, result.salt, result.iv, wrongPassword);
    
    expect(decrypted).toBeNull();
  });
});
