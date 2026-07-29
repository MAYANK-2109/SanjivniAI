// Role-based authentication helper for Sanjeevani

// Removed MOCK_PROFILES
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('sanjeevani_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(profile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('sanjeevani_user', JSON.stringify(profile));
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('sanjeevani_user');
}
