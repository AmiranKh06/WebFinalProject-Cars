// storage.js — multi-account storage
// All accounts stored under ACCOUNTS_KEY as { [email]: { profile, garage } }
// CURRENT_USER_KEY holds the email of whoever is logged in

const ACCOUNTS_KEY     = 'cardealer_accounts';
const CURRENT_USER_KEY = 'cardealer_current_user';

// ─── Internal helpers ────────────────────────────────────────────────────────

function getAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ─── Session ─────────────────────────────────────────────────────────────────

// Returns the email of the currently logged-in user, or null
export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) || null;
}

// Logs in as the given email (must already have an account)
export function setCurrentUser(email) {
  localStorage.setItem(CURRENT_USER_KEY, email);
}

// Logs out — clears the session but keeps all account data
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Returns true if someone is logged in
export function isAuthed() {
  return !!getCurrentUser();
}

// ─── Accounts ────────────────────────────────────────────────────────────────

// Returns all saved profiles as an array (for the account switcher)
export function getAllProfiles() {
  const accounts = getAccounts();
  return Object.values(accounts).map(a => a.profile);
}

// Returns true if an account with this email already exists
export function accountExists(email) {
  return !!getAccounts()[email.toLowerCase()];
}

// ─── Profile ─────────────────────────────────────────────────────────────────

// Returns the profile of the currently logged-in user, or null
export function getProfile() {
  const email = getCurrentUser();
  if (!email) return null;
  return getAccounts()[email]?.profile || null;
}

// Saves (or updates) the profile for the current user.
// If no account exists yet, creates one.
export function saveProfile(profile) {
  const email    = profile.email.toLowerCase();
  const accounts = getAccounts();
  if (!accounts[email]) accounts[email] = { profile: {}, garage: [] };
  accounts[email].profile = { ...profile, email };
  saveAccounts(accounts);
  setCurrentUser(email);
}

// Removes the current user's account entirely
export function clearProfile() {
  const email = getCurrentUser();
  if (!email) return;
  const accounts = getAccounts();
  delete accounts[email];
  saveAccounts(accounts);
}

// Kept for compatibility
export function setAuthed() { /* no-op — setCurrentUser handles this */ }
export function clearAuth() { logout(); }

// ─── Garage (per-user) ───────────────────────────────────────────────────────

export function buildCarId(car) {
  return `${car.Model_ID}_${car.year || 'any'}`;
}

function getUserGarage(email) {
  if (!email) return [];
  try {
    return getAccounts()[email]?.garage || [];
  } catch { return []; }
}

function saveUserGarage(email, garage) {
  if (!email) return;
  const accounts = getAccounts();
  if (!accounts[email]) return;
  accounts[email].garage = garage;
  saveAccounts(accounts);
}

export function getGarage() {
  return getUserGarage(getCurrentUser());
}

export function addToGarage(car, status = 'wishlist') {
  const email   = getCurrentUser();
  const garage  = getUserGarage(email);
  const id      = buildCarId(car);
  if (garage.some(item => item.carId === id)) return false;
  garage.push({ ...car, carId: id, status, savedAt: Date.now() });
  saveUserGarage(email, garage);
  return true;
}

export function removeFromGarage(carId) {
  const email   = getCurrentUser();
  const updated = getUserGarage(email).filter(item => item.carId !== carId);
  saveUserGarage(email, updated);
}

export function updateCarStatus(carId, status) {
  const email   = getCurrentUser();
  const updated = getUserGarage(email).map(item =>
    item.carId === carId ? { ...item, status } : item
  );
  saveUserGarage(email, updated);
}

export function isInGarage(carId) {
  return getGarage().some(item => item.carId === carId);
}