import { addToGarage, removeFromGarage, updateCarStatus, isInGarage, buildCarId } from './storage.js';

// Search result card

// Creates a car card for the search results grid
export function createCarCard(car) {
  const carId    = buildCarId(car);
  const inGarage = isInGarage(carId);

  const card = document.createElement('article');
  card.className = 'car-card';
  card.dataset.carId = carId;

  card.innerHTML = `
    <div class="car-card__stripe"></div>
    <div class="car-card__body">
      <div class="car-card__header">
        <div>
          <p class="car-card__make">${escapeHtml(car.Make_Name)}</p>
          <h2 class="car-card__title">${escapeHtml(car.Model_Name)}</h2>
        </div>
        ${car.year ? `<span class="car-card__year">${car.year}</span>` : ''}
      </div>
      ${car.VehicleTypeName
        ? `<span class="type-badge">${escapeHtml(car.VehicleTypeName)}</span>`
        : ''}
      <div class="car-card__footer">
        <button class="btn ${inGarage ? 'btn--secondary' : 'btn--primary'} save-btn">
          ${inGarage ? '✓ Saved' : '+ Garage'}
        </button>
      </div>
    </div>
  `;

  // Navigate to detail page when card body is clicked (not the save button)
  card.addEventListener('click', (e) => {
    if (e.target.closest('.save-btn')) return;
    const params = new URLSearchParams({
      make:  car.Make_Name,
      model: car.Model_Name,
    });
    window.location.href = `detail.html?${params}`;
  });

  // Closure: each card's save button closes over its specific car object
  const saveBtn = card.querySelector('.save-btn');
  saveBtn.addEventListener('click', () => handleSaveToggle(car, carId, saveBtn));

  return card;
}

// Garage card

// Creates a car card for the garage page with status controls
export function createGarageCard(car, onRemove = () => {}) {
  const card = document.createElement('article');
  card.className = 'car-card';
  card.dataset.carId = car.carId;

  // Navigate to detail page when card is clicked
  card.addEventListener('click', (e) => {
    if (e.target.closest('.remove-btn') || e.target.closest('.status-select')) return;
    const params = new URLSearchParams({
      make:  car.Make_Name,
      model: car.Model_Name,
    });
    window.location.href = `detail.html?${params}`;
  });

  card.innerHTML = `
    <div class="car-card__stripe"></div>
    <div class="car-card__body">
      <div class="car-card__header">
        <div>
          <p class="car-card__make">${escapeHtml(car.Make_Name)}</p>
          <h2 class="car-card__title">${escapeHtml(car.Model_Name)}</h2>
        </div>
        ${car.year ? `<span class="car-card__year">${car.year}</span>` : ''}
      </div>
      <span class="status-badge status-badge--${car.status}">${statusLabel(car.status)}</span>
      <div class="car-card__footer">
        <select class="status-select" aria-label="Change status">
          <option value="wishlist"    ${car.status === 'wishlist'    ? 'selected' : ''}>Wishlist</option>
          <option value="owned"       ${car.status === 'owned'       ? 'selected' : ''}>Owned</option>
          <option value="test_driven" ${car.status === 'test_driven' ? 'selected' : ''}>Test Driven</option>
        </select>
        <button class="btn btn--danger remove-btn">Remove</button>
      </div>
    </div>
  `;

  // Closure: each card's handlers close over its specific car.carId
  const statusSelect = card.querySelector('.status-select');
  statusSelect.addEventListener('change', () => {
    updateCarStatus(car.carId, statusSelect.value);
    const badge = card.querySelector('.status-badge');
    badge.className   = `status-badge status-badge--${statusSelect.value}`;
    badge.textContent = statusLabel(statusSelect.value);
  });

  const removeBtn = card.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    removeFromGarage(car.carId);
    card.remove();
    onRemove();
  });

  return card;
}

// Loading & error helpers

export function showLoading(el) { el.removeAttribute('hidden'); }
export function hideLoading(el) { el.setAttribute('hidden', ''); }

export function showError(el, msg) {
  el.removeAttribute('hidden');
  el.querySelector('.error-message__text').textContent = msg;
}

export function hideError(el) { el.setAttribute('hidden', ''); }

// Profile preview

// Builds the HTML for the saved profile preview panel
export function renderProfileCard(profile) {
  const brandsHtml = profile.brands?.length
    ? `<div class="profile-card__brands">
        ${profile.brands.map(b => `<span class="brand-tag">${escapeHtml(b)}</span>`).join('')}
       </div>`
    : '';

  return `
    <div class="profile-card">
      <p class="profile-card__name">${escapeHtml(profile.displayName)}</p>
      ${profile.email        ? `<div class="profile-card__row"><span class="profile-card__row-label">Email</span><span>${escapeHtml(profile.email)}</span></div>` : ''}
      ${profile.preferredType? `<div class="profile-card__row"><span class="profile-card__row-label">Prefers</span><span>${escapeHtml(profile.preferredType)}</span></div>` : ''}
      ${profile.drivingStyle ? `<div class="profile-card__row"><span class="profile-card__row-label">Style</span><span>${escapeHtml(profile.drivingStyle)}</span></div>` : ''}
      ${brandsHtml}
      ${profile.bio ? `<p class="profile-card__bio">${escapeHtml(profile.bio)}</p>` : ''}
    </div>
  `;
}

// Internal helpers

// Toggles a car between saved and unsaved in the garage
function handleSaveToggle(car, carId, btn) {
  if (isInGarage(carId)) {
    removeFromGarage(carId);
    btn.textContent = '+ Garage';
    btn.className   = 'btn btn--primary save-btn';
  } else {
    addToGarage(car);
    btn.textContent = '✓ Saved';
    btn.className   = 'btn btn--secondary save-btn';
  }
}

// Escapes HTML to prevent XSS when inserting user/API data
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Maps a status key to a readable label
function statusLabel(status) {
  return { wishlist: 'Wishlist', owned: 'Owned', test_driven: 'Test Driven' }[status] ?? status;
}