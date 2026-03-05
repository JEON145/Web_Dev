/**
 * UNIT TESTS - Test individual functions in isolation
 * Run with: npm test
 */

import { z } from 'zod';

// Copy of the validation schema from server.js
const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
  shopName: z.string().min(2),
  securityQuestion: z.string().min(5),
  securityAnswer: z.string().min(2),
});

describe('User Registration Validation', () => {
  
  // Test 1: Valid registration data
  test('should accept valid registration data', () => {
    const validData = {
      username: 'TestUser123',
      password: 'Password1',
      email: 'test@example.com',
      role: 'user',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // Test 2: Invalid username (too short)
  test('should reject username shorter than 3 characters', () => {
    const invalidData = {
      username: 'AB',
      password: 'Password1',
      email: 'test@example.com',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 3: Invalid username (special characters)
  test('should reject username with special characters', () => {
    const invalidData = {
      username: 'User@123!',
      password: 'Password1',
      email: 'test@example.com',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 4: Invalid password (no uppercase)
  test('should reject password without uppercase letter', () => {
    const invalidData = {
      username: 'TestUser',
      password: 'password1',
      email: 'test@example.com',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 5: Invalid password (no number)
  test('should reject password without number', () => {
    const invalidData = {
      username: 'TestUser',
      password: 'Password',
      email: 'test@example.com',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 6: Invalid email format
  test('should reject invalid email format', () => {
    const invalidData = {
      username: 'TestUser',
      password: 'Password1',
      email: 'notanemail',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 7: Shop name too short
  test('should reject shop name shorter than 2 characters', () => {
    const invalidData = {
      username: 'TestUser',
      password: 'Password1',
      email: 'test@example.com',
      shopName: 'A',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  // Test 8: Default role should be 'user'
  test('should default role to user when not specified', () => {
    const dataWithoutRole = {
      username: 'TestUser',
      password: 'Password1',
      email: 'test@example.com',
      shopName: 'My Shop',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'Buddy'
    };
    
    const result = registerSchema.safeParse(dataWithoutRole);
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('user');
  });
});

// Inventory quantity validation tests
describe('Inventory Quantity Validation', () => {
  
  const validateQuantity = (qty) => {
    return Number.isInteger(qty) && qty >= 0;
  };

  test('should accept positive integer quantity', () => {
    expect(validateQuantity(10)).toBe(true);
    expect(validateQuantity(100)).toBe(true);
    expect(validateQuantity(0)).toBe(true);
  });

  test('should reject negative quantity', () => {
    expect(validateQuantity(-5)).toBe(false);
  });

  test('should reject decimal quantity', () => {
    expect(validateQuantity(10.5)).toBe(false);
  });
});
