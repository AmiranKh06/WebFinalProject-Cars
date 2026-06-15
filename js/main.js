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
if (page === 'detail')  initDetailPage();

// Index page

function initIndexPage() {
  const form        = document.getElementById('search-form');
  const makeInput   = document.getElementById('input-make');
  const modelInput  = document.getElementById('input-model');
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
  await runSearch(make, yearSelect.value || null, modelInput.value.trim(), grid, loading, errorEl);
}, 600);

makeInput.addEventListener('input', () => {
  searchError.textContent = '';
  hideError(errorEl);
  debouncedSearch();
});

modelInput.addEventListener('input', () => {
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

    await runSearch(make, yearSelect.value || null, modelInput.value.trim(), grid, loading, errorEl);
  });

  // Clear results when form is reset
  resetBtn.addEventListener('click', () => {
    grid.innerHTML          = '';
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

// Runs the API search, filters by model client-side, and renders results
async function runSearch(make, year, model, grid, loading, errorEl) {
  grid.innerHTML = '';
  hideError(errorEl);
  showLoading(loading);
  try {
    let cars = await searchCars({ make, year });

    // Client-side model filter since NHTSA doesn't support it as a param
    if (model && model.length >= 2) {
      cars = cars.filter(car =>
        car.Model_Name.toLowerCase().includes(model.toLowerCase())
      );
    }

    if (cars.length === 0) {
      grid.innerHTML = `<p class="no-results">No results found for "<strong>${make}</strong>". Try a different make or model.</p>`;
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
  const grid       = document.getElementById('garage-grid');
  const emptyState = document.getElementById('empty-state');
  const countEl    = document.getElementById('garage-count');
  const filterTabs = document.getElementById('filter-tabs');

  if (!grid) return;

  let currentFilter = 'all';

  renderGarage();

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

    // Update stats bar
    document.getElementById('stat-total').textContent       = garage.length;
    document.getElementById('stat-wishlist').textContent    = garage.filter(c => c.status === 'wishlist').length;
    document.getElementById('stat-owned').textContent       = garage.filter(c => c.status === 'owned').length;
    document.getElementById('stat-test-driven').textContent = garage.filter(c => c.status === 'test_driven').length;

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

// Detail page
async function initDetailPage() {
  const params      = new URLSearchParams(window.location.search);
  const make        = params.get('make')  || '';
  const model       = params.get('model') || '';
  const year        = params.get('year')  || '';

  const loading     = document.getElementById('loading');
  const errorEl     = document.getElementById('error-message');
  const detailCard  = document.getElementById('detail-card');
  const saveBtn     = document.getElementById('detail-save-btn');

  if (!make || !model) {
    showError(errorEl, 'No car specified. Go back and click a car card.');
    hideLoading(loading);
    return;
  }

  // Build a fake car object so it can be saved to the garage
  const car = { Make_Name: make, Model_Name: model, year: year || null, Model_ID: `${make}_${model}` };

  try {
    // Fetch summary from Wikipedia
    const query    = encodeURIComponent(`${make} ${model}`);
    const wikiUrl  = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
    const response = await fetch(wikiUrl);
    const data     = response.ok ? await response.json() : null;

    // Populate card
    document.getElementById('detail-make').textContent        = make;
    document.getElementById('detail-title').textContent       = model;
    document.getElementById('detail-year').textContent        = year ? `Year: ${year}` : '';
    document.getElementById('detail-description').textContent = data?.extract || 'No description available for this model.';

    // Show image if Wikipedia returned one
    const img         = document.getElementById('detail-image');
    const placeholder = document.getElementById('detail-placeholder');
    if (data?.thumbnail?.source) {
      img.src = data.thumbnail.source;
      img.alt = `${make} ${model}`;
      img.removeAttribute('hidden');
      placeholder.setAttribute('hidden', '');
    }

    // Wikipedia link
    const wikiLink = document.getElementById('detail-wiki-link');
    if (data?.content_urls?.desktop?.page) {
      wikiLink.href = data.content_urls.desktop.page;
    } else {
      wikiLink.setAttribute('hidden', '');
    }

    // Save to garage button
    const { isInGarage, addToGarage, removeFromGarage, buildCarId } = await import('./storage.js');
    const carId = buildCarId(car);
    updateSaveBtn(saveBtn, isInGarage(carId));

    saveBtn.addEventListener('click', () => {
      if (isInGarage(carId)) {
        removeFromGarage(carId);
      } else {
        addToGarage(car);
      }
      updateSaveBtn(saveBtn, isInGarage(carId));
    });

    detailCard.removeAttribute('hidden');
  } catch (err) {
    showError(errorEl, 'Could not load car details. Check your connection and try again.');
    console.error(err);
  } finally {
    hideLoading(loading);
  }
}

// Updates the save button text based on garage state
function updateSaveBtn(btn, inGarage) {
  btn.textContent = inGarage ? '✓ Saved to Garage' : '+ Add to Garage';
  btn.className   = inGarage ? 'btn btn--secondary' : 'btn btn--primary';
}

// Profile page
function initProfilePage() {}