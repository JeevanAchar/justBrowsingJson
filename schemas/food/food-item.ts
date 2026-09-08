import type { JsonDataset } from './dataset.js';

export type DietaryType = 'veg' | 'non_veg' | 'egg';

export interface NutritionInfo {
  calories: number;
}

export interface PricingTier {
  currency: string;
  base_price: number;
  selling_price: number;
}

export interface FoodItem {
  /** Unique UUID v4 identifier for the food item */
  id: string;
  /** UUID v4 of the parent restaurant */
  restaurant_id: string;
  /** Name of the food item */
  name: string;
  /** UUID v4 of the primary image in restaurant-images */
  image_id: string;
  /** Detailed culinary description of the dish */
  description: string;
  /** Average customer rating from 0.0 to 5.0 */
  rating: number;
  /** Dietary classification */
  dietary_type: DietaryType;
  /** Optional nutritional metrics */
  nutrition?: NutritionInfo;
  /** Pricing structures (base and discounted selling price) */
  pricing: PricingTier[];
  /** Search and filtering tags */
  tags: string[];
  /** Availability status */
  is_active: boolean;
}

export type FoodItemData = JsonDataset<FoodItem>;
