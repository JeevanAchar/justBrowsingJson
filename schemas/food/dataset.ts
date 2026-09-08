/**
 * Standard wrapper for all static JSON datasets in the Just Browsing platform.
 * Contains file-level timestamp metadata for caching/invalidation alongside the records.
 */
export interface DatasetTimestamp {
  /** UTC timestamp in ISO-8601 format: YYYY-MM-DDTHH:mm:ss.sssZ */
  updated_at: string;
}

export interface JsonDataset<T> {
  timestamp: DatasetTimestamp;
  data: T[];
}
