/**
 * Theme utilities — read/write from localStorage so the theme persists
 * across page navigations (client-side routing and full reloads).
 */

const STORAGE_KEY = 'sanjeevani-theme';
const DEFAULT_THEME = 'dark';

/**
 * Reads the saved theme. Falls back to DEFAULT_THEME.
 * Safe to call on the server (returns default).
 */
export function getStoredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Saves theme to localStorage AND applies it to <html data-theme>.
 */
export function applyTheme(theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* noop */ }
  document.documentElement.setAttribute('data-theme', theme);
}
