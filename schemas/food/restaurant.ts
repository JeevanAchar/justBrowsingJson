import type { JsonDataset } from './dataset.js';

export interface MenuCategory {
  /** Unique UUID v4 identifier for the category */
  id: string;
  /** Display name of category, e.g. "Starters", "Main Course" */
  name: string;
  /** Array of UUIDs of food items belonging to this restaurant and category */
  food_ids: string[];
}

export interface RestaurantCollection {
  /** Unique UUID v4 identifier for the collection */
  id: string;
  /** Name of collection, e.g. "Recommended", "Bestsellers" */
  name: string;
  /** Array of UUIDs of food items belonging to this restaurant in this collection */
  food_ids: string[];
}

export interface RestaurantLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface DeliveryTimeRange {
  min: number;
  max: number;
}

export interface Restaurant {
  /** Unique UUID v4 identifier for the restaurant */
  id: string;
  /** Restaurant display name */
  name: string;
  /** Detailed description of restaurant and specialties */
  description: string;
  /** Overall rating between 0.0 and 5.0 */
  rating: number;
  /** Historical count of completed orders */
  total_orders: number;
  /** Physical location details or null for virtual/cloud kitchens */
  location: RestaurantLocation | null;
  /** Delivery time duration estimate in minutes */
  delivery_time: DeliveryTimeRange;
  /** List of cuisine tags */
  cuisines: string[];
  /** Grouped menu sections */
  menu_categories: MenuCategory[];
  /** Curated food collections */
  collections: RestaurantCollection[];
  /** Legal or presentation disclaimer */
  disclaimer: string;
  /** Current operating status */
  is_active: boolean;
}

export type RestaurantData = JsonDataset<Restaurant>;
