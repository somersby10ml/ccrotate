import { describe, it, expect } from 'vitest';
import { formatExpiresAt } from './formatExpiresAt.js';

describe('formatExpiresAt', () => {
  it('should return "Unknown" for null or undefined input', () => {
    expect(formatExpiresAt(null)).toBe('Unknown');
    expect(formatExpiresAt(undefined)).toBe('Unknown');
    expect(formatExpiresAt('')).toBe('Unknown');
  });

  it('should return "Invalid" for invalid date strings', () => {
    expect(formatExpiresAt('invalid-date')).toBe('Invalid');
    expect(formatExpiresAt('abc123')).toBe('Invalid');
  });

  it('should format valid ISO date string to KST', () => {
    // UTC 2024-01-01 00:00:00 -> KST 2024-01-01 09:00:00
    expect(formatExpiresAt('2024-01-01T00:00:00Z')).toBe('2024-01-01 09:00:00');
    
    // UTC 2024-12-31 15:30:45 -> KST 2025-01-01 00:30:45
    expect(formatExpiresAt('2024-12-31T15:30:45Z')).toBe('2025-01-01 00:30:45');
  });

  it('should format timestamp numbers to KST', () => {
    // Timestamp for 2024-01-01 00:00:00 UTC
    const timestamp = new Date('2024-01-01T00:00:00Z').getTime();
    expect(formatExpiresAt(timestamp)).toBe('2024-01-01 09:00:00');
  });

  it('should handle edge cases around midnight', () => {
    // UTC 2024-01-01 14:59:59 -> KST 2024-01-01 23:59:59
    expect(formatExpiresAt('2024-01-01T14:59:59Z')).toBe('2024-01-01 23:59:59');
    
    // UTC 2024-01-01 15:00:00 -> KST 2024-01-02 00:00:00
    expect(formatExpiresAt('2024-01-01T15:00:00Z')).toBe('2024-01-02 00:00:00');
  });

  it('should pad single digit values with zeros', () => {
    // UTC 2024-03-05 01:05:09 -> KST 2024-03-05 10:05:09
    expect(formatExpiresAt('2024-03-05T01:05:09Z')).toBe('2024-03-05 10:05:09');
  });
});