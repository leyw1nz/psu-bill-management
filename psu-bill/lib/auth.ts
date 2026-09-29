// Client-side authentication utilities (safe for browser)
import { User } from '@/types';

export async function createSession(userId: string) {
  // Session creation logic
  // In a real app, you would create a JWT token or session here
  if (typeof window !== 'undefined') {
    localStorage.setItem('userId', userId);
  }
  return true;
}

export async function destroySession() {
  // Session destruction logic
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  }
  return true;
}

export function getCurrentUser(): Omit<User, 'password'> | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setCurrentUser(user: Omit<User, 'password'>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Check if user is OIDC user (has staff_id)
export function isOIDCUser(user: Omit<User, 'password'> | null): boolean {
  return !!(user?.staff_id);
}

// Regular logout for username/password users
export async function logout() {
  await destroySession();
  window.location.href = '/';
}

// OIDC logout for PSU staff users
export async function logoutOIDC() {
  try {
    // Call the OIDC logout API
    const response = await fetch('/api/auth/oidc/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    const data = await response.json();

    // Clear local session
    await destroySession();

    // If there's an OIDC logout URL, redirect to it
    if (data.logoutUrl) {
      window.location.href = data.logoutUrl;
    } else {
      // Otherwise just redirect to login page
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, clear local session and redirect
    await destroySession();
    window.location.href = '/';
  }
}

// Smart logout - checks user type and calls appropriate logout method
export async function handleLogout() {
  const user = getCurrentUser();
  if (isOIDCUser(user)) {
    await logoutOIDC();
  } else {
    await logout();
  }
}
