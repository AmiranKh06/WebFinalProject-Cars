const GARAGE_KEY  = 'cardealer_garage';
const PROFILE_KEY = 'cardealer_profile';

// Helpers

// Builds a unique ID using NHTSA's Model_ID and the searched year
export function buildCarId(car) {
  return `${car.Model_ID}_${car.year || 'any'}`;
}

// Garage

// Returns the full garage array from localStorage
export function getGarage() {
  try {
    const raw = localStorage.getItem(GARAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Saves the garage array back to localStorage
function saveGarage(garage) {
  localStorage.setItem(GARAGE_KEY, JSON.stringify(garage));
}

// Adds a car to the garage, returns false if it already exists
export function addToGarage(car, status = 'wishlist') {
  const garage = getGarage();
  const id = buildCarId(car);
  const exists = garage.some(item => item.carId === id);
  if (exists) return false;
  garage.push({ ...car, carId: id, status, savedAt: Date.now() });
  saveGarage(garage);
  return true;
}

// Removes a car from the garage by its carId
export function removeFromGarage(carId) {
  const updated = getGarage().filter(item => item.carId !== carId);
  saveGarage(updated);
}

// Updates the status of a saved car (wishlist / owned / test_driven)
export function updateCarStatus(carId, status) {
  const updated = getGarage().map(item =>
    item.carId === carId ? { ...item, status } : item
  );
  saveGarage(updated);
}

// Returns true if a car with the given ID is already saved
export function isInGarage(carId) {
  return getGarage().some(item => item.carId === carId);
}

// Profile

// Returns the saved driver profile or null if none exists
export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Saves the driver profile object to localStorage
export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// Removes the saved profile from localStorage
export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}