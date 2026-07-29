/**
 * lib/apiClient.js
 * Utility to construct API URLs pointing to the Express backend.
 * 
 * In development: uses NEXT_PUBLIC_API_URL (http://localhost:5000/api)
 * In production: set NEXT_PUBLIC_API_URL to your deployed backend URL.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Build a full URL to the backend API.
 * @param {string} path - e.g. '/triage', '/auth/login', '/appointments?role=doctor&targetId=123'
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  // Prevent duplicate /api/api in the URL
  let cleanPath = path;
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.slice(4);
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${base}${cleanPath}`;
}

/**
 * Convenience wrapper around fetch that always hits the Express backend.
 */
export async function apiFetch(path, options = {}) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}
