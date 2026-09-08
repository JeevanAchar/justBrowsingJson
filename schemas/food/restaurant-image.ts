import type { JsonDataset } from './dataset.js';

export type ImageType = 'food' | 'restaurant' | 'ambience' | 'banner';

export interface RestaurantImage {
  /** Unique UUID v4 identifier for the image */
  id: string;
  /** Publicly accessible HTTPS URL pointing to the image */
  image_url: string;
  /** Concise description of what is depicted in the image */
  description: string;
  /** Category type of image */
  type: ImageType;
  /** Optional tags associated with the image */
  tags?: string[];
}

export type RestaurantImageData = JsonDataset<RestaurantImage>;
