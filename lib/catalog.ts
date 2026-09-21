import { ensureNormalizedData, readVehicles } from '@/lib/marketplace-store';

export type ServerCatalogCar = {
  id: number;
  make: string;
  model: string;
  price: number;
  hidden?: boolean;
  available?: boolean;
  origin?: 'local' | 'abroad';
  city?: string;
  location?: string;
  rentable?: boolean;
  dailyRate?: number;
};

export async function loadServerCatalog(db: D1Database) {
  await ensureNormalizedData(db);
  return readVehicles(db, true);
}
