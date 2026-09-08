import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data', 'food');

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UTC_ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const VALID_DIETARY_TYPES = new Set(['veg', 'non_veg', 'egg']);
const VALID_IMAGE_TYPES = new Set(['food', 'restaurant', 'ambience', 'banner']);

function runValidation() {
  console.log('Starting validation of static food datasets...\n');

  const errors = [];
  const warnings = [];

  const imagesFile = path.join(dataDir, 'restaurant-images.json');
  const foodsFile = path.join(dataDir, 'food-items.json');
  const restaurantsFile = path.join(dataDir, 'restaurants.json');

  // 1. Check file existence
  [imagesFile, foodsFile, restaurantsFile].forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing required dataset file: ${filePath}`);
    }
  });

  if (errors.length > 0) {
    reportResults(errors, warnings);
    process.exit(1);
  }

  // 2. Parse JSON
  let imagesDataset, foodsDataset, restaurantsDataset;
  try {
    imagesDataset = JSON.parse(fs.readFileSync(imagesFile, 'utf-8'));
    foodsDataset = JSON.parse(fs.readFileSync(foodsFile, 'utf-8'));
    restaurantsDataset = JSON.parse(fs.readFileSync(restaurantsFile, 'utf-8'));
  } catch (err) {
    errors.push(`Failed to parse JSON file: ${err.message}`);
    reportResults(errors, warnings);
    process.exit(1);
  }

  const datasets = [
    { name: 'restaurant-images.json', dataset: imagesDataset },
    { name: 'food-items.json', dataset: foodsDataset },
    { name: 'restaurants.json', dataset: restaurantsDataset }
  ];

  // 3. Validate top-level wrapper structure & timestamps
  datasets.forEach(({ name, dataset }) => {
    if (!dataset || typeof dataset !== 'object') {
      errors.push(`[${name}] Root must be an object.`);
      return;
    }

    if (!dataset.timestamp || typeof dataset.timestamp !== 'object') {
      errors.push(`[${name}] Missing top-level "timestamp" object.`);
    } else {
      const { updated_at } = dataset.timestamp;
      if (!updated_at) {
        errors.push(`[${name}] timestamp.updated_at is missing.`);
      } else if (!UTC_ISO_8601_REGEX.test(updated_at)) {
        errors.push(`[${name}] timestamp.updated_at "${updated_at}" is not a valid UTC ISO-8601 string (expected format: YYYY-MM-DDTHH:mm:ss.sssZ).`);
      } else if (isNaN(Date.parse(updated_at))) {
        errors.push(`[${name}] timestamp.updated_at "${updated_at}" is an invalid date.`);
      }
    }

    if (!Array.isArray(dataset.data)) {
      errors.push(`[${name}] Missing top-level "data" array.`);
    }
  });

  if (errors.length > 0) {
    reportResults(errors, warnings);
    process.exit(1);
  }

  const images = imagesDataset.data;
  const foodItems = foodsDataset.data;
  const restaurants = restaurantsDataset.data;

  // 4. Validate counts
  console.log(`Summary of records:`);
  console.log(`- Restaurants: ${restaurants.length} (Target: ~40)`);
  console.log(`- Food Items:  ${foodItems.length} (Target: 40-60 per restaurant)`);
  console.log(`- Images:      ${images.length} (Reusable catalog)\n`);

  if (restaurants.length < 35 || restaurants.length > 45) {
    errors.push(`Restaurant count (${restaurants.length}) outside expected ~40 range.`);
  }
  if (foodItems.length < 1400 || foodItems.length > 2500) {
    errors.push(`Total food items count (${foodItems.length}) outside expected range for 40 restaurants with 40-60 items each.`);
  }

  // Set for global UUID uniqueness
  const globalUuids = new Map();

  function trackUuid(id, entityType, entityLabel) {
    if (!id || typeof id !== 'string') {
      errors.push(`[${entityType}] Missing or non-string ID on ${entityLabel}`);
      return;
    }
    if (!UUID_V4_REGEX.test(id)) {
      errors.push(`[${entityType}] ID "${id}" on "${entityLabel}" is not a valid UUID v4.`);
    }
    if (globalUuids.has(id)) {
      errors.push(`[Duplicate ID] UUID "${id}" used by both "${globalUuids.get(id)}" and "${entityType}: ${entityLabel}".`);
    } else {
      globalUuids.set(id, `${entityType}: ${entityLabel}`);
    }
  }

  // 5. Validate Restaurant Images
  const imageIdMap = new Map();
  images.forEach((img, idx) => {
    const label = img.description ? `Image #${idx} (${img.description.slice(0, 30)}...)` : `Image #${idx}`;
    trackUuid(img.id, 'Image', label);

    if (img.id) {
      imageIdMap.set(img.id, img);
    }

    // Check individual updated_at restriction
    if ('updated_at' in img) {
      errors.push(`[Image] Record ${img.id} should NOT contain "updated_at". File-level timestamp must be used.`);
    }

    if (!img.image_url || typeof img.image_url !== 'string' || !img.image_url.startsWith('https://')) {
      errors.push(`[Image] Invalid or non-HTTPS image_url: "${img.image_url}" for ${label}`);
    }

    if (!img.description || typeof img.description !== 'string' || img.description.trim().length === 0) {
      errors.push(`[Image] Missing or empty description for ${label}`);
    }

    if (!VALID_IMAGE_TYPES.has(img.type)) {
      errors.push(`[Image] Invalid image type "${img.type}" on ${label}. Allowed: ${Array.from(VALID_IMAGE_TYPES).join(', ')}`);
    }

    if (img.tags !== undefined && !Array.isArray(img.tags)) {
      errors.push(`[Image] "tags" must be an array for ${label}`);
    }
  });

  // 6. Validate Restaurants
  const restaurantIdMap = new Map();
  restaurants.forEach((r, idx) => {
    const label = `Restaurant "${r.name || 'Unnamed'}" (#${idx})`;
    trackUuid(r.id, 'Restaurant', label);

    if (r.id) {
      restaurantIdMap.set(r.id, r);
    }

    // Check individual updated_at restriction
    if ('updated_at' in r) {
      errors.push(`[Restaurant] Record ${r.id} should NOT contain "updated_at". File-level timestamp must be used.`);
    }

    if (!r.name || typeof r.name !== 'string' || r.name.trim().length === 0) {
      errors.push(`[Restaurant] Missing name on ${label}`);
    }

    if (!r.description || typeof r.description !== 'string') {
      errors.push(`[Restaurant] Missing description on ${label}`);
    }

    if (typeof r.rating !== 'number' || r.rating < 0 || r.rating > 5) {
      errors.push(`[Restaurant] Rating must be between 0 and 5, found ${r.rating} on ${label}`);
    }

    if (typeof r.total_orders !== 'number' || r.total_orders < 0) {
      errors.push(`[Restaurant] total_orders must be >= 0, found ${r.total_orders} on ${label}`);
    }

    if (r.location !== null) {
      if (typeof r.location !== 'object') {
        errors.push(`[Restaurant] location must be an object or null on ${label}`);
      } else {
        const { address, city, state, country, pincode, latitude, longitude } = r.location;
        if (!address || !city || !state || !country || !pincode) {
          errors.push(`[Restaurant] Missing address fields in location on ${label}`);
        }
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
          errors.push(`[Restaurant] Coordinates (lat, lng) must be numbers on ${label}`);
        }
      }
    }

    if (!r.delivery_time || typeof r.delivery_time !== 'object') {
      errors.push(`[Restaurant] Missing delivery_time on ${label}`);
    } else {
      const { min, max } = r.delivery_time;
      if (typeof min !== 'number' || typeof max !== 'number' || min < 0 || max < 0) {
        errors.push(`[Restaurant] delivery_time min and max must be non-negative numbers on ${label}`);
      } else if (min > max) {
        errors.push(`[Restaurant] delivery_time min (${min}) cannot exceed max (${max}) on ${label}`);
      }
    }

    if (!Array.isArray(r.cuisines) || r.cuisines.length === 0) {
      errors.push(`[Restaurant] cuisines must be a non-empty array on ${label}`);
    }

    if (!Array.isArray(r.menu_categories) || r.menu_categories.length < 2) {
      errors.push(`[Restaurant] Must have multiple menu_categories on ${label}`);
    } else {
      r.menu_categories.forEach((cat, cIdx) => {
        trackUuid(cat.id, 'MenuCategory', `${label} -> Category "${cat.name || cIdx}"`);
        if (!cat.name || typeof cat.name !== 'string') {
          errors.push(`[Restaurant] Menu category missing name on ${label}`);
        }
        if (!Array.isArray(cat.food_ids) || cat.food_ids.length === 0) {
          errors.push(`[Restaurant] Category "${cat.name}" has no food items on ${label}`);
        }
      });
    }

    if (!Array.isArray(r.collections) || r.collections.length < 2) {
      errors.push(`[Restaurant] Must have multiple collections on ${label}`);
    } else {
      r.collections.forEach((col, cIdx) => {
        trackUuid(col.id, 'RestaurantCollection', `${label} -> Collection "${col.name || cIdx}"`);
        if (!col.name || typeof col.name !== 'string') {
          errors.push(`[Restaurant] Collection missing name on ${label}`);
        }
        if (!Array.isArray(col.food_ids) || col.food_ids.length === 0) {
          errors.push(`[Restaurant] Collection "${col.name}" has no food items on ${label}`);
        }
      });
    }

    if (typeof r.disclaimer !== 'string' || r.disclaimer.trim().length === 0) {
      errors.push(`[Restaurant] Missing disclaimer on ${label}`);
    }

    if (typeof r.is_active !== 'boolean') {
      errors.push(`[Restaurant] is_active must be boolean on ${label}`);
    }
  });

  // 7. Validate Food Items
  const foodIdMap = new Map();
  const restaurantFoodCounts = new Map();

  foodItems.forEach((food, idx) => {
    const label = `FoodItem "${food.name || 'Unnamed'}" (#${idx})`;
    trackUuid(food.id, 'FoodItem', label);

    if (food.id) {
      foodIdMap.set(food.id, food);
    }

    // Check individual updated_at restriction
    if ('updated_at' in food) {
      errors.push(`[FoodItem] Record ${food.id} should NOT contain "updated_at". File-level timestamp must be used.`);
    }

    if (!food.name || typeof food.name !== 'string' || food.name.trim().length === 0) {
      errors.push(`[FoodItem] Missing name on ${label}`);
    }

    if (!food.description || typeof food.description !== 'string') {
      errors.push(`[FoodItem] Missing description on ${label}`);
    }

    // Check restaurant_id foreign key
    if (!food.restaurant_id || !restaurantIdMap.has(food.restaurant_id)) {
      errors.push(`[FoodItem] Foreign Key Error: restaurant_id "${food.restaurant_id}" not found in restaurants.json for ${label}`);
    } else {
      restaurantFoodCounts.set(food.restaurant_id, (restaurantFoodCounts.get(food.restaurant_id) || 0) + 1);
    }

    // Check image_id foreign key
    if (!food.image_id || !imageIdMap.has(food.image_id)) {
      errors.push(`[FoodItem] Foreign Key Error: image_id "${food.image_id}" not found in restaurant-images.json for ${label}`);
    }

    if (typeof food.rating !== 'number' || food.rating < 0 || food.rating > 5) {
      errors.push(`[FoodItem] Rating must be between 0 and 5, found ${food.rating} on ${label}`);
    }

    if (!VALID_DIETARY_TYPES.has(food.dietary_type)) {
      errors.push(`[FoodItem] Invalid dietary_type "${food.dietary_type}" on ${label}. Allowed: veg, non_veg, egg`);
    }

    if (food.nutrition) {
      if (typeof food.nutrition.calories !== 'number' || food.nutrition.calories < 0) {
        errors.push(`[FoodItem] Nutrition calories must be non-negative number on ${label}`);
      }
    }

    if (!Array.isArray(food.pricing) || food.pricing.length === 0) {
      errors.push(`[FoodItem] pricing must be a non-empty array on ${label}`);
    } else {
      food.pricing.forEach((tier, pIdx) => {
        if (!tier.currency || typeof tier.currency !== 'string') {
          errors.push(`[FoodItem] Missing pricing currency on ${label} [tier ${pIdx}]`);
        }
        if (typeof tier.base_price !== 'number' || tier.base_price < 0) {
          errors.push(`[FoodItem] base_price must be >= 0 on ${label} [tier ${pIdx}]`);
        }
        if (typeof tier.selling_price !== 'number' || tier.selling_price < 0) {
          errors.push(`[FoodItem] selling_price must be >= 0 on ${label} [tier ${pIdx}]`);
        }
        if (tier.selling_price > tier.base_price) {
          errors.push(`[FoodItem] selling_price (${tier.selling_price}) cannot exceed base_price (${tier.base_price}) on ${label} [tier ${pIdx}]`);
        }
      });
    }

    if (!Array.isArray(food.tags)) {
      errors.push(`[FoodItem] tags must be an array on ${label}`);
    }

    if (typeof food.is_active !== 'boolean') {
      errors.push(`[FoodItem] is_active must be boolean on ${label}`);
    }
  });

  // 8. Referential integrity: Every restaurant must have minimum 40 and maximum 60 food records
  restaurants.forEach(r => {
    const count = restaurantFoodCounts.get(r.id) || 0;
    if (count < 40 || count > 60) {
      errors.push(`[Food Count] Restaurant "${r.name}" (${r.id}) has ${count} food items (Required: between 40 and 60).`);
    }

    const totalGroupings = (r.menu_categories ? r.menu_categories.length : 0) + (r.collections ? r.collections.length : 0);
    if (totalGroupings < 8 || totalGroupings > 12) {
      warnings.push(`[Groupings] Restaurant "${r.name}" has ${totalGroupings} total categoryNames/collectionNames (Target: around 10).`);
    }
  });

  // 9. Referential integrity: Menu categories and collections food_ids
  restaurants.forEach(r => {
    r.menu_categories.forEach(cat => {
      cat.food_ids.forEach(foodId => {
        const food = foodIdMap.get(foodId);
        if (!food) {
          errors.push(`[Referential Integrity] Category "${cat.name}" in restaurant "${r.name}" references non-existent foodId "${foodId}"`);
        } else if (food.restaurant_id !== r.id) {
          errors.push(`[Cross-Restaurant Leak] Category "${cat.name}" in restaurant "${r.name}" (${r.id}) references food "${food.name}" belonging to different restaurant (${food.restaurant_id})`);
        }
      });
    });

    r.collections.forEach(col => {
      col.food_ids.forEach(foodId => {
        const food = foodIdMap.get(foodId);
        if (!food) {
          errors.push(`[Referential Integrity] Collection "${col.name}" in restaurant "${r.name}" references non-existent foodId "${foodId}"`);
        } else if (food.restaurant_id !== r.id) {
          errors.push(`[Cross-Restaurant Leak] Collection "${col.name}" in restaurant "${r.name}" (${r.id}) references food "${food.name}" belonging to different restaurant (${food.restaurant_id})`);
        }
      });
    });
  });

  reportResults(errors, warnings);

  if (errors.length > 0) {
    process.exit(1);
  }
}

function reportResults(errors, warnings) {
  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => console.warn(`- ⚠️ ${w}`));
  }

  if (errors.length > 0) {
    console.error(`\nValidation FAILED with ${errors.length} error(s):`);
    errors.forEach(e => console.error(`- ❌ ${e}`));
  } else {
    console.log('✅ All validation checks passed successfully!');
    console.log('  - All UUIDs are valid UUID v4 and globally unique.');
    console.log('  - Referential integrity strictly enforced (foreign keys, cross-restaurant checks).');
    console.log('  - Timestamps conform to UTC ISO-8601 YYYY-MM-DDTHH:mm:ss.sssZ.');
    console.log('  - No individual record updated_at leaks.');
    console.log('  - Pricing, ratings, dietary types, delivery times, and image types validated.');
  }
}

runValidation();
