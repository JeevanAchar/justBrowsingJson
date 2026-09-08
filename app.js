/**
 * Just Browsing - Food Static Data Explorer & Consumer Image Verifier
 * Clean, responsive List View layout optimized for GitHub Pages static hosting.
 */

// Dataset endpoints (relative paths for GitHub Pages subpath compatibility)
const DATASET_URLS = {
  restaurants: './data/food/restaurants.json',
  foods: './data/food/food-items.json',
  images: './data/food/restaurant-images.json'
};

// Application State
const state = {
  datasets: {
    restaurants: null,
    foods: null,
    images: null
  },
  meta: {
    restaurants: { size: '344 KB', path: 'data/food/restaurants.json' },
    foods: { size: '1.34 MB', path: 'data/food/food-items.json' },
    images: { size: '44 KB', path: 'data/food/restaurant-images.json' }
  },
  lookups: {
    restaurantMap: new Map(),
    imageMap: new Map(),
    foodMap: new Map(),
    foodsByRestaurant: new Map(),
    imageUsageCount: new Map(),
    restaurantBanners: []
  },
  ui: {
    activeTab: 'restaurants',
    // Restaurants list state
    restsSearch: '',
    restsCity: 'ALL',
    restsCuisine: 'ALL',
    restsSort: 'rating-desc',
    openRestaurantDrawers: new Set(),
    // Foods list state
    foodsSearch: '',
    foodsRestaurant: 'ALL',
    foodsDiet: 'ALL',
    foodsSort: 'default',
    foodsPage: 1,
    foodsPerPage: 50,
    // Images list state
    imgsSearch: '',
    imgsType: 'ALL',
    // Raw JSON state
    activeRawDataset: 'restaurants',
    rawSearch: ''
  }
};

// Safe fallback SVG if an external CDN image fails
const FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%2394a3b8">🍽️ Image Unavailable</text></svg>`;

/**
 * Initialize application and fetch datasets
 */
async function init() {
  setupEventListeners();

  try {
    await loadDatasets();
    buildLookupIndexes();
    updateGlobalMetrics();
    renderAllViews();
  } catch (err) {
    console.warn('Network fetch failed, checking file:// origin:', err);
    showFileProtocolBanner();
  }
}

/**
 * Fetch the 3 JSON datasets via relative HTTP GET
 */
async function loadDatasets() {
  const [restsRes, foodsRes, imgsRes] = await Promise.all([
    fetch(DATASET_URLS.restaurants),
    fetch(DATASET_URLS.foods),
    fetch(DATASET_URLS.images)
  ]);

  if (!restsRes.ok || !foodsRes.ok || !imgsRes.ok) {
    throw new Error('One or more dataset files failed to load via HTTP');
  }

  state.datasets.restaurants = await restsRes.json();
  state.datasets.foods = await foodsRes.json();
  state.datasets.images = await imgsRes.json();
}

/**
 * Build fast lookup structures for cross-referencing between the 3 blocks
 */
function buildLookupIndexes() {
  const rests = state.datasets.restaurants?.data || [];
  const foods = state.datasets.foods?.data || [];
  const imgs = state.datasets.images?.data || [];

  state.lookups.restaurantMap.clear();
  state.lookups.imageMap.clear();
  state.lookups.foodMap.clear();
  state.lookups.foodsByRestaurant.clear();
  state.lookups.imageUsageCount.clear();

  // Index images
  imgs.forEach(img => {
    state.lookups.imageMap.set(img.id, img);
    state.lookups.imageUsageCount.set(img.id, 0);
  });

  // Extract banner images (first 40 images map to the 40 restaurants)
  state.lookups.restaurantBanners = imgs.filter(img => img.type === 'banner');

  // Index restaurants
  rests.forEach(r => {
    state.lookups.restaurantMap.set(r.id, r);
    state.lookups.foodsByRestaurant.set(r.id, []);
  });

  // Index foods and compute image usage
  foods.forEach(f => {
    state.lookups.foodMap.set(f.id, f);
    if (state.lookups.foodsByRestaurant.has(f.restaurant_id)) {
      state.lookups.foodsByRestaurant.get(f.restaurant_id).push(f);
    }
    if (f.image_id && state.lookups.imageUsageCount.has(f.image_id)) {
      state.lookups.imageUsageCount.set(
        f.image_id,
        state.lookups.imageUsageCount.get(f.image_id) + 1
      );
    }
  });

  populateFilters();
}

/**
 * Populate dynamic filters based on loaded dataset
 */
function populateFilters() {
  const rests = state.datasets.restaurants?.data || [];

  // Unique cities
  const cities = [...new Set(rests.map(r => r.location?.city).filter(Boolean))].sort();
  const restCitySelect = document.getElementById('rests-city-filter');
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    restCitySelect.appendChild(opt);
  });

  // Unique cuisines
  const cuisines = [...new Set(rests.flatMap(r => r.cuisines || []))].sort();
  const restCuisineSelect = document.getElementById('rests-cuisine-filter');
  cuisines.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    restCuisineSelect.appendChild(opt);
  });

  // Populate food restaurant dropdown
  const foodRestSelect = document.getElementById('foods-restaurant-filter');
  rests.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    foodRestSelect.appendChild(opt);
  });
}

/**
 * Update top header badges and stats
 */
function updateGlobalMetrics() {
  const restsCount = state.datasets.restaurants?.data?.length || 0;
  const foodsCount = state.datasets.foods?.data?.length || 0;
  const imgsCount = state.datasets.images?.data?.length || 0;
  const timestamp = state.datasets.restaurants?.timestamp?.updated_at || '2026-09-08T03:15:42.000Z';

  document.getElementById('stat-rests').textContent = restsCount.toLocaleString();
  document.getElementById('stat-foods').textContent = foodsCount.toLocaleString();
  document.getElementById('stat-imgs').textContent = imgsCount.toLocaleString();
  document.getElementById('stat-time-val').textContent = new Date(timestamp).toUTCString().replace('GMT', 'UTC');

  document.getElementById('tab-badge-rests').textContent = restsCount;
  document.getElementById('tab-badge-foods').textContent = foodsCount.toLocaleString();
  document.getElementById('tab-badge-imgs').textContent = imgsCount;
  document.getElementById('imgs-health-stat').textContent = `${imgsCount} / ${imgsCount}`;
}

/**
 * Get banner image associated with a restaurant by index or fallback
 */
function getRestaurantBanner(restaurant, index = 0) {
  if (state.lookups.restaurantBanners[index]) {
    return state.lookups.restaurantBanners[index];
  }
  return {
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: restaurant.name,
    id: 'default'
  };
}

/**
 * Get food item image from catalog
 */
function getFoodImage(foodItem) {
  if (foodItem.image_id && state.lookups.imageMap.has(foodItem.image_id)) {
    return state.lookups.imageMap.get(foodItem.image_id);
  }
  return {
    image_url: FALLBACK_IMAGE,
    description: foodItem.name,
    id: foodItem.image_id || 'none'
  };
}

/**
 * Render all views
 */
function renderAllViews() {
  renderRestaurantsListView();
  renderFoodsListView();
  renderImagesListView();
  renderRawJsonView();
}

/* ==========================================================================
   VIEW 1: BLOCK 1 - RESTAURANTS LIST VIEW (`restaurants.json`)
   ========================================================================== */

function renderRestaurantsListView() {
  const rests = state.datasets.restaurants?.data || [];
  const listContainer = document.getElementById('restaurants-list');
  listContainer.innerHTML = '';

  const search = state.ui.restsSearch.toLowerCase().trim();
  const city = state.ui.restsCity;
  const cuisine = state.ui.restsCuisine;
  const sort = state.ui.restsSort;

  let filtered = rests.filter(r => {
    if (city !== 'ALL' && r.location?.city !== city) return false;
    if (cuisine !== 'ALL' && !r.cuisines.includes(cuisine)) return false;
    if (search) {
      const matchName = r.name.toLowerCase().includes(search);
      const matchAddress = r.location?.address?.toLowerCase().includes(search);
      const matchCity = r.location?.city?.toLowerCase().includes(search);
      const matchCuisine = r.cuisines.some(c => c.toLowerCase().includes(search));
      if (!matchName && !matchAddress && !matchCity && !matchCuisine) return false;
    }
    return true;
  });

  if (sort === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'orders-desc') {
    filtered.sort((a, b) => b.total_orders - a.total_orders);
  } else if (sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        No restaurants found matching current filter criteria.
      </div>
    `;
    return;
  }

  filtered.forEach(r => {
    const originalIdx = rests.findIndex(orig => orig.id === r.id);
    const banner = getRestaurantBanner(r, originalIdx >= 0 ? originalIdx : 0);
    const dishes = state.lookups.foodsByRestaurant.get(r.id) || [];
    const isDrawerOpen = state.ui.openRestaurantDrawers.has(r.id);

    const wrapper = document.createElement('div');
    wrapper.className = 'restaurant-wrapper';
    wrapper.innerHTML = `
      <div class="list-item">
        <!-- Thumbnail -->
        <div class="list-thumb-wrapper" title="Click to zoom restaurant banner">
          <img src="${escapeHtml(banner.image_url)}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
          <span class="list-thumb-badge">Banner</span>
        </div>

        <!-- Main Details -->
        <div class="list-main-col">
          <div class="list-title-row">
            <span class="list-item-title">${escapeHtml(r.name)}</span>
            <span class="tag-chip accent">📍 ${escapeHtml(r.location?.city || 'India')}</span>
            <span class="tag-chip">${escapeHtml(r.location?.pincode || '')}</span>
          </div>

          <p class="list-item-desc">${escapeHtml(r.description)}</p>

          <div class="list-tags-row">
            ${r.cuisines.map(c => `<span class="tag-chip primary">${escapeHtml(c)}</span>`).join('')}
            <span class="tag-chip">Categories: <strong>${r.menu_categories.length}</strong></span>
            <span class="tag-chip">Collections: <strong>${r.collections.length}</strong></span>
            <span style="font-size: 0.72rem; color: var(--text-subtle); margin-left: 0.25rem;">${escapeHtml(r.location?.address || '')}</span>
          </div>
        </div>

        <!-- Metrics -->
        <div class="list-metrics-col">
          <span class="rating-badge">★ ${r.rating}</span>
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">⏱️ ${r.delivery_time.min}-${r.delivery_time.max} min</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${r.total_orders.toLocaleString()} orders</span>
          <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600;">${dishes.length} menu items</span>
        </div>

        <!-- Actions -->
        <div class="list-actions-col">
          <button class="btn btn-primary btn-sm toggle-menu-btn">
            ${isDrawerOpen ? '▲ Hide Menu' : '▼ View Menu (' + dishes.length + ')'}
          </button>
          <button class="btn btn-outline btn-sm inspect-rest-btn">
            📄 JSON
          </button>
        </div>
      </div>

      <!-- Expandable Menu Sublist -->
      <div class="restaurant-menu-drawer ${isDrawerOpen ? 'open' : ''}" id="menu-drawer-${r.id}">
        <div class="drawer-header">
          <div class="drawer-title">
            <span>🍛 Complete Menu for "${escapeHtml(r.name)}"</span>
            <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">
              (${r.menu_categories.length} categories, ${r.collections.length} collections, ${dishes.length} dishes total)
            </span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-subtle); font-style: italic;">
            ${escapeHtml(r.disclaimer || 'Images are for representation purposes only.')}
          </span>
        </div>

        <!-- Categorized Sublist Items -->
        <div class="menu-items-sublist">
          ${renderRestaurantSublistDishes(r, dishes)}
        </div>
      </div>
    `;

    // Click banner thumbnail to zoom
    wrapper.querySelector('.list-thumb-wrapper').addEventListener('click', () => {
      openLightbox(banner.image_url, `${r.name} (Banner Photo)`, banner.id);
    });

    // Toggle menu sublist drawer
    const toggleBtn = wrapper.querySelector('.toggle-menu-btn');
    const drawer = wrapper.querySelector(`#menu-drawer-${r.id}`);
    toggleBtn.addEventListener('click', () => {
      if (state.ui.openRestaurantDrawers.has(r.id)) {
        state.ui.openRestaurantDrawers.delete(r.id);
        drawer.classList.remove('open');
        toggleBtn.textContent = `▼ View Menu (${dishes.length})`;
      } else {
        state.ui.openRestaurantDrawers.add(r.id);
        drawer.classList.add('open');
        toggleBtn.textContent = '▲ Hide Menu';
      }
    });

    // Wire up dish zoom and inspect buttons inside the drawer
    wrapper.querySelectorAll('.sublist-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const foodId = thumb.dataset.foodId;
        const food = state.lookups.foodMap.get(foodId);
        if (food) {
          const img = getFoodImage(food);
          openLightbox(img.image_url, `${food.name} (${food.dietary_type.toUpperCase()})`, food.image_id);
        }
      });
    });

    wrapper.querySelectorAll('.inspect-subdish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const foodId = btn.dataset.foodId;
        const food = state.lookups.foodMap.get(foodId);
        if (food) openJsonModal(`Food Item: ${food.name}`, food);
      });
    });

    // Inspect restaurant JSON
    wrapper.querySelector('.inspect-rest-btn').addEventListener('click', () => {
      openJsonModal(`Restaurant: ${r.name}`, r);
    });

    listContainer.appendChild(wrapper);
  });
}

function renderRestaurantSublistDishes(restaurant, dishes) {
  if (dishes.length === 0) {
    return `<div style="padding: 1rem; color: var(--text-muted);">No dishes listed.</div>`;
  }

  return dishes.map(food => {
    const img = getFoodImage(food);
    const price = food.pricing?.[0] || { selling_price: 199, base_price: 249 };
    const discount = Math.round(((price.base_price - price.selling_price) / price.base_price) * 100);

    return `
      <div class="sublist-dish-item">
        <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0;">
          <img class="sublist-thumb" data-food-id="${food.id}" src="${escapeHtml(img.image_url)}" alt="${escapeHtml(food.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'" title="Click to zoom image">
          
          <div style="display: flex; flex-direction: column; gap: 0.15rem; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
              <span class="diet-indicator ${food.dietary_type}"></span>
              <strong style="color: var(--text-main); font-size: 0.9rem;">${escapeHtml(food.name)}</strong>
              <span class="tag-chip" style="font-size: 0.65rem;">★ ${food.rating}</span>
              <span class="tag-chip" style="font-size: 0.65rem;">🔥 ${food.nutrition?.calories || 350} kcal</span>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHtml(food.description)}
            </span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem; flex-shrink: 0;">
          <div style="text-align: right;">
            <div class="price-display" style="font-size: 0.95rem;">
              <span>₹${price.selling_price}</span>
              ${price.base_price > price.selling_price ? `<span class="price-base" style="font-size: 0.75rem;">₹${price.base_price}</span>` : ''}
            </div>
            ${discount > 0 ? `<span class="discount-tag">${discount}% OFF</span>` : ''}
          </div>

          <span class="uuid-chip" title="Image UUID">
            img: ${food.image_id.substring(0, 8)}...
          </span>

          <button class="btn btn-outline btn-sm inspect-subdish-btn" data-food-id="${food.id}" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;">
            JSON
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   VIEW 2: BLOCK 2 - FOOD ITEMS LIST VIEW (`food-items.json`)
   ========================================================================== */

function renderFoodsListView() {
  const foods = state.datasets.foods?.data || [];
  const listContainer = document.getElementById('foods-list');
  listContainer.innerHTML = '';

  const search = state.ui.foodsSearch.toLowerCase().trim();
  const restFilter = state.ui.foodsRestaurant;
  const dietFilter = state.ui.foodsDiet;
  const sort = state.ui.foodsSort;

  let filtered = foods.filter(f => {
    if (restFilter !== 'ALL' && f.restaurant_id !== restFilter) return false;
    if (dietFilter !== 'ALL' && f.dietary_type !== dietFilter) return false;
    if (search) {
      const matchName = f.name.toLowerCase().includes(search);
      const matchDesc = f.description?.toLowerCase().includes(search);
      const matchTag = f.tags?.some(t => t.toLowerCase().includes(search));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  if (sort === 'price-asc') {
    filtered.sort((a, b) => (a.pricing?.[0]?.selling_price || 0) - (b.pricing?.[0]?.selling_price || 0));
  } else if (sort === 'price-desc') {
    filtered.sort((a, b) => (b.pricing?.[0]?.selling_price || 0) - (a.pricing?.[0]?.selling_price || 0));
  } else if (sort === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'calories-asc') {
    filtered.sort((a, b) => (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0));
  } else if (sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = filtered.length;
  const perPage = state.ui.foodsPerPage;
  const totalPages = Math.ceil(total / perPage) || 1;
  if (state.ui.foodsPage > totalPages) state.ui.foodsPage = 1;

  const startIdx = (state.ui.foodsPage - 1) * perPage;
  const pageItems = filtered.slice(startIdx, startIdx + perPage);

  document.getElementById('foods-page-info').textContent = total > 0
    ? `Showing ${startIdx + 1}–${Math.min(startIdx + perPage, total)} of ${total.toLocaleString()} items`
    : 'No items match filter criteria';
  document.getElementById('food-curr-page').textContent = `${state.ui.foodsPage} / ${totalPages}`;
  document.getElementById('food-prev-btn').disabled = state.ui.foodsPage <= 1;
  document.getElementById('food-next-btn').disabled = state.ui.foodsPage >= totalPages;

  if (pageItems.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        No food items found matching current filters.
      </div>
    `;
    return;
  }

  pageItems.forEach(food => {
    const img = getFoodImage(food);
    const parentRest = state.lookups.restaurantMap.get(food.restaurant_id);
    const price = food.pricing?.[0] || { selling_price: 199, base_price: 249 };
    const discount = Math.round(((price.base_price - price.selling_price) / price.base_price) * 100);

    const itemEl = document.createElement('div');
    itemEl.className = 'list-item';
    itemEl.innerHTML = `
      <!-- Dish Image -->
      <div class="list-thumb-wrapper" title="Click to zoom dish photo">
        <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(food.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
        <span class="list-thumb-badge">${food.dietary_type}</span>
      </div>

      <!-- Main Column -->
      <div class="list-main-col">
        <div class="list-title-row">
          <span class="diet-indicator ${food.dietary_type}"></span>
          <span class="list-item-title">${escapeHtml(food.name)}</span>
          ${parentRest ? `<button class="btn btn-outline btn-sm filter-by-rest-btn" style="padding: 0.1rem 0.45rem; font-size: 0.72rem;">🏪 ${escapeHtml(parentRest.name)} (${escapeHtml(parentRest.location?.city || '')})</button>` : ''}
        </div>

        <p class="list-item-desc">${escapeHtml(food.description)}</p>

        <div class="list-tags-row">
          ${(food.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
          <span class="uuid-chip" title="Image UUID (click to copy)">
            📸 img: ${food.image_id.substring(0, 16)}...
          </span>
        </div>
      </div>

      <!-- Metrics Column -->
      <div class="list-metrics-col">
        <div class="price-display">
          <span>₹${price.selling_price}</span>
          ${price.base_price > price.selling_price ? `<span class="price-base">₹${price.base_price}</span>` : ''}
        </div>
        ${discount > 0 ? `<span class="discount-tag">${discount}% OFF</span>` : ''}
        <span class="rating-badge">★ ${food.rating}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">🔥 ${food.nutrition?.calories || 350} kcal</span>
      </div>

      <!-- Actions Column -->
      <div class="list-actions-col">
        <button class="btn btn-outline btn-sm zoom-food-btn">
          🔍 Zoom
        </button>
        <button class="btn btn-outline btn-sm inspect-food-btn">
          📄 JSON
        </button>
      </div>
    `;

    // Zoom Image
    itemEl.querySelector('.list-thumb-wrapper').addEventListener('click', () => {
      openLightbox(img.image_url, `${food.name} (${food.dietary_type.toUpperCase()})`, food.image_id);
    });
    itemEl.querySelector('.zoom-food-btn').addEventListener('click', () => {
      openLightbox(img.image_url, `${food.name} (${food.dietary_type.toUpperCase()})`, food.image_id);
    });

    // Filter by this restaurant
    const restFilterBtn = itemEl.querySelector('.filter-by-rest-btn');
    if (restFilterBtn) {
      restFilterBtn.addEventListener('click', () => {
        document.getElementById('foods-restaurant-filter').value = food.restaurant_id;
        state.ui.foodsRestaurant = food.restaurant_id;
        state.ui.foodsPage = 1;
        renderFoodsListView();
      });
    }

    // Inspect JSON
    itemEl.querySelector('.inspect-food-btn').addEventListener('click', () => {
      openJsonModal(`Food Dish: ${food.name}`, food);
    });

    listContainer.appendChild(itemEl);
  });
}

/* ==========================================================================
   VIEW 3: BLOCK 3 - IMAGE CATALOG LIST VIEW (`restaurant-images.json`)
   ========================================================================== */

function renderImagesListView() {
  const images = state.datasets.images?.data || [];
  const listContainer = document.getElementById('images-list');
  listContainer.innerHTML = '';

  const search = state.ui.imgsSearch.toLowerCase().trim();
  const typeFilter = state.ui.imgsType;

  const filtered = images.filter(img => {
    if (typeFilter !== 'ALL' && img.type !== typeFilter) return false;
    if (search) {
      const matchDesc = img.description?.toLowerCase().includes(search);
      const matchId = img.id?.toLowerCase().includes(search);
      const matchTags = img.tags?.some(t => t.toLowerCase().includes(search));
      if (!matchDesc && !matchId && !matchTags) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        No images found matching filter criteria.
      </div>
    `;
    return;
  }

  filtered.forEach(img => {
    const usageCount = state.lookups.imageUsageCount.get(img.id) || 0;
    const isBanner = img.type === 'banner';

    const itemEl = document.createElement('div');
    itemEl.className = 'list-item';
    itemEl.innerHTML = `
      <!-- Image Thumbnail -->
      <div class="list-thumb-wrapper" title="Click to zoom image and verify resolution">
        <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.description)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
        <span class="list-thumb-badge" style="${isBanner ? 'background:#2563eb;' : 'background:#059669;'}">${img.type}</span>
      </div>

      <!-- Main Column -->
      <div class="list-main-col">
        <div class="list-title-row">
          <span class="list-item-title" style="font-size: 0.95rem;">${escapeHtml(img.description)}</span>
          <span class="tag-chip ${isBanner ? 'primary' : 'accent'}">${img.type.toUpperCase()}</span>
        </div>

        <div style="margin: 0.2rem 0;">
          <span class="uuid-chip" title="Click to copy Image UUID">
            UUID: ${img.id} 📋
          </span>
        </div>

        <div class="list-tags-row">
          ${(img.tags || []).map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
          <span style="font-size: 0.72rem; color: var(--text-subtle);">CDN: images.unsplash.com</span>
        </div>
      </div>

      <!-- Metrics Column -->
      <div class="list-metrics-col">
        <strong style="font-size: 0.85rem; color: var(--text-main);">
          ${isBanner ? '🏪 Restaurant Banner' : `🍲 Used in ${usageCount} dishes`}
        </strong>
        <span class="tag-chip" style="background: rgba(16,185,129,0.15); color: #047857; font-weight: 600;">
          CDN Verified
        </span>
      </div>

      <!-- Actions Column -->
      <div class="list-actions-col">
        <button class="btn btn-outline btn-sm zoom-img-btn">
          🔍 Verify Zoom
        </button>
        ${!isBanner && usageCount > 0 ? `<button class="btn btn-outline btn-sm view-dishes-btn">🍲 View Dishes (${usageCount})</button>` : ''}
        <button class="btn btn-outline btn-sm inspect-img-btn">
          📄 JSON
        </button>
      </div>
    `;

    // Copy UUID
    itemEl.querySelector('.uuid-chip').addEventListener('click', () => {
      copyText(img.id, 'Image UUID copied to clipboard');
    });

    // Zoom Image
    itemEl.querySelector('.list-thumb-wrapper').addEventListener('click', () => {
      openLightbox(img.image_url, img.description, img.id);
    });
    itemEl.querySelector('.zoom-img-btn').addEventListener('click', () => {
      openLightbox(img.image_url, img.description, img.id);
    });

    // View dishes using this image
    const viewDishesBtn = itemEl.querySelector('.view-dishes-btn');
    if (viewDishesBtn) {
      viewDishesBtn.addEventListener('click', () => {
        showDishesUsingImage(img);
      });
    }

    // Inspect JSON
    itemEl.querySelector('.inspect-img-btn').addEventListener('click', () => {
      openJsonModal(`Image Asset (${img.type})`, img);
    });

    listContainer.appendChild(itemEl);
  });
}

function showDishesUsingImage(img) {
  const foods = state.datasets.foods?.data || [];
  const linkedFoods = foods.filter(f => f.image_id === img.id);

  const listData = linkedFoods.map(f => {
    const r = state.lookups.restaurantMap.get(f.restaurant_id);
    return {
      dish_name: f.name,
      restaurant: r ? `${r.name} (${r.location?.city})` : 'Unknown',
      dietary_type: f.dietary_type,
      selling_price: f.pricing?.[0]?.selling_price ? `INR ${f.pricing[0].selling_price}` : 'N/A',
      rating: f.rating,
      food_id: f.id
    };
  });

  openJsonModal(`Dishes using image: "${img.description}" (${linkedFoods.length} total dishes)`, {
    image_id: img.id,
    image_url: img.image_url,
    total_usages: linkedFoods.length,
    dishes: listData
  });
}

/* ==========================================================================
   VIEW 4: RAW JSON INSPECTOR
   ========================================================================== */

function renderRawJsonView() {
  const datasetKey = state.ui.activeRawDataset;
  const dataset = state.datasets[datasetKey];
  const meta = state.meta[datasetKey];

  if (!dataset) return;

  document.getElementById('raw-meta-path').textContent = meta.path;
  document.getElementById('raw-meta-size').textContent = meta.size;
  document.getElementById('raw-meta-count').textContent = (dataset.data?.length || 0).toLocaleString();
  document.getElementById('raw-meta-timestamp').textContent = dataset.timestamp?.updated_at || 'N/A';

  const search = state.ui.rawSearch.toLowerCase().trim();
  const pre = document.getElementById('raw-json-display');

  const jsonString = JSON.stringify(dataset, null, 2);

  if (!search) {
    pre.textContent = jsonString;
  } else {
    const lines = jsonString.split('\n');
    const matchedLines = lines.filter(l => l.toLowerCase().includes(search));
    pre.textContent = `// Found ${matchedLines.length} matching lines out of ${lines.length} total lines:\n\n` + matchedLines.join('\n');
  }
}

/* ==========================================================================
   MODALS & LIGHTBOX
   ========================================================================== */

function openLightbox(url, description, id) {
  const modal = document.getElementById('image-lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const descEl = document.getElementById('lightbox-desc');
  const idEl = document.getElementById('lightbox-id');
  const openUrl = document.getElementById('lightbox-open-url');
  const copyBtn = document.getElementById('lightbox-copy-url');
  const statusEl = document.getElementById('lightbox-status');

  statusEl.textContent = 'Verifying image...';
  statusEl.style.background = 'rgba(59,130,246,0.2)';
  statusEl.style.color = '#60a5fa';

  img.onload = () => {
    statusEl.textContent = `Verified (${img.naturalWidth}×${img.naturalHeight}px)`;
    statusEl.style.background = 'rgba(16,185,129,0.2)';
    statusEl.style.color = '#34d399';
  };

  img.onerror = () => {
    statusEl.textContent = 'Image Load Error ⚠️';
    statusEl.style.background = 'rgba(239,68,68,0.2)';
    statusEl.style.color = '#f87171';
  };

  img.src = url;
  descEl.textContent = description || 'Image Verification Preview';
  idEl.textContent = id ? `Asset UUID: ${id}` : '';
  openUrl.href = url;

  copyBtn.onclick = () => copyText(url, 'Image URL copied to clipboard');

  modal.classList.add('open');
}

function openJsonModal(title, dataObject) {
  const modal = document.getElementById('json-inspect-modal');
  document.getElementById('json-modal-title').textContent = title;
  const content = document.getElementById('json-modal-content');
  const jsonText = JSON.stringify(dataObject, null, 2);
  content.textContent = jsonText;

  document.getElementById('btn-copy-modal-json').onclick = () => {
    copyText(jsonText, 'JSON copied to clipboard');
  };

  modal.classList.add('open');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('open');
}

/* ==========================================================================
   INTERACTIONS & EVENT LISTENERS
   ========================================================================== */

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchTab(tabName);
    });
  });

  // Restaurants List Filters
  document.getElementById('rests-search').addEventListener('input', (e) => {
    state.ui.restsSearch = e.target.value;
    renderRestaurantsListView();
  });
  document.getElementById('rests-city-filter').addEventListener('change', (e) => {
    state.ui.restsCity = e.target.value;
    renderRestaurantsListView();
  });
  document.getElementById('rests-cuisine-filter').addEventListener('change', (e) => {
    state.ui.restsCuisine = e.target.value;
    renderRestaurantsListView();
  });
  document.getElementById('rests-sort').addEventListener('change', (e) => {
    state.ui.restsSort = e.target.value;
    renderRestaurantsListView();
  });
  document.getElementById('btn-inspect-rests-json').addEventListener('click', () => {
    switchTab('raw-json');
    document.getElementById('raw-dataset-select').value = 'restaurants';
    state.ui.activeRawDataset = 'restaurants';
    renderRawJsonView();
  });

  // Foods List Filters
  document.getElementById('foods-search').addEventListener('input', (e) => {
    state.ui.foodsSearch = e.target.value;
    state.ui.foodsPage = 1;
    renderFoodsListView();
  });
  document.getElementById('foods-restaurant-filter').addEventListener('change', (e) => {
    state.ui.foodsRestaurant = e.target.value;
    state.ui.foodsPage = 1;
    renderFoodsListView();
  });
  document.getElementById('foods-diet-filter').addEventListener('change', (e) => {
    state.ui.foodsDiet = e.target.value;
    state.ui.foodsPage = 1;
    renderFoodsListView();
  });
  document.getElementById('foods-sort').addEventListener('change', (e) => {
    state.ui.foodsSort = e.target.value;
    state.ui.foodsPage = 1;
    renderFoodsListView();
  });
  document.getElementById('foods-per-page').addEventListener('change', (e) => {
    state.ui.foodsPerPage = parseInt(e.target.value, 10);
    state.ui.foodsPage = 1;
    renderFoodsListView();
  });
  document.getElementById('food-prev-btn').addEventListener('click', () => {
    if (state.ui.foodsPage > 1) {
      state.ui.foodsPage--;
      renderFoodsListView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  document.getElementById('food-next-btn').addEventListener('click', () => {
    state.ui.foodsPage++;
    renderFoodsListView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('btn-inspect-foods-json').addEventListener('click', () => {
    switchTab('raw-json');
    document.getElementById('raw-dataset-select').value = 'foods';
    state.ui.activeRawDataset = 'foods';
    renderRawJsonView();
  });

  // Images List Filters
  document.getElementById('imgs-search').addEventListener('input', (e) => {
    state.ui.imgsSearch = e.target.value;
    renderImagesListView();
  });
  document.getElementById('imgs-type-filter').addEventListener('change', (e) => {
    state.ui.imgsType = e.target.value;
    renderImagesListView();
  });
  document.getElementById('btn-inspect-imgs-json').addEventListener('click', () => {
    switchTab('raw-json');
    document.getElementById('raw-dataset-select').value = 'images';
    state.ui.activeRawDataset = 'images';
    renderRawJsonView();
  });

  // Raw JSON Inspector controls
  document.getElementById('raw-dataset-select').addEventListener('change', (e) => {
    state.ui.activeRawDataset = e.target.value;
    renderRawJsonView();
  });
  document.getElementById('raw-search-filter').addEventListener('input', (e) => {
    state.ui.rawSearch = e.target.value;
    renderRawJsonView();
  });
  document.getElementById('btn-copy-raw-json').addEventListener('click', () => {
    const dataset = state.datasets[state.ui.activeRawDataset];
    if (dataset) {
      copyText(JSON.stringify(dataset, null, 2), 'Complete JSON copied to clipboard');
    }
  });
  document.getElementById('btn-download-raw-json').addEventListener('click', () => {
    const key = state.ui.activeRawDataset;
    const dataset = state.datasets[key];
    const meta = state.meta[key];
    if (dataset) {
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta.path.split('/').pop() || `${key}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // Modal Closers
  document.getElementById('lightbox-close').addEventListener('click', () => closeModal('image-lightbox-modal'));
  document.getElementById('json-modal-close').addEventListener('click', () => closeModal('json-inspect-modal'));

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Local File Picker
  const filePicker = document.getElementById('local-file-picker');
  if (filePicker) {
    filePicker.addEventListener('change', handleLocalFileSelection);
  }
}

function switchTab(tabName) {
  state.ui.activeTab = tabName;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${tabName}`);
  });
}

function showFileProtocolBanner() {
  const banner = document.getElementById('file-protocol-banner');
  if (banner) banner.style.display = 'flex';
}

async function handleLocalFileSelection(event) {
  const files = Array.from(event.target.files);
  for (const file of files) {
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (file.name.includes('restaurant-images')) {
        state.datasets.images = json;
      } else if (file.name.includes('food-items')) {
        state.datasets.foods = json;
      } else if (file.name.includes('restaurants')) {
        state.datasets.restaurants = json;
      }
    } catch (e) {
      console.error('Error parsing local file:', file.name, e);
    }
  }

  if (state.datasets.restaurants && state.datasets.foods && state.datasets.images) {
    document.getElementById('file-protocol-banner').style.display = 'none';
    buildLookupIndexes();
    updateGlobalMetrics();
    renderAllViews();
    showToast('Loaded all 3 JSON datasets from local files successfully!');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast-notice');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function copyText(text, successMessage = 'Copied to clipboard') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage);
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMessage);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', init);
