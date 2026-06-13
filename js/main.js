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

  // Live search on every keystroke (debounced)
const debouncedSearch = debounce(async () => {
  const make = makeInput.value.trim();
  if (make.length < 2) return;
  await runSearch(make, yearSelect.value || null, grid, loading, errorEl);
}, 600);

makeInput.addEventListener('input', () => {
  searchError.textContent = '';
  hideError(errorEl);
  debouncedSearch();
});

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

// Runs the API search and renders results into the grid
async function runSearch(make, year, grid, loading, errorEl) {
  grid.innerHTML = '';
  hideError(errorEl);
  showLoading(loading);
  try {
    const cars = await searchCars({ make, year });
    if (cars.length === 0) {
      grid.innerHTML = `<p class="no-results">No results found for "<strong>${make}</strong>". Try a different make.</p>`;
    } else {
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
}

// Closure: delays execution until the user stops typing
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Garage page
function initGaragePage() {
  function initGaragePage() {
  const grid       = document.getElementById('garage-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl    = document.getElementById('garage-count');
  const filterTabs = document.getElementById('filter-tabs');

  if (!grid) return;

  let currentFilter = 'all';

  renderGarage();

  // Filter tab clicks
  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.remove('filter-tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('filter-tab--active');
    tab.setAttribute('aria-selected', 'true');
    currentFilter = tab.dataset.filter;
    renderGarage();
  });

  function renderGarage() {
    const garage = getGarage();
    const filtered = currentFilter === 'all'
      ? garage
      : garage.filter(car => car.status === currentFilter);

    grid.innerHTML = '';
    countEl.textContent = `${garage.length} car${garage.length !== 1 ? 's' : ''} saved`;

    if (filtered.length === 0) {
      emptyState.removeAttribute('hidden');
    } else {
      emptyState.setAttribute('hidden', '');
      filtered.forEach(car => {
        const card = createGarageCard(car, renderGarage);
        grid.appendChild(card);
      });
    }
  }
}
}

// Profile page
function initProfilePage() {}