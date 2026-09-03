import { UserAccount } from '../types';

export const ACCOUNTS_STORAGE_KEY = 'arcdesign_user_accounts';
export const CURRENT_USER_SESSION_KEY = 'arcdesign_current_user';

export const DEFAULT_ADMIN_ACCOUNT: UserAccount = {
  username: 'Admin',
  password: '812124750',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export function getStoredAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_ADMIN_ACCOUNT];
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure Admin always exists
      const hasAdmin = parsed.some(
        (acc: UserAccount) => acc.username.toLowerCase() === 'admin'
      );
      if (!hasAdmin) {
        parsed.unshift(DEFAULT_ADMIN_ACCOUNT);
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored accounts', e);
  }
  return [DEFAULT_ADMIN_ACCOUNT];
}

export function saveStoredAccounts(accounts: UserAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed to save stored accounts', e);
  }
}

export function authenticateUser(
  usernameInput: string,
  passwordInput: string
): UserAccount | null {
  const accounts = getStoredAccounts();
  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();

  // Find matching account (case-insensitive for username, exact for password)
  const matched = accounts.find(
    (acc) =>
      acc.username.toLowerCase() === trimmedUser.toLowerCase() &&
      acc.password === trimmedPass
  );

  return matched || null;
}

export function createStaffAccount(
  usernameInput: string,
  passwordInput: string
): { success: boolean; error?: string; account?: UserAccount } {
  const trimmedUser = usernameInput.trim();
  const trimmedPass = passwordInput.trim();

  if (!trimmedUser) {
    return { success: false, error: 'Username is required.' };
  }

  if (trimmedUser.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }

  if (!trimmedPass) {
    return { success: false, error: 'Password is required.' };
  }

  if (trimmedPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find(
    (acc) => acc.username.toLowerCase() === trimmedUser.toLowerCase()
  );

  if (existing) {
    return {
      success: false,
      error: `An account with username "${trimmedUser}" already exists.`,
    };
  }

  const newStaffAccount: UserAccount = {
    username: trimmedUser,
    password: trimmedPass,
    role: 'staff',
    createdAt: new Date().toISOString(),
  };

  const updated = [...accounts, newStaffAccount];
  saveStoredAccounts(updated);

  return { success: true, account: newStaffAccount };
}

export function deleteStaffAccount(username: string): boolean {
  if (username.toLowerCase() === 'admin') {
    return false; // Cannot delete primary administrator
  }
  const accounts = getStoredAccounts();
  const filtered = accounts.filter(
    (acc) => acc.username.toLowerCase() !== username.toLowerCase()
  );
  saveStoredAccounts(filtered);
  return true;
}
