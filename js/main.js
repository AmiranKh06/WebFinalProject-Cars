import { searchCars }                                           from './api.js';
import { getGarage, addToGarage, removeFromGarage,
         updateCarStatus, isInGarage, buildCarId,
         getProfile, saveProfile, clearProfile }                from './storage.js';
import { createCarCard, createGarageCard,
         showLoading, hideLoading,
         showError, hideError, renderProfileCard }              from './ui.js';

const page = document.body.dataset.page;

if (page === 'index')   initIndexPage();
if (page === 'garage')  initGaragePage();
if (page === 'profile') initProfilePage();

// Index page

function initIndexPage() {
  const form        = document.getElementById('search-form');
  const makeInput   = document.getElementById('input-make');
  const yearSelect  = document.getElementById('input-year');
  const grid        = document.getElementById('results-grid');
  const loading     = document.getElementById('loading');
  const errorEl     = document.getElementById('error-message');
  const searchError = document.getElementById('search-error');
  const resetBtn    = document.getElementById('reset-btn');

  if (!form) return;

  // Populate year dropdown dynamically
  populateYears(yearSelect);

  // Handle search form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    searchError.textContent = '';

    const make = makeInput.value.trim();
    if (make.length < 2) {
      searchError.textContent = 'Please enter a make (e.g. Toyota).';
      return;
    }

    const year = yearSelect.value || null;

    grid.innerHTML = '';
    hideError(errorEl);
    showLoading(loading);

    try {
      const cars = await searchCars({ make, year });

      if (cars.length === 0) {
        grid.innerHTML = `<p class="no-results">No results found for "<strong>${make}</strong>". Try a different make.</p>`;
      } else {
        // Closure: forEach handler closes over each iteration's car object
        cars.forEach(car => {
          const card = createCarCard(car);
          grid.appendChild(card);
        });
      }
    } catch (err) {
      showError(errorEl, 'Could not load results. Check your connection and try again.');
      console.error(err);
    } finally {
      hideLoading(loading);
    }
  });

  // Clear results when form is reset
  resetBtn.addEventListener('click', () => {
    grid.innerHTML       = '';
    searchError.textContent = '';
    hideError(errorEl);
  });
}

// Fills the year <select> from current year down to 1990
function populateYears(select) {
  const current = new Date().getFullYear();
  for (let y = current; y >= 1990; y--) {
    const opt   = document.createElement('option');
    opt.value   = y;
    opt.textContent = y;
    select.appendChild(opt);
  }
}

// Garage page
function initGaragePage() {}

// Profile page
function initProfilePage() {}