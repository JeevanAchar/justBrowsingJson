/**
 * Just Browsing - Food Static Data Access Layer
 * Designed for static hosting via GitHub Pages or static CDNs.
 * Compatible with modern browser fetch and Node 18+ environments.
 */

export const DATASET_PATHS = {
  restaurantImages: 'data/food/restaurant-images.json',
  foodItems: 'data/food/food-items.json',
  restaurants: 'data/food/restaurants.json'
};

export const DATASETS = {
  restaurantImages: './data/food/restaurant-images.json',
  foodItems: './data/food/food-items.json',
  restaurants: './data/food/restaurants.json'
};

let configBaseUrl = '';

/**
 * Configure the base URL for fetching static JSON datasets.
 * Useful when consuming data hosted on GitHub Pages or an external CDN.
 * Example: setBaseUrl('https://my-username.github.io/my-repo')
 *
 * @param {string} url - Base URL where the repository or static files are served
 */
export function setBaseUrl(url) {
  if (!url) {
    configBaseUrl = '';
    return;
  }
  configBaseUrl = url.endsWith('/') ? url : `${url}/`;
}

/**
 * Returns the currently configured base URL.
 * @returns {string}
 */
export function getBaseUrl() {
  return configBaseUrl;
}

/**
 * Resolves a dataset path against the configured or passed base URL.
 * @param {string} relativePath
 * @param {string} [customBaseUrl]
 * @returns {string}
 */
export function resolveDatasetUrl(relativePath, customBaseUrl) {
  const base = customBaseUrl !== undefined ? customBaseUrl : configBaseUrl;
  if (!base) {
    return relativePath.startsWith('/') ? `.${relativePath}` : relativePath;
  }
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relativePath.startsWith('./')
    ? relativePath.slice(2)
    : relativePath.startsWith('/')
      ? relativePath.slice(1)
      : relativePath;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Generic fetcher for static JSON dataset files.
 * @template T
 * @param {string} path - Path to dataset
 * @param {RequestInit & { baseUrl?: string }} [options] - Fetch and baseUrl options
 * @returns {Promise<{ timestamp: { updated_at: string }, data: T[] }>}
 */
async function fetchDataset(path, options = {}) {
  const { baseUrl, ...fetchOptions } = options;
  const url = resolveDatasetUrl(path, baseUrl);

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset from "${url}": ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Fetch the complete restaurants dataset (including timestamp metadata).
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<{ timestamp: { updated_at: string }, data: import('./schemas/food/restaurant.js').Restaurant[] }>}
 */
export async function getRestaurantsDataset(options) {
  return await fetchDataset(DATASETS.restaurants, options);
}

/**
 * Fetch all restaurants.
 * @param {RequestInit & { baseUrl?: string, raw?: boolean }} [options]
 * @returns {Promise<import('./schemas/food/restaurant.js').Restaurant[]>}
 */
export async function getRestaurants(options) {
  const dataset = await getRestaurantsDataset(options);
  return options?.raw ? dataset : dataset.data;
}

/**
 * Fetch the complete food items dataset (including timestamp metadata).
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<{ timestamp: { updated_at: string }, data: import('./schemas/food/food-item.js').FoodItem[] }>}
 */
export async function getFoodItemsDataset(options) {
  return await fetchDataset(DATASETS.foodItems, options);
}

/**
 * Fetch all food items.
 * @param {RequestInit & { baseUrl?: string, raw?: boolean }} [options]
 * @returns {Promise<import('./schemas/food/food-item.js').FoodItem[]>}
 */
export async function getFoodItems(options) {
  const dataset = await getFoodItemsDataset(options);
  return options?.raw ? dataset : dataset.data;
}

/**
 * Fetch the complete restaurant images dataset (including timestamp metadata).
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<{ timestamp: { updated_at: string }, data: import('./schemas/food/restaurant-image.js').RestaurantImage[] }>}
 */
export async function getRestaurantImagesDataset(options) {
  return await fetchDataset(DATASETS.restaurantImages, options);
}

/**
 * Fetch all restaurant images.
 * @param {RequestInit & { baseUrl?: string, raw?: boolean }} [options]
 * @returns {Promise<import('./schemas/food/restaurant-image.js').RestaurantImage[]>}
 */
export async function getRestaurantImages(options) {
  const dataset = await getRestaurantImagesDataset(options);
  return options?.raw ? dataset : dataset.data;
}

/**
 * Fetch a single restaurant by its UUID.
 * @param {string} id - UUID of restaurant
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<import('./schemas/food/restaurant.js').Restaurant | null>}
 */
export async function getRestaurantById(id, options) {
  const restaurants = await getRestaurants(options);
  return restaurants.find(r => r.id === id) || null;
}

/**
 * Fetch all food items belonging to a specific restaurant.
 * @param {string} restaurantId - UUID of restaurant
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<import('./schemas/food/food-item.js').FoodItem[]>}
 */
export async function getFoodByRestaurantId(restaurantId, options) {
  const foods = await getFoodItems(options);
  return foods.filter(f => f.restaurant_id === restaurantId);
}

/**
 * Fetch a single food item by its UUID.
 * @param {string} id - UUID of food item
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<import('./schemas/food/food-item.js').FoodItem | null>}
 */
export async function getFoodItemById(id, options) {
  const foods = await getFoodItems(options);
  return foods.find(f => f.id === id) || null;
}

/**
 * Fetch a single restaurant image by its UUID.
 * @param {string} id - UUID of image
 * @param {RequestInit & { baseUrl?: string }} [options]
 * @returns {Promise<import('./schemas/food/restaurant-image.js').RestaurantImage | null>}
 */
export async function getImageById(id, options) {
  const images = await getRestaurantImages(options);
  return images.find(img => img.id === id) || null;
}
