import type { GalleryItemRecord } from '@/lib/storefront-content';

export type Lang = 'en' | 'fr' | 'es';
export type ContactPreference = 'WhatsApp' | 'Phone' | 'Email';

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  km: number;
  fuel: string;
  body: string;
  location: string;
  image: string;
  images?: string[];
  badge: string;
  color?: string;
  transmission?: string;
  drivetrain?: string;
  doors?: number;
  seats?: number;
  hidden?: boolean;
  sample?: boolean;
  origin?: 'local' | 'abroad';
  country?: string;
  city?: string;
  importRegion?: 'Europe' | 'Asia' | 'America';
  engineLitres?: number;
  sellerType?: 'Dealer' | 'Private';
  verified?: boolean;
  available?: boolean;
  listedDaysAgo?: number;
  rentable?: boolean;
  dailyRate?: number;
};

export type UserAccount = {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  preferredContact?: ContactPreference;
  preferredLanguage?: Lang;
};

export type PartRequest = {
  id: string;
  vehicle: string;
  part: string;
  condition: string;
  delivery: string;
  details: string;
  status: 'Open' | 'In progress' | 'Complete';
};

export type SellerInquiry = {
  id: string;
  carId: number;
  customer: string;
  phone: string;
  message: string;
};

export type SellRequest = {
  id: string;
  car: Car;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt?: string;
};

export type GalleryItem = GalleryItemRecord;

export type StorefrontLocaleContent = {
  headline: string;
  description: string;
  galleryTitle?: string;
  galleryDescription?: string;
};

export type StorefrontContent = Partial<
  Record<Lang, StorefrontLocaleContent>
> & {
  gallery?: GalleryItem[];
  heroVideo?: string;
};

export type AuthSession = {
  authenticated: boolean;
  isAdmin: boolean;
  user: UserAccount | null;
};

export type OrderItem = {
  carId: number;
  vehicle: string;
  kind: 'buy' | 'rent';
  amount: number;
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: number;
  pickup?: string;
};

export type OrderRecord = {
  id: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};
