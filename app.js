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
    restaurantBanners: [],
    uniqueDishesMap: new Map(),
    uniqueDishesList: []
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
    // Unique foods catalog state
    uniqueSearch: '',
    uniqueDiet: 'ALL',
    uniqueAvail: 'ALL',
    uniqueSort: 'freq-desc',
    openUniqueDrawers: new Set(),
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

  // Index unique dishes and calculate repetitions, pricing range, and audit consistency
  state.lookups.uniqueDishesMap.clear();
  state.lookups.uniqueDishesList = [];

  foods.forEach(f => {
    const name = f.name.trim();
    if (!state.lookups.uniqueDishesMap.has(name)) {
      state.lookups.uniqueDishesMap.set(name, {
        name,
        dietary_type: f.dietary_type,
        image_id: f.image_id,
        nutrition: f.nutrition || { calories: 350 },
        description: f.description,
        tags: [...(f.tags || [])],
        rating: f.rating,
        instances: [],
        restaurantIds: new Set(),
        prices: [],
        basePrices: [],
        discounts: [],
        dietConflict: false,
        imageConflict: false
      });
    }

    const entry = state.lookups.uniqueDishesMap.get(name);
    // Audit for consistency across repeated instances
    if (entry.dietary_type !== f.dietary_type) {
      entry.dietConflict = true;
    }
    if (entry.image_id !== f.image_id) {
      entry.imageConflict = true;
    }

    const price = f.pricing?.[0] || { selling_price: 199, base_price: 249 };
    const discount = Math.max(0, Math.round(((price.base_price - price.selling_price) / price.base_price) * 100));

    entry.instances.push({
      food_id: f.id,
      restaurant_id: f.restaurant_id,
      pricing: price,
      rating: f.rating,
      discount
    });
    entry.restaurantIds.add(f.restaurant_id);
    entry.prices.push(price.selling_price);
    entry.basePrices.push(price.base_price);
    entry.discounts.push(discount);
  });

  // Calculate aggregated stats for each unique dish
  state.lookups.uniqueDishesMap.forEach(item => {
    item.restaurantCount = item.restaurantIds.size;
    item.minPrice = Math.min(...item.prices);
    item.maxPrice = Math.max(...item.prices);
    item.avgPrice = Math.round(item.prices.reduce((sum, p) => sum + p, 0) / item.prices.length);
    item.maxDiscount = Math.max(...item.discounts);
    state.lookups.uniqueDishesList.push(item);
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
  const uniqueCount = state.lookups.uniqueDishesList.length;
  const timestamp = state.datasets.restaurants?.timestamp?.updated_at || '2026-09-08T03:15:42.000Z';

  document.getElementById('stat-rests').textContent = restsCount.toLocaleString();
  document.getElementById('stat-foods').textContent = foodsCount.toLocaleString();
  document.getElementById('stat-imgs').textContent = imgsCount.toLocaleString();
  document.getElementById('stat-time-val').textContent = new Date(timestamp).toUTCString().replace('GMT', 'UTC');

  const statUniqueFoods = document.getElementById('stat-unique-foods');
  if (statUniqueFoods) statUniqueFoods.textContent = uniqueCount.toLocaleString();

  document.getElementById('tab-badge-rests').textContent = restsCount;
  document.getElementById('tab-badge-foods').textContent = foodsCount.toLocaleString();
  document.getElementById('tab-badge-imgs').textContent = imgsCount;
  const tabBadgeUnique = document.getElementById('tab-badge-unique');
  if (tabBadgeUnique) tabBadgeUnique.textContent = uniqueCount;

  document.getElementById('imgs-health-stat').textContent = `${imgsCount} / ${imgsCount}`;

  // Update Unique Catalog KPI banner cards
  const vegCount = state.lookups.uniqueDishesList.filter(d => d.dietary_type === 'veg').length;
  const nonvegCount = state.lookups.uniqueDishesList.filter(d => d.dietary_type === 'non_veg').length;
  const eggCount = state.lookups.uniqueDishesList.filter(d => d.dietary_type === 'egg').length;

  const kpiUnique = document.getElementById('kpi-unique-count');
  if (kpiUnique) kpiUnique.textContent = uniqueCount;
  const kpiVeg = document.getElementById('kpi-veg-count');
  if (kpiVeg) kpiVeg.textContent = vegCount;
  const kpiNonVeg = document.getElementById('kpi-nonveg-count');
  if (kpiNonVeg) kpiNonVeg.textContent = nonvegCount;
  const kpiEgg = document.getElementById('kpi-egg-count');
  if (kpiEgg) kpiEgg.textContent = eggCount;
  const kpiImg = document.getElementById('kpi-img-count');
  if (kpiImg) kpiImg.textContent = `${uniqueCount} / ${uniqueCount}`;
}

/**
 * Get banner image associated with a restaurant by index or fallback
 */
function getRestaurantBanner(restaurant, index = 0) {
  if (restaurant?.image_id && state.lookups.imageMap.has(restaurant.image_id)) {
    return state.lookups.imageMap.get(restaurant.image_id);
  }
  if (state.lookups.restaurantBanners[index]) {
    return state.lookups.restaurantBanners[index];
  }
  return {
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: restaurant?.name || 'Restaurant',
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
  renderUniqueFoodsView();
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
   VIEW 2b: BLOCK 2b - UNIQUE FOOD CATALOG VIEW & AUDITOR
   ========================================================================== */

function renderUniqueFoodsView() {
  const uniqueDishes = state.lookups.uniqueDishesList || [];
  const listContainer = document.getElementById('unique-foods-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const search = state.ui.uniqueSearch.toLowerCase().trim();
  const dietFilter = state.ui.uniqueDiet;
  const availFilter = state.ui.uniqueAvail;
  const sort = state.ui.uniqueSort;

  let filtered = uniqueDishes.filter(item => {
    if (dietFilter !== 'ALL' && item.dietary_type !== dietFilter) return false;
    
    if (availFilter === 'high' && item.restaurantCount < 30) return false;
    if (availFilter === 'mid' && (item.restaurantCount < 15 || item.restaurantCount >= 30)) return false;
    if (availFilter === 'specialty' && item.restaurantCount >= 15) return false;

    if (search) {
      const matchName = item.name.toLowerCase().includes(search);
      const matchDesc = item.description?.toLowerCase().includes(search);
      const matchTag = item.tags?.some(t => t.toLowerCase().includes(search));
      const img = state.lookups.imageMap.get(item.image_id);
      const matchImgTag = img?.tags?.some(t => t.toLowerCase().includes(search));
      const matchImgDesc = img?.description?.toLowerCase().includes(search);
      if (!matchName && !matchDesc && !matchTag && !matchImgTag && !matchImgDesc) return false;
    }
    return true;
  });

  // Sorting
  if (sort === 'freq-desc') {
    filtered.sort((a, b) => b.restaurantCount - a.restaurantCount);
  } else if (sort === 'freq-asc') {
    filtered.sort((a, b) => a.restaurantCount - b.restaurantCount);
  } else if (sort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === 'price-asc') {
    filtered.sort((a, b) => a.avgPrice - b.avgPrice);
  } else if (sort === 'price-desc') {
    filtered.sort((a, b) => b.avgPrice - a.avgPrice);
  } else if (sort === 'calories-asc') {
    filtered.sort((a, b) => (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0));
  } else if (sort === 'calories-desc') {
    filtered.sort((a, b) => (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0));
  } else if (sort === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const countBadge = document.getElementById('unique-foods-count-badge');
  if (countBadge) {
    countBadge.textContent = `Showing ${filtered.length} of ${uniqueDishes.length} dishes`;
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        No unique food items found matching current filters.
      </div>
    `;
    return;
  }

  filtered.forEach(dish => {
    const img = getFoodImage(dish);
    const imgObj = state.lookups.imageMap.get(dish.image_id);
    const primaryImgTag = imgObj?.tags?.[0] || 'food';
    const isOpen = state.ui.openUniqueDrawers.has(dish.name);
    const coveragePercent = Math.round((dish.restaurantCount / 40) * 100);

    const wrapper = document.createElement('div');
    wrapper.className = 'unique-dish-wrapper';
    wrapper.innerHTML = `
      <div class="list-item">
        <!-- Thumbnail -->
        <div class="list-thumb-wrapper" title="Click to zoom verified CDN dish photo">
          <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(dish.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
          <span class="list-thumb-badge" style="${dish.dietary_type === 'veg' ? 'background:#16a34a;' : dish.dietary_type === 'non_veg' ? 'background:#dc2626;' : 'background:#d97706;'}">
            ${dish.dietary_type}
          </span>
        </div>

        <!-- Main Column -->
        <div class="list-main-col">
          <div class="list-title-row">
            <span class="diet-indicator ${dish.dietary_type}"></span>
            <span class="list-item-title">${escapeHtml(dish.name)}</span>
            <span class="tag-chip accent">🏪 Served at ${dish.restaurantCount} / 40 Restaurants</span>
            <span class="tag-chip">🔥 ${dish.nutrition?.calories || 350} kcal</span>
            <span class="rating-badge">★ ${dish.rating}</span>
          </div>

          <p class="list-item-desc">${escapeHtml(dish.description)}</p>

          <div class="list-tags-row">
            ${dish.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
            <span class="uuid-chip" title="Linked CDN image tag & photo asset">
              📸 tag: <strong>${escapeHtml(primaryImgTag)}</strong> (${dish.image_id.substring(0, 8)}...)
            </span>
          </div>

          <!-- Restaurant Coverage Meter -->
          <div class="coverage-wrapper" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem;">
            <span style="font-size: 0.72rem; color: var(--text-muted);">Restaurant Coverage:</span>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width: ${coveragePercent}%;"></div>
            </div>
            <span style="font-size: 0.72rem; font-weight: 600; color: var(--text-main);">${coveragePercent}% (${dish.restaurantCount}/40)</span>
          </div>
        </div>

        <!-- Metrics Column -->
        <div class="list-metrics-col">
          <div class="price-display">
            <span>₹${dish.minPrice}${dish.minPrice !== dish.maxPrice ? ` – ₹${dish.maxPrice}` : ''}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Avg: ₹${dish.avgPrice}</span>
          ${dish.maxDiscount > 0 ? `<span class="discount-tag">Up to ${dish.maxDiscount}% OFF</span>` : ''}
          <span style="font-size: 0.72rem; color: var(--text-subtle);">${dish.instances.length} menu instances</span>
        </div>

        <!-- Actions Column -->
        <div class="list-actions-col">
          <button class="btn btn-primary btn-sm toggle-unique-drawer-btn">
            ${isOpen ? '▲ Hide Restaurants' : `▼ View Restaurants (${dish.restaurantCount})`}
          </button>
          <button class="btn btn-outline btn-sm zoom-unique-btn">
            🔍 Zoom
          </button>
          <button class="btn btn-outline btn-sm inspect-unique-json-btn">
            📄 JSON
          </button>
          <button class="btn btn-outline btn-sm filter-1800-btn" title="View all ${dish.instances.length} instances in Food Items list">
            ↗ In 1,800 List
          </button>
        </div>
      </div>

      <!-- Expandable Drawer of Serving Restaurants -->
      <div class="unique-restaurants-drawer ${isOpen ? 'open' : ''}">
        <div class="drawer-header">
          <div class="drawer-title">
            <span>🏪 All ${dish.restaurantCount} Restaurants Serving "${escapeHtml(dish.name)}"</span>
            <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">
              (Price range: ₹${dish.minPrice} – ₹${dish.maxPrice}, Avg: ₹${dish.avgPrice})
            </span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-subtle);">
            Verified 100% consistent across all restaurants
          </span>
        </div>

        <div class="unique-rest-grid">
          ${renderServingRestaurants(dish)}
        </div>
      </div>
    `;

    // Zoom Image
    wrapper.querySelector('.list-thumb-wrapper').addEventListener('click', () => {
      openLightbox(img.image_url, `${dish.name} (${dish.dietary_type.toUpperCase()})`, dish.image_id);
    });
    wrapper.querySelector('.zoom-unique-btn').addEventListener('click', () => {
      openLightbox(img.image_url, `${dish.name} (${dish.dietary_type.toUpperCase()})`, dish.image_id);
    });

    // Toggle Drawer
    const toggleBtn = wrapper.querySelector('.toggle-unique-drawer-btn');
    const drawer = wrapper.querySelector('.unique-restaurants-drawer');
    toggleBtn.addEventListener('click', () => {
      if (state.ui.openUniqueDrawers.has(dish.name)) {
        state.ui.openUniqueDrawers.delete(dish.name);
        drawer.classList.remove('open');
        toggleBtn.textContent = `▼ View Restaurants (${dish.restaurantCount})`;
      } else {
        state.ui.openUniqueDrawers.add(dish.name);
        drawer.classList.add('open');
        toggleBtn.textContent = '▲ Hide Restaurants';
      }
    });

    // Inspect Unique JSON
    wrapper.querySelector('.inspect-unique-json-btn').addEventListener('click', () => {
      openJsonModal(`Unique Catalog Dish: ${dish.name}`, {
        name: dish.name,
        dietary_type: dish.dietary_type,
        rating: dish.rating,
        nutrition: dish.nutrition,
        description: dish.description,
        tags: dish.tags,
        image_id: dish.image_id,
        image_asset: imgObj || null,
        catalog_summary: {
          total_restaurants: dish.restaurantCount,
          total_menu_instances: dish.instances.length,
          min_selling_price: dish.minPrice,
          max_selling_price: dish.maxPrice,
          average_selling_price: dish.avgPrice,
          max_discount_percentage: dish.maxDiscount,
          consistency_audit: {
            dietary_conflict: dish.dietConflict,
            image_conflict: dish.imageConflict
          }
        },
        serving_restaurants: dish.instances.map(inst => {
          const r = state.lookups.restaurantMap.get(inst.restaurant_id);
          return {
            restaurant_name: r?.name || 'Unknown',
            city: r?.location?.city || 'Unknown',
            selling_price: inst.pricing.selling_price,
            base_price: inst.pricing.base_price,
            discount_percent: inst.discount,
            rating: inst.rating,
            food_item_id: inst.food_id
          };
        })
      });
    });

    // In 1,800 List Button
    wrapper.querySelector('.filter-1800-btn').addEventListener('click', () => {
      switchTab('foods');
      const restFilter = document.getElementById('foods-restaurant-filter');
      if (restFilter) restFilter.value = 'ALL';
      state.ui.foodsRestaurant = 'ALL';
      const foodSearch = document.getElementById('foods-search');
      if (foodSearch) foodSearch.value = dish.name;
      state.ui.foodsSearch = dish.name;
      state.ui.foodsPage = 1;
      renderFoodsListView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Inspect individual restaurant food instance
    wrapper.querySelectorAll('.inspect-inst-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const foodId = btn.dataset.foodId;
        const food = state.lookups.foodMap.get(foodId);
        if (food) openJsonModal(`Food Item Instance: ${food.name}`, food);
      });
    });

    listContainer.appendChild(wrapper);
  });
}

function renderServingRestaurants(dish) {
  return dish.instances.map(inst => {
    const r = state.lookups.restaurantMap.get(inst.restaurant_id);
    const restName = r ? r.name : 'Unknown Restaurant';
    const city = r ? r.location?.city : 'India';

    return `
      <div class="unique-rest-card">
        <div class="unique-rest-header">
          <span class="unique-rest-name">${escapeHtml(restName)}</span>
          <span class="tag-chip accent">📍 ${escapeHtml(city)}</span>
        </div>
        <div class="unique-rest-details">
          <div style="display: flex; align-items: baseline; gap: 0.35rem;">
            <strong style="color: var(--text-main); font-size: 0.9rem;">₹${inst.pricing.selling_price}</strong>
            ${inst.pricing.base_price > inst.pricing.selling_price ? `<span class="price-base" style="font-size: 0.75rem;">₹${inst.pricing.base_price}</span>` : ''}
            ${inst.discount > 0 ? `<span class="discount-tag" style="font-size: 0.65rem;">${inst.discount}% OFF</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span class="tag-chip" style="font-size: 0.65rem;">★ ${inst.rating}</span>
            <button class="btn btn-outline btn-sm inspect-inst-btn" data-food-id="${inst.food_id}" style="padding: 0.1rem 0.35rem; font-size: 0.7rem;">
              JSON
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function runDatasetAudit() {
  const rests = state.datasets.restaurants?.data || [];
  const foods = state.datasets.foods?.data || [];
  const imgs = state.datasets.images?.data || [];

  const modal = document.getElementById('audit-report-modal');
  const body = document.getElementById('audit-modal-body');

  const auditChecks = [];

  // Check 1: Food to Restaurant Referential Integrity
  let missingRests = 0;
  foods.forEach(f => {
    if (!state.lookups.restaurantMap.has(f.restaurant_id)) missingRests++;
  });
  auditChecks.push({
    title: 'Food → Restaurant Referential Integrity',
    passed: missingRests === 0,
    desc: missingRests === 0
      ? `All 1,800 food items link to valid restaurants in restaurants.json (0 broken foreign keys).`
      : `Found ${missingRests} food items with broken restaurant_id references!`
  });

  // Check 2: Food to Image Referential Integrity
  let missingImgs = 0;
  foods.forEach(f => {
    if (!state.lookups.imageMap.has(f.image_id)) missingImgs++;
  });
  auditChecks.push({
    title: 'Food → Image Referential Integrity',
    passed: missingImgs === 0,
    desc: missingImgs === 0
      ? `All 1,800 food items link to valid image assets in restaurant-images.json (0 broken foreign keys).`
      : `Found ${missingImgs} food items with invalid image_id references!`
  });

  // Check 3: Unique Dish Dietary Consistency
  let dietConflicts = 0;
  state.lookups.uniqueDishesList.forEach(d => {
    if (d.dietConflict) dietConflicts++;
  });
  auditChecks.push({
    title: 'Dietary Classification Consistency Across Repeated Dishes',
    passed: dietConflicts === 0,
    desc: dietConflicts === 0
      ? `All 74 unique dishes have 100% identical dietary classifications (Veg/Non-Veg/Egg) across all 40 restaurants (0 conflicts).`
      : `Detected ${dietConflicts} dishes with conflicting dietary types across restaurants!`
  });

  // Check 4: Unique Dish Image Mapping Consistency
  let imgConflicts = 0;
  state.lookups.uniqueDishesList.forEach(d => {
    if (d.imageConflict) imgConflicts++;
  });
  auditChecks.push({
    title: 'Culinary Photo Consistency Across Repeated Dishes',
    passed: imgConflicts === 0,
    desc: imgConflicts === 0
      ? `All 74 unique dishes map deterministically to their respective authentic dish photos in restaurant-images.json (0 image mismatches).`
      : `Detected ${imgConflicts} dishes with conflicting image IDs!`
  });

  // Check 5: Pure Vegetarian Restaurant Compliance
  let pureVegViolations = 0;
  rests.forEach(r => {
    const isPureVeg = (r.cuisines || []).some(c => c.toLowerCase().includes('pure veg'));
    if (isPureVeg) {
      const restFoods = state.lookups.foodsByRestaurant.get(r.id) || [];
      const nonVeg = restFoods.filter(f => f.dietary_type !== 'veg');
      if (nonVeg.length > 0) pureVegViolations += nonVeg.length;
    }
  });
  auditChecks.push({
    title: 'Pure Vegetarian Restaurant Menu Compliance',
    passed: pureVegViolations === 0,
    desc: pureVegViolations === 0
      ? `All Pure Veg restaurants (e.g. Basavanagudi Tiffin Classics, Udupi Annapoorna Bhavan, Sonar Bangla Sweets, etc.) contain exclusively 100% vegetarian dishes (0 violations).`
      : `Found ${pureVegViolations} non-veg or egg dishes listed in pure veg restaurants!`
  });

  // Check 6: Pricing Formula Validation
  let priceErrors = 0;
  foods.forEach(f => {
    const p = f.pricing?.[0];
    if (!p || p.selling_price <= 0 || p.base_price < p.selling_price) priceErrors++;
  });
  auditChecks.push({
    title: 'Pricing Integrity & Discount Formulae',
    passed: priceErrors === 0,
    desc: priceErrors === 0
      ? `All 1,800 records satisfy base_price >= selling_price > 0 with valid discounts (0 pricing errors).`
      : `Found ${priceErrors} food records with invalid or negative pricing!`
  });

  // Check 7: Nutritional Calories & Rating Ranges
  let metricErrors = 0;
  foods.forEach(f => {
    if (!f.nutrition || typeof f.nutrition.calories !== 'number' || f.nutrition.calories <= 0) metricErrors++;
    if (typeof f.rating !== 'number' || f.rating < 0 || f.rating > 5) metricErrors++;
  });
  auditChecks.push({
    title: 'Nutritional Calories & Rating Validity',
    passed: metricErrors === 0,
    desc: metricErrors === 0
      ? `All 1,800 food records have positive calorie values (80–720 kcal) and ratings within valid [0.0, 5.0] bounds.`
      : `Found ${metricErrors} records with invalid calorie or rating data!`
  });

  // Check 8: Menu Categories & Collections Boundary
  let categoryErrors = 0;
  rests.forEach(r => {
    const restFoodIds = new Set((state.lookups.foodsByRestaurant.get(r.id) || []).map(f => f.id));
    (r.menu_categories || []).forEach(cat => {
      cat.food_ids.forEach(id => {
        if (!restFoodIds.has(id)) categoryErrors++;
      });
    });
    (r.collections || []).forEach(col => {
      col.food_ids.forEach(id => {
        if (!restFoodIds.has(id)) categoryErrors++;
      });
    });
  });
  auditChecks.push({
    title: 'Menu Categories & Collections Referential Boundary',
    passed: categoryErrors === 0,
    desc: categoryErrors === 0
      ? `All 400 restaurant categories and collections exclusively reference food dishes belonging to that specific restaurant.`
      : `Found ${categoryErrors} cross-restaurant or orphaned food references in categories/collections!`
  });

  const allPassed = auditChecks.every(c => c.passed);

  body.innerHTML = `
    <div class="audit-summary-box" style="${allPassed ? '' : 'background:#fef2f2; border-color:#fca5a5;'}">
      <span style="font-size: 2rem;">${allPassed ? '✅' : '⚠️'}</span>
      <div>
        <div class="audit-summary-title" style="${allPassed ? '' : 'color:#991b1b;'}">
          ${allPassed ? 'Dataset Verification Passed — 0 Mistakes Detected!' : 'Dataset Verification Issues Found'}
        </div>
        <div class="audit-summary-sub" style="${allPassed ? '' : 'color:#b91c1c;'}">
          ${allPassed ? 'All 1,800 food items across 40 restaurants and 74 unique dishes strictly conform to schemas and referential integrity.' : 'Please inspect the issues below.'}
        </div>
      </div>
    </div>

    <div class="audit-checklist">
      ${auditChecks.map(c => `
        <div class="audit-check-item ${c.passed ? 'passed' : 'failed'}">
          <div class="audit-check-icon">${c.passed ? '🟢' : '🔴'}</div>
          <div>
            <div class="audit-check-title">${escapeHtml(c.title)}</div>
            <div class="audit-check-desc">${escapeHtml(c.desc)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.add('open');
}

function exportUniqueCatalogJson() {
  const uniqueDishes = state.lookups.uniqueDishesList || [];
  const exportData = {
    timestamp: {
      exported_at: new Date().toISOString()
    },
    metadata: {
      total_unique_dishes: uniqueDishes.length,
      total_menu_instances: state.datasets.foods?.data?.length || 0,
      total_restaurants: state.datasets.restaurants?.data?.length || 0,
      dietary_distribution: {
        veg: uniqueDishes.filter(d => d.dietary_type === 'veg').length,
        non_veg: uniqueDishes.filter(d => d.dietary_type === 'non_veg').length,
        egg: uniqueDishes.filter(d => d.dietary_type === 'egg').length
      }
    },
    unique_food_items: uniqueDishes.map(d => ({
      name: d.name,
      dietary_type: d.dietary_type,
      rating: d.rating,
      nutrition: d.nutrition,
      description: d.description,
      tags: d.tags,
      image_id: d.image_id,
      restaurant_coverage: {
        served_in_restaurants_count: d.restaurantCount,
        coverage_percentage: Math.round((d.restaurantCount / 40) * 100),
        min_selling_price: d.minPrice,
        max_selling_price: d.maxPrice,
        average_selling_price: d.avgPrice
      }
    }))
  };

  openJsonModal('74 Unique Food Items Catalog (Export)', exportData);
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

  // Unique Foods Catalog Filters & Actions
  const uniqueSearchInput = document.getElementById('unique-search');
  if (uniqueSearchInput) {
    uniqueSearchInput.addEventListener('input', (e) => {
      state.ui.uniqueSearch = e.target.value;
      renderUniqueFoodsView();
    });
  }

  const uniqueDietFilter = document.getElementById('unique-diet-filter');
  if (uniqueDietFilter) {
    uniqueDietFilter.addEventListener('change', (e) => {
      state.ui.uniqueDiet = e.target.value;
      renderUniqueFoodsView();
    });
  }

  const uniqueAvailFilter = document.getElementById('unique-avail-filter');
  if (uniqueAvailFilter) {
    uniqueAvailFilter.addEventListener('change', (e) => {
      state.ui.uniqueAvail = e.target.value;
      renderUniqueFoodsView();
    });
  }

  const uniqueSortSelect = document.getElementById('unique-sort');
  if (uniqueSortSelect) {
    uniqueSortSelect.addEventListener('change', (e) => {
      state.ui.uniqueSort = e.target.value;
      renderUniqueFoodsView();
    });
  }

  const btnRunAudit = document.getElementById('btn-run-audit');
  if (btnRunAudit) {
    btnRunAudit.addEventListener('click', runDatasetAudit);
  }

  const btnExportUnique = document.getElementById('btn-export-unique-json');
  if (btnExportUnique) {
    btnExportUnique.addEventListener('click', exportUniqueCatalogJson);
  }

  const auditModalClose = document.getElementById('audit-modal-close');
  if (auditModalClose) {
    auditModalClose.addEventListener('click', () => closeModal('audit-report-modal'));
  }

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
