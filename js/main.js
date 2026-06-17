import { searchCars }                                           from './api.js';
import { getGarage, addToGarage, removeFromGarage,
         updateCarStatus, isInGarage, buildCarId,
         getProfile, saveProfile, clearProfile,
         setAuthed, isAuthed, clearAuth }              from './storage.js';
import { createCarCard, createGarageCard,
         showLoading, hideLoading,
         showError, hideError, renderProfileCard }              from './ui.js';

const page = document.body.dataset.page;
guardPage();
updateNav();

if (page === 'index')   initIndexPage();
if (page === 'garage')  initGaragePage();
if (page === 'profile') initProfilePage();
if (page === 'detail')  initDetailPage();

// Redirects to profile page if user hasn't saved a profile yet
function guardPage() {
  if (page === 'profile') return; // always allow profile page
  if (!isAuthed()) {
    window.location.href = 'profile.html';
  }
}

// Dims nav links and blocks clicks when user isn't authed
function updateNav() {
  const authed = isAuthed();
  document.querySelectorAll('.header__nav-link:not([href="profile.html"])').forEach(link => {
    if (authed) {
      link.removeAttribute('aria-disabled');
      link.style.opacity = '';
      link.style.pointerEvents = '';
      link.style.cursor = '';
    } else {
      link.setAttribute('aria-disabled', 'true');
      link.style.opacity = '0.35';
      link.style.pointerEvents = 'none';
      link.style.cursor = 'not-allowed';
    }
  });
}

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

yearSelect.addEventListener('change', () => {
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

    if (!/^[a-zA-Z\s\-]+$/.test(make)) {
      searchError.textContent = 'Make should only contain letters (e.g. Toyota, Land Rover).';
      return;
    }

    if (!navigator.onLine) {
      searchError.textContent = 'You appear to be offline. Please check your connection.';
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

  // Timeout: abort if API takes longer than 8 seconds
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 8000);

  try {
    let cars = await searchCars({ make, year });
    clearTimeout(timeout);

    // Client-side model filter since NHTSA doesn't support it as a param
    if (model && model.length >= 2) {
      cars = cars.filter(car =>
        car.Model_Name.toLowerCase().includes(model.toLowerCase())
      );
    }

    if (cars.length === 0 && model) {
      grid.innerHTML = `<p class="no-results">No "<strong>${model}</strong>" models found under "<strong>${make}</strong>". Try a different model name.</p>`;
    } else if (cars.length === 0) {
      grid.innerHTML = `<p class="no-results">No results found for "<strong>${make}</strong>". Check the spelling or try a different make.</p>`;
    } else {
      cars.forEach(car => {
        const card = createCarCard(car);
        grid.appendChild(card);
      });
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      showError(errorEl, 'Request timed out — the server took too long to respond. Try again.');
    } else if (!navigator.onLine) {
      showError(errorEl, 'You are offline. Please check your internet connection.');
    } else {
      showError(errorEl, 'Could not load results. Check your connection and try again.');
    }
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
      const emptyTitle    = emptyState.querySelector('.empty-state__title');
      const emptySubtitle = emptyState.querySelector('.empty-state__subtitle');
      if (garage.length === 0) {
        emptyTitle.textContent  = 'Your garage is empty';
        emptySubtitle.innerHTML = 'Search for cars on the <a class="empty-state__link" href="index.html">Discover</a> page and save them here.';
      } else {
        emptyTitle.textContent    = `No ${currentFilter === 'test_driven' ? 'test driven' : currentFilter} cars yet`;
        emptySubtitle.textContent = 'Change the status of your saved cars using the dropdown on each card.';
      }
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
  const make = (params.get('make') || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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

    // Find Prices button — Google search for car price
    const pricesLink  = document.getElementById('detail-prices-link');
    const pricesQuery = encodeURIComponent(`${make} ${model} ${year || ''} price`.trim());
    pricesLink.href   = `https://www.google.com/search?q=${pricesQuery}`;

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
function initProfilePage() {
  const form        = document.getElementById('profile-form');
  const feedback    = document.getElementById('form-feedback');
  const preview     = document.getElementById('profile-preview-content');
  const bioInput    = document.getElementById('bio');
  const bioCount    = document.getElementById('bio-count');
  const clearBtn    = document.getElementById('clear-btn');
  const brandSelect = document.getElementById('brands-select');
  const addBrandBtn = document.getElementById('add-brand-btn');
  const brandsHidden= document.getElementById('brands-hidden');
  const brandsTags  = document.getElementById('brands-tags');

  if (!form) return;

  let selectedBrands = [];

  // Load saved profile into form on page visit
  const saved = getProfile();
  if (saved) {
    populateForm(form, saved);
    if (saved.brands) {
      saved.brands.forEach(b => addBrand(b));
    }
    preview.innerHTML = renderProfileCard(saved);
  }

  // Live bio character counter
  bioInput.addEventListener('input', () => {
    bioCount.textContent = bioInput.value.length;
  });

  // Add brand tag when Add button is clicked
  addBrandBtn.addEventListener('click', () => {
    const val = brandSelect.value;
    if (!val || selectedBrands.includes(val)) return;
    addBrand(val);
    brandSelect.value = '';
  });

  // Add a brand to the tags list
  function addBrand(brand) {
    if (selectedBrands.includes(brand)) return;
    selectedBrands.push(brand);
    updateBrandsHidden();

    const tag = document.createElement('span');
    tag.className = 'brand-tag';
    tag.innerHTML = `${brand} <button class="brand-tag__remove" type="button" aria-label="Remove ${brand}">×</button>`;
    tag.querySelector('.brand-tag__remove').addEventListener('click', () => {
      selectedBrands = selectedBrands.filter(b => b !== brand);
      updateBrandsHidden();
      tag.remove();
    });
    brandsTags.appendChild(tag);
  }

  // Sync hidden input with selectedBrands array
  function updateBrandsHidden() {
    brandsHidden.value = selectedBrands.join(',');
  }

  // Form submit — validate, save, update preview
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.className   = 'form-feedback';
    feedback.textContent = '';

    const displayName = form.displayName.value.trim();
    const email       = form.email.value.trim();
    const birthYear   = form.birthYear.value;

    if (displayName.length < 2) {
      showFormFeedback(feedback, 'Display name must be at least 2 characters.', 'error');
      form.displayName.classList.add('is-invalid');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormFeedback(feedback, 'Please enter a valid email address.', 'error');
      return;
    }

    if (birthYear && (birthYear < 1940 || birthYear > 2010)) {
      showFormFeedback(feedback, 'Birth year must be between 1940 and 2010.', 'error');
      return;
    }

    form.displayName.classList.remove('is-invalid');

    const drivingStyle = form.querySelector('input[name="drivingStyle"]:checked')?.value || '';

    const profile = {
      displayName,
      email,
      birthYear: birthYear || '',
      preferredType: form.preferredType.value,
      brands: selectedBrands,
      drivingStyle,
      bio: form.bio.value.trim()
    };

    saveProfile(profile);
    setAuthed();
    updateNav();
    showFormFeedback(feedback, '✓ Profile saved! Redirecting…', 'success');
    setTimeout(() => {
      window.location.replace('index.html');
    }, 800);
  });

  // Clear button — wipe form and localStorage
  clearBtn.addEventListener('click', () => {
    form.reset();
    bioCount.textContent  = '0';
    feedback.className    = 'form-feedback';
    feedback.textContent  = '';
    selectedBrands        = [];
    brandsTags.innerHTML  = '';
    brandsHidden.value    = '';
    clearProfile();
    clearAuth();
    preview.innerHTML = '<p class="profile-preview__empty">No profile saved yet.</p>';
    updateNav();
  });
}

// Populates the form fields from a saved profile object (brands handled separately)
function populateForm(form, profile) {
  form.displayName.value   = profile.displayName   || '';
  form.email.value         = profile.email         || '';
  form.birthYear.value     = profile.birthYear     || '';
  form.preferredType.value = profile.preferredType || '';
  form.bio.value           = profile.bio           || '';

  document.getElementById('bio-count').textContent = (profile.bio || '').length;

  if (profile.drivingStyle) {
    const radio = form.querySelector(`input[name="drivingStyle"][value="${profile.drivingStyle}"]`);
    if (radio) radio.checked = true;
  }
}

// Shows success or error feedback under the form
function showFormFeedback(el, msg, type) {
  el.textContent = msg;
  el.className   = `form-feedback form-feedback--${type}`;
}

// Theme toggle

(function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('cardealer_theme');

  if (saved === 'light') {
    document.body.classList.add('light');
    if (btn) btn.textContent = '🌙';
  }

  if (!btn) return;

  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    btn.textContent = isLight ? '🌙' : '☀️';
    localStorage.setItem('cardealer_theme', isLight ? 'light' : 'dark');
  });
})();