const API_KEY = 'hC9QqzaHwrBJ3IBDTHYyqN8Aumij6sBqiJWjcOE8';
const BASE_URL = 'https://api.api-ninjas.com/v1/cars';

// Fetches cars from API Ninjas — make is required, rest are optional filters
export async function searchCars({ make, model, year, fuel_type, limit = 9 }) {
  const params = new URLSearchParams();

  params.set('make', make.trim());
  if (model)     params.set('model',     model.trim());
  if (year)      params.set('year',      year);
  if (fuel_type) params.set('fuel_type', fuel_type);
  params.set('limit', limit);

  const response = await fetch(`${BASE_URL}?${params}`, {
    headers: { 'X-Api-Key': API_KEY }
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json(); // API Ninjas returns an array directly
}