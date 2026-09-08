# Just Browsing — Food Static Data Layer

A high-performance, static JSON-based data repository designed for the **Just Browsing** food platform. This repository provides rich, production-grade datasets for restaurants, menu categories, collections, food items, and image assets configured for direct hosting and consumption via **GitHub Pages** or static CDN hosting.

All datasets are stored directly as standalone JSON files. Zero backend, zero database, and zero server-side runtimes required.

---

## 📁 Repository Structure

```text
├── index.html                        # GitHub Pages static explorer & consumer verifier UI
├── app.css                           # Modern, minimal responsive styling
├── app.js                            # Dataset cross-referencing & interactive consumer preview
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
│   ├── validate-data.js              # Comprehensive referential and integrity validator
│   └── serve.js                      # Zero-dependency local preview HTTP server
├── index.js                          # Universal ES module entry point & browser fetch helpers
├── package.json                      # Project metadata & validation scripts
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Documentation & usage guide
```

---

## 🖥️ Interactive List View & Consumer Image Verification Explorer

A zero-build, responsive **List View** UI is included to directly visualize and verify all 3 blocks of JSON and inspect how images, menus, pricing, and dietary badges render from a consumer perspective.

- **GitHub Pages Ready:** Deploys statically with zero server configuration. Just push to GitHub and enable Pages on the repository root.
- **Local Preview:**
  ```bash
  npm start
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Key Explorer Features:
1. 🏪 **Block 1: Restaurants List View (`restaurants.json`):**
   - Clean horizontal list rows displaying banner image preview, restaurant name, cuisines chips, rating (★), delivery time, total orders, and address.
   - **Expandable Menu Sublist:** Click `▼ View Menu (45 Dishes)` on any restaurant row to expand its full menu right inside the list, displaying each dish's photo, dietary marker (🟢 Veg / 🔴 Non-Veg / 🟡 Egg), price, discount, calories, and image verification link.
2. 🍛 **Block 2: Food Items List View (`food-items.json`):**
   - Full-width list view of all **1,800 curated dishes** with high-resolution food thumbnails resolved from `restaurant-images.json`.
   - Displays dish name, parent restaurant link, pricing (with discount badges), calories, ratings, tags, and clickable image UUID chips.
   - Fast pagination (25, 50, or 100 per page) and instant search across name, ingredients, and tags.
3. 📸 **Block 3: Image Catalog List View (`restaurant-images.json`):**
   - List view of all **113 curated Unsplash CDN assets** (40 banners + 73 dish photos).
   - Live resolution and CDN health verifier (`naturalWidth` × `naturalHeight` detection).
   - Click `🔍 Verify Zoom` to inspect full-resolution assets in a lightbox modal.
   - Reverse-usage lookup: click `🍲 View Dishes` on any food image to see the list of dishes utilizing that photo.
4. 🔍 **Raw JSON Inspector:**
   - In-browser formatted view of any of the 3 datasets with instant line search, 1-click clipboard copy, and file download.

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
