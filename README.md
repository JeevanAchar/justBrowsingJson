# Just Browsing — Food Static Data Layer

A high-performance, static JSON-based data repository designed for the **Just Browsing** food platform. This repository provides rich, production-grade datasets for restaurants, menu categories, collections, food items, and image assets configured for direct hosting and consumption via **GitHub Pages** or static CDN hosting.

All datasets are stored directly as standalone JSON files. Zero backend, zero database, and zero server-side runtimes required.

---

## 📁 Repository Structure

```text
├── data/
│   └── food/
│       ├── restaurant-images.json    # Reusable image catalog with direct CDN links and metadata
│       ├── food-items.json           # 1,800 food items with pricing, nutrition, and dietary types
│       └── restaurants.json          # 40 restaurants with locations, categories, and collections
├── schemas/
│   └── food/
│       ├── dataset.ts                # Generic JsonDataset<T> wrapper with timestamp metadata
│       ├── restaurant-image.ts       # RestaurantImage & RestaurantImageData types
│       ├── food-item.ts              # FoodItem, DietaryType, PricingTier types
│       ├── restaurant.ts             # Restaurant, MenuCategory, RestaurantCollection types
│       └── index.ts                  # Barrel re-export for all food schemas
├── scripts/
│   └── validate-data.js              # Comprehensive referential and integrity validator
├── index.js                          # Universal ES module entry point & browser fetch helpers
├── package.json                      # Project metadata & validation scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Documentation & usage guide
```

---

## 📊 Available Datasets

All datasets follow the unified dataset wrapper schema with a file-level timestamp:

```json
{
  "timestamp": {
    "updated_at": "2026-09-08T03:15:42.000Z"
  },
  "data": [ ... ]
}
```

### 1. `data/food/restaurants.json`
Contains **40** iconic restaurants across major culinary hubs of India (Hyderabad, New Delhi, Bengaluru, Mumbai, Kolkata, Chennai, Lucknow, Goa, Ahmedabad).

- **Total Records:** 40
- **Structure:** Each restaurant contains 6 menu categories and 4 collections (10 groupings total).
- **Fields:** `id`, `name`, `description`, `rating`, `total_orders`, `location`, `delivery_time`, `cuisines`, `menu_categories`, `collections`, `disclaimer`, `is_active`

### 2. `data/food/food-items.json`
Contains **1,800** curated food dishes (exactly 45 items per restaurant, strictly satisfying the 40–60 item constraint).

- **Total Records:** 1,800
- **Fields:** `id`, `restaurant_id`, `name`, `image_id`, `description`, `rating`, `dietary_type`, `nutrition`, `pricing`, `tags`, `is_active`

### 3. `data/food/restaurant-images.json`
Contains **113** reusable, high-resolution Unsplash CDN images (40 restaurant banner photos + 73 distinct culinary dish photos).

- **Total Records:** 113
- **Fields:** `id`, `image_url`, `description`, `type`, `tags`
- **Reusability:** Food items reference appropriate image assets from this catalog, optimizing storage and client cache efficiency.

---

## 🌐 GitHub Pages URL Examples

When deployed to GitHub Pages, datasets can be accessed directly via HTTP GET:

```text
https://<username>.github.io/<repository>/data/food/restaurants.json
https://<username>.github.io/<repository>/data/food/food-items.json
https://<username>.github.io/<repository>/data/food/restaurant-images.json
```

---

## ⏱️ Timestamp Specification

- Timestamps are maintained **at the JSON file level**, located in the root `timestamp` object.
- **Format:** Strict UTC ISO-8601 with milliseconds: `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g. `2026-09-08T03:15:42.000Z`).
- The `Z` suffix is mandatory and indicates UTC.
- Individual records do **not** contain `updated_at`.
- Frontend applications can compare `timestamp.updated_at` against cached timestamps to determine whether to invalidate local caches.

---

## 🔗 Relational Architecture

The datasets maintain strict referential integrity resembling a relational schema:

```text
+-----------------------+
|  RestaurantImage      |
|  (restaurant-images)  |
+-----------------------+
            ▲
            │ image_id (reusable across dishes)
            │
+-----------------------+           +----------------------+
|  FoodItem             |           |  Restaurant          |
|  (food-items)         |           |  (restaurants)       |
+-----------------------+           +----------------------+
| id                    |           | id                   |
| restaurant_id  ───────┼──────────►|                      |
| image_id              |           | menu_categories[].   |
| name, pricing, etc.   |           |   food_ids[] ────────┼───┐
+-----------------------+           | collections[].       |   │
            ▲                       |   food_ids[] ────────┼───┤
            │                       +----------------------+   │
            └──────────────────────────────────────────────────┘
                 (Must only reference food items belonging
                   to the same restaurant)
```

1. **`food.restaurant_id`** strictly references a valid restaurant `id` in `restaurants.json`.
2. **`food.image_id`** strictly references a valid image `id` in `restaurant-images.json`.
3. **`restaurant.menu_categories[].food_ids`** contains only food IDs belonging to that specific restaurant.
4. **`restaurant.collections[].food_ids`** contains only food IDs belonging to that specific restaurant.
5. All IDs are globally distinct **UUID v4** strings.

---

## 💻 Frontend Consumption

### Option A: Direct `fetch` API

```javascript
// Fetch restaurants
const res = await fetch(
  'https://<username>.github.io/<repository>/data/food/restaurants.json'
);
const { timestamp, data: restaurants } = await res.json();

console.log(`Last updated: ${timestamp.updated_at}`);
console.log(`Loaded ${restaurants.length} restaurants`);
```

### Option B: Using `index.js` Helper Functions

```javascript
import {
  setBaseUrl,
  getRestaurants,
  getFoodByRestaurantId,
  getRestaurantById
} from './index.js';

// Configure base URL (optional, defaults to relative paths)
setBaseUrl('https://<username>.github.io/<repository>');

// Fetch all restaurants
const restaurants = await getRestaurants();

// Fetch specific restaurant
const restaurant = await getRestaurantById(restaurants[0].id);

// Fetch menu items for restaurant
const menuItems = await getFoodByRestaurantId(restaurant.id);
```

---

## 🔍 Validation

Run the automated integrity test to verify all UUIDs, timestamps, and relational foreign keys:

```bash
npm test
```

Or directly via Node.js:

```bash
node scripts/validate-data.js
```

The validation suite verifies:
- File-level `timestamp.updated_at` exists and matches UTC ISO-8601 format.
- No forbidden `updated_at` properties exist on individual records.
- Every `id` is a valid UUID v4 without duplicates across entities.
- Target volume: 40 restaurants, 40–60 food items per restaurant, ~10 category/collection groupings per restaurant.
- Every `restaurant_id` in food items exists in `restaurants.json`.
- Every `image_id` in food items exists in `restaurant-images.json`.
- Category and collection `food_ids` point exclusively to foods owned by that restaurant.
- Pricing rules: `selling_price <= base_price` and both are $\ge 0$.
- Rating ranges: $0.0 \le \text{rating} \le 5.0$.
- Dietary types conform to `'veg' | 'non_veg' | 'egg'`.
- Image types conform to `'food' | 'restaurant' | 'ambience' | 'banner'`.
