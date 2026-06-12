const BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Search models by make. If year is provided, results also include vehicle type.
export async function searchCars({ make, year }) {
  let url;

  if (year) {
    url = `${BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(make.trim())}/modelyear/${year}?format=json`;
  } else {
    url = `${BASE_URL}/GetModelsForMake/${encodeURIComponent(make.trim())}?format=json`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.Results ?? []).map(car => ({ ...car, year: year || null }));
}