/**
 * Client-side password utility functions
 * These functions can be used in both client and server components
 */

/**
 * Generate a random password
 * Only uses lowercase English letters (a-z) and numbers (0-9)
 * @param length - Length of the password (default: 8)
 * @returns Generated password string
 */
export function generatePassword(length: number = 8): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = lowercase + numbers;

  let password = '';

  // Ensure at least one lowercase letter and one number
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
