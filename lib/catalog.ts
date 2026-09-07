import { parseJson } from '@/lib/site-db';

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

export const seedCatalog: ServerCatalogCar[] = [
  {
    id: 1,
    make: 'Volvo',
    model: 'XC40 Recharge',
    price: 25_500_000,
    origin: 'local',
    city: 'Brazzaville',
    rentable: true,
    dailyRate: 45_000,
  },
  {
    id: 2,
    make: 'BMW',
    model: '330e M Sport',
    price: 23_200_000,
    origin: 'local',
    city: 'Pointe-Noire',
    rentable: true,
    dailyRate: 55_000,
  },
  { id: 3, make: 'Mercedes-Benz', model: 'AMG GT', price: 20_900_000 },
  {
    id: 4,
    make: 'Peugeot',
    model: 'e-208 GT',
    price: 16_200_000,
    origin: 'local',
    city: 'Douala',
    rentable: true,
    dailyRate: 35_000,
  },
  { id: 5, make: 'Audi', model: 'A4 Avant', price: 18_800_000 },
  { id: 6, make: 'Tesla', model: 'Model 3 Long Range', price: 21_600_000 },
  {
    id: 7,
    make: 'Toyota',
    model: 'Hilux 2.8 D-4D',
    price: 19_800_000,
    origin: 'local',
    city: 'Cabinda',
    rentable: true,
    dailyRate: 50_000,
  },
  {
    id: 8,
    make: 'Honda',
    model: 'CR-V Executive',
    price: 17_400_000,
    origin: 'local',
    city: 'Kinshasa',
    rentable: true,
    dailyRate: 42_000,
  },
];

export async function loadServerCatalog(db: D1Database) {
  const row = await db
    .prepare(`SELECT inventory FROM marketplace_state WHERE id = 1`)
    .first<{ inventory: string | null }>();
  const stored = parseJson<ServerCatalogCar[] | null>(
    row?.inventory ?? null,
    null,
  );
  return Array.isArray(stored) && stored.length ? stored : seedCatalog;
}
