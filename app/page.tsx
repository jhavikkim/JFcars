'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDot,
  Cog,
  Eye,
  EyeOff,
  GitCompareArrows,
  Heart,
  KeyRound,
  Languages,
  LogOut,
  MapPin,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
type Lang = 'en' | 'fr' | 'es';
type Car = {
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
type UserAccount = { name: string; email: string };
type PartRequest = {
  id: string;
  vehicle: string;
  part: string;
  condition: string;
  delivery: string;
  details: string;
  status: 'Open' | 'In progress' | 'Complete';
};
type SellerInquiry = {
  id: string;
  carId: number;
  customer: string;
  phone: string;
  message: string;
};
type SellRequest = {
  id: string;
  car: Car;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt?: string;
};
type StorefrontLocaleContent = { headline: string; description: string };
type StorefrontContent = Partial<Record<Lang, StorefrontLocaleContent>>;
type AuthSession = {
  authenticated: boolean;
  isAdmin: boolean;
  user: UserAccount | null;
};
type OrderItem = {
  carId: number;
  vehicle: string;
  kind: 'buy' | 'rent';
  amount: number;
  rentalStart?: string;
  rentalEnd?: string;
  rentalDays?: number;
  pickup?: string;
};
type OrderRecord = {
  id: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
};
const copy = {
  en: {
    buy: 'Buy',
    sell: 'Sell your car',
    saved: 'Saved',
    hero: 'Find a car that feels right.',
    sub: 'Good cars, clear details, zero pressure.',
    search: 'Search make, model or keyword',
    go: 'Search',
    filters: 'Filters',
    results: 'cars found',
    sort: 'Sort: Recommended',
    price: 'Price',
    body: 'Body type',
    fuel: 'Fuel',
    year: 'Year',
    any: 'Any',
    reset: 'Reset',
    compare: 'Compare',
    view: 'View car',
    monthly: 'est. / month',
    trusted: 'Verified history',
    quick: 'Quick search',
    popular: 'Popular right now',
    empty: 'No cars match those filters.',
    emptySub: 'Try widening your search or resetting the filters.',
    sellCta: 'Ready for your next chapter?',
    sellSub: 'List your car in minutes. We’ll help with the rest.',
    start: 'Start selling',
  },
  fr: {
    buy: 'Acheter',
    sell: 'Vendre ma voiture',
    saved: 'Favoris',
    hero: 'Trouvez la voiture qui vous ressemble.',
    sub: 'De bonnes voitures, des infos claires, sans pression.',
    search: 'Marque, modèle ou mot-clé',
    go: 'Rechercher',
    filters: 'Filtres',
    results: 'voitures trouvées',
    sort: 'Tri : Recommandées',
    price: 'Prix',
    body: 'Carrosserie',
    fuel: 'Énergie',
    year: 'Année',
    any: 'Tous',
    reset: 'Réinitialiser',
    compare: 'Comparer',
    view: 'Voir la voiture',
    monthly: 'est. / mois',
    trusted: 'Historique vérifié',
    quick: 'Recherche rapide',
    popular: 'Populaires en ce moment',
    empty: 'Aucune voiture ne correspond.',
    emptySub: 'Élargissez votre recherche ou réinitialisez les filtres.',
    sellCta: 'Prêt pour la suite ?',
    sellSub: 'Publiez votre voiture en quelques minutes. On s’occupe du reste.',
    start: 'Commencer',
  },
  es: {
    buy: 'Comprar',
    sell: 'Vender mi coche',
    saved: 'Guardados',
    hero: 'Encuentra un coche que encaje contigo.',
    sub: 'Buenos coches, datos claros y cero presión.',
    search: 'Marca, modelo o palabra clave',
    go: 'Buscar',
    filters: 'Filtros',
    results: 'coches encontrados',
    sort: 'Orden: Recomendados',
    price: 'Precio',
    body: 'Carrocería',
    fuel: 'Combustible',
    year: 'Año',
    any: 'Cualquiera',
    reset: 'Restablecer',
    compare: 'Comparar',
    view: 'Ver coche',
    monthly: 'est. / mes',
    trusted: 'Historial verificado',
    quick: 'Búsqueda rápida',
    popular: 'Populares ahora',
    empty: 'Ningún coche coincide.',
    emptySub: 'Amplía la búsqueda o restablece los filtros.',
    sellCta: '¿Listo para tu próxima etapa?',
    sellSub: 'Publica tu coche en minutos. Nosotros te ayudamos con el resto.',
    start: 'Empezar',
  },
};
const galleryExtras = [
  'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85',
];
const seedMarketMeta: Record<
  number,
  Pick<
    Car,
    | 'origin'
    | 'country'
    | 'city'
    | 'importRegion'
    | 'location'
    | 'engineLitres'
    | 'sellerType'
    | 'verified'
    | 'available'
    | 'listedDaysAgo'
    | 'rentable'
    | 'dailyRate'
  >
> = {
  1: {
    origin: 'local',
    country: 'Republic of the Congo',
    city: 'Brazzaville',
    location: 'Brazzaville',
    engineLitres: 0,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 3,
    rentable: true,
    dailyRate: 45_000,
  },
  2: {
    origin: 'local',
    country: 'Republic of the Congo',
    city: 'Pointe-Noire',
    location: 'Pointe-Noire',
    engineLitres: 2,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 1,
    rentable: true,
    dailyRate: 55_000,
  },
  3: {
    origin: 'abroad',
    importRegion: 'Europe',
    location: 'Europe',
    engineLitres: 4,
    sellerType: 'Dealer',
    verified: false,
    available: true,
    listedDaysAgo: 4,
    rentable: false,
  },
  4: {
    origin: 'local',
    country: 'Cameroon',
    city: 'Douala',
    location: 'Douala',
    engineLitres: 0,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 2,
    rentable: true,
    dailyRate: 35_000,
  },
  5: {
    origin: 'local',
    country: 'Gabon',
    city: 'Libreville',
    location: 'Libreville',
    engineLitres: 2,
    sellerType: 'Private',
    verified: false,
    available: true,
    listedDaysAgo: 6,
    rentable: false,
  },
  6: {
    origin: 'abroad',
    importRegion: 'America',
    location: 'America',
    engineLitres: 0,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 5,
    rentable: false,
  },
  7: {
    origin: 'local',
    country: 'Angola',
    city: 'Cabinda',
    location: 'Cabinda',
    engineLitres: 2.8,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 1,
    rentable: true,
    dailyRate: 50_000,
  },
  8: {
    origin: 'local',
    country: 'DR Congo',
    city: 'Kinshasa',
    location: 'Kinshasa',
    engineLitres: 1.5,
    sellerType: 'Dealer',
    verified: true,
    available: true,
    listedDaysAgo: 7,
    rentable: true,
    dailyRate: 42_000,
  },
};
const cars: Car[] = [
  {
    id: 1,
    make: 'Volvo',
    model: 'XC40 Recharge',
    year: 2023,
    price: 25500000,
    km: 18400,
    fuel: 'Electric',
    body: 'SUV',
    location: 'Brazzaville',
    color: 'Sage',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    doors: 5,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85',
      ...galleryExtras,
    ],
    badge: 'Great price',
  },
  {
    id: 2,
    make: 'BMW',
    model: '330e M Sport',
    year: 2022,
    price: 23200000,
    km: 32100,
    fuel: 'Hybrid',
    body: 'Sedan',
    location: 'Pointe-Noire',
    color: 'Blue',
    transmission: 'Automatic',
    drivetrain: 'RWD',
    doors: 4,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=85',
    ],
    badge: 'Just arrived',
  },
  {
    id: 3,
    make: 'Mercedes-Benz',
    model: 'AMG GT',
    year: 2021,
    price: 20900000,
    km: 43700,
    fuel: 'Petrol',
    body: 'Coupe',
    location: 'Cabinda',
    color: 'Silver',
    transmission: 'Automatic',
    drivetrain: 'RWD',
    doors: 2,
    seats: 2,
    image:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85',
    ],
    badge: 'Low mileage',
  },
  {
    id: 4,
    make: 'Peugeot',
    model: 'e-208 GT',
    year: 2023,
    price: 16200000,
    km: 12600,
    fuel: 'Electric',
    body: 'Hatchback',
    location: 'Douala',
    color: 'Yellow',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    doors: 5,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=85',
      ...galleryExtras.slice(0, 1),
    ],
    badge: 'City favorite',
  },
  {
    id: 5,
    make: 'Audi',
    model: 'A4 Avant',
    year: 2020,
    price: 18800000,
    km: 58900,
    fuel: 'Diesel',
    body: 'Wagon',
    location: 'Libreville',
    color: 'Black',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    doors: 5,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=85',
      ...galleryExtras.slice(1),
    ],
    badge: 'Family pick',
  },
  {
    id: 6,
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2022,
    price: 21600000,
    km: 39100,
    fuel: 'Electric',
    body: 'Sedan',
    location: 'Kinshasa',
    color: 'White',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    doors: 4,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=85',
      ...galleryExtras.slice(0, 1),
    ],
    badge: 'Fast charge',
  },
  {
    id: 7,
    make: 'Toyota',
    model: 'Hilux 2.8 D-4D',
    year: 2021,
    price: 19800000,
    km: 68400,
    fuel: 'Diesel',
    body: 'Pickup',
    location: 'Brazzaville',
    color: 'White',
    transmission: 'Manual',
    drivetrain: 'AWD',
    doors: 4,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=85',
      ...galleryExtras.slice(0, 1),
    ],
    badge: 'New listing',
  },
  {
    id: 8,
    make: 'Honda',
    model: 'CR-V Executive',
    year: 2020,
    price: 17400000,
    km: 52600,
    fuel: 'Petrol',
    body: 'SUV',
    location: 'Libreville',
    color: 'Black',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    doors: 5,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=85',
    images: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=85',
      ...galleryExtras.slice(1),
    ],
    badge: 'Family pick',
  },
].map((car) => ({ ...car, sample: true, ...seedMarketMeta[car.id] }));
const brands = [
  { name: 'Toyota', slug: 'toyota', count: 84 },
  { name: 'BMW', slug: 'bmw', count: 58 },
  { name: 'Mercedes', slug: 'mercedes', count: 67 },
  { name: 'Tesla', slug: 'tesla', count: 42 },
  { name: 'Audi', slug: 'audi', count: 59 },
  { name: 'Volvo', slug: 'volvo', count: 31 },
  { name: 'Peugeot', slug: 'peugeot', count: 46 },
  { name: 'Honda', slug: 'honda', count: 52 },
];
const canonicalBrandName = (make: string) =>
  make.toLowerCase().startsWith('mercedes') ? 'Mercedes' : make;
const catalogBrands = (inventory: Car[]) => {
  const totals = new Map<string, number>();
  inventory
    .filter((car) => !car.hidden)
    .forEach((car) => {
      const name = canonicalBrandName(car.make);
      totals.set(name, (totals.get(name) || 0) + 1);
    });
  return Array.from(totals, ([name, count]) => ({
    name,
    count,
    slug:
      brands.find((brand) => brand.name === name)?.slug ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  })).sort((a, b) => a.name.localeCompare(b.name));
};
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const money = (n: number, lang: Lang) =>
  `${new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { maximumFractionDigits: 0 }).format(n)} FCFA`;
const rentalRate = (car: Car) => Math.max(0, Math.round(car.dailyRate || 0));
const rentalDaysBetween = (start: string, end: string) => {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0;
  return Math.ceil((endTime - startTime) / 86_400_000);
};
const vocabulary: Record<Lang, Record<string, string>> = {
  en: {},
  fr: {
    Electric: 'Électrique',
    Hybrid: 'Hybride',
    Petrol: 'Essence',
    Diesel: 'Diesel',
    Sedan: 'Berline',
    Hatchback: 'Citadine',
    Wagon: 'Break',
    Coupe: 'Coupé',
    Pickup: 'Pick-up',
    Van: 'Fourgon',
    Automatic: 'Automatique',
    Manual: 'Manuelle',
    Black: 'Noir',
    White: 'Blanc',
    Silver: 'Argent',
    Blue: 'Bleu',
    Yellow: 'Jaune',
    Sage: 'Vert sauge',
    'Great price': 'Très bon prix',
    'Just arrived': 'Nouvel arrivage',
    'Low mileage': 'Faible kilométrage',
    'City favorite': 'Favori en ville',
    'Family pick': 'Choix famille',
    'Fast charge': 'Recharge rapide',
    'New listing': 'Nouvelle annonce',
    Local: 'Local',
    Abroad: 'À l’étranger',
    Europe: 'Europe',
    Asia: 'Asie',
    America: 'Amérique',
    'Republic of the Congo': 'République du Congo',
    Cameroon: 'Cameroun',
    Gabon: 'Gabon',
    Angola: 'Angola',
    'DR Congo': 'RD Congo',
    Dealer: 'Professionnel',
    Private: 'Particulier',
  },
  es: {
    Electric: 'Eléctrico',
    Hybrid: 'Híbrido',
    Petrol: 'Gasolina',
    Diesel: 'Diésel',
    Sedan: 'Sedán',
    Hatchback: 'Compacto',
    Wagon: 'Familiar',
    Coupe: 'Cupé',
    Pickup: 'Pick-up',
    Van: 'Furgoneta',
    Automatic: 'Automático',
    Manual: 'Manual',
    Black: 'Negro',
    White: 'Blanco',
    Silver: 'Plata',
    Blue: 'Azul',
    Yellow: 'Amarillo',
    Sage: 'Verde salvia',
    'Great price': 'Excelente precio',
    'Just arrived': 'Recién llegado',
    'Low mileage': 'Poco kilometraje',
    'City favorite': 'Favorito urbano',
    'Family pick': 'Ideal para familias',
    'Fast charge': 'Carga rápida',
    'New listing': 'Anuncio nuevo',
    Local: 'Local',
    Abroad: 'En el extranjero',
    Europe: 'Europa',
    Asia: 'Asia',
    America: 'América',
    'Republic of the Congo': 'República del Congo',
    Cameroon: 'Camerún',
    Gabon: 'Gabón',
    Angola: 'Angola',
    'DR Congo': 'RD del Congo',
    Dealer: 'Profesional',
    Private: 'Particular',
  },
};
const localize = (value: string | undefined, lang: Lang) =>
  value ? vocabulary[lang][value] || value : '—';
const localeFor = (lang: Lang) =>
  lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
const numberFor = (value: number, lang: Lang) =>
  new Intl.NumberFormat(localeFor(lang)).format(value);
const carPlace = (car: Car, lang: Lang) =>
  car.origin === 'abroad'
    ? localize(car.importRegion || car.location, lang)
    : [localize(car.country, lang), car.city || car.location]
        .filter((value) => value && value !== '—')
        .join(' · ');
const citiesByCountry: Record<string, string[]> = {
  'Republic of the Congo': ['Brazzaville', 'Pointe-Noire'],
  Angola: ['Cabinda'],
  Cameroon: ['Douala'],
  Gabon: ['Libreville'],
  'DR Congo': ['Kinshasa'],
};
const countryForCity = (city: string) =>
  Object.entries(citiesByCountry).find(([, cities]) =>
    cities.includes(city),
  )?.[0];
const orderStatus = (status: string, lang: Lang) => {
  const statuses: Record<Lang, Record<string, string>> = {
    en: {
      New: 'New request',
      Contacted: 'Contacted',
      Complete: 'Complete',
      Cancelled: 'Cancelled',
    },
    fr: {
      New: 'Nouvelle demande',
      Contacted: 'Contacté',
      Complete: 'Terminée',
      Cancelled: 'Annulée',
    },
    es: {
      New: 'Nueva solicitud',
      Contacted: 'Contactado',
      Complete: 'Completada',
      Cancelled: 'Cancelada',
    },
  };
  return statuses[lang][status] || status;
};
const accessibilityCopy = {
  en: {
    language: 'Language',
    menu: 'Menu',
    clearSearch: 'Clear search',
    closeFilters: 'Close filters',
    inventoryPages: 'Inventory pages',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    remove: 'Remove',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    heroAlt: 'Customers viewing an SUV at a Central African car market',
  },
  fr: {
    language: 'Langue',
    menu: 'Menu',
    clearSearch: 'Effacer la recherche',
    closeFilters: 'Fermer les filtres',
    inventoryPages: 'Pages des annonces',
    previousPage: 'Page précédente',
    nextPage: 'Page suivante',
    remove: 'Retirer',
    previousPhoto: 'Photo précédente',
    nextPhoto: 'Photo suivante',
    heroAlt:
      'Des clients regardent un SUV sur un marché automobile d’Afrique centrale',
  },
  es: {
    language: 'Idioma',
    menu: 'Menú',
    clearSearch: 'Borrar búsqueda',
    closeFilters: 'Cerrar filtros',
    inventoryPages: 'Páginas de anuncios',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    remove: 'Quitar',
    previousPhoto: 'Foto anterior',
    nextPhoto: 'Foto siguiente',
    heroAlt:
      'Clientes observando un SUV en un mercado de automóviles de África Central',
  },
} as const;
const formValue = (data: FormData, key: string, fallback = '') => {
  const value = data.get(key);
  return typeof value === 'string' && value ? value : fallback;
};
const formImages = (data: FormData, main: string) =>
  Array.from(
    new Set([
      main,
      ...formValue(data, 'images')
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ]),
  ).slice(0, 8);
const ui = {
  en: {
    buyCar: 'Buy a car',
    rentCar: 'Rent a car',
    parts: 'Car parts',
    cart: 'Cart',
    signIn: 'Sign in',
    buy: 'Buy',
    rent: 'Rent',
    partsDemand: 'Parts on demand',
    allMakes: 'All makes',
    allModels: 'All {brand} models',
    models: 'Models',
    refine: 'Quick refine',
    clear: 'Clear all',
    selected: 'Selected filters',
    insurance: 'Rental terms available',
    options: 'Confirm dates with seller',
    added: 'Added',
    inCart: 'In cart',
    book: 'Request rental',
    addCart: 'Add to cart',
    details: 'View details',
    overview: 'Overview',
    equipment: 'Equipment',
    seller: 'Seller information',
    contact: 'Contact seller',
    inspected: 'Listing details reviewed',
    noAccident: 'Accident history: ask seller',
    original: 'Parts condition: ask seller',
    service: 'Service records available on request',
    close: 'Close details',
  },
  fr: {
    buyCar: 'Acheter une voiture',
    rentCar: 'Louer une voiture',
    parts: 'Pièces auto',
    cart: 'Panier',
    signIn: 'Se connecter',
    buy: 'Acheter',
    rent: 'Louer',
    partsDemand: 'Pièces sur demande',
    allMakes: 'Toutes les marques',
    allModels: 'Tous les modèles {brand}',
    models: 'Modèles',
    refine: 'Affiner',
    clear: 'Tout effacer',
    selected: 'Filtres sélectionnés',
    insurance: 'Conditions de location disponibles',
    options: 'Confirmer les dates avec le vendeur',
    added: 'Ajouté',
    inCart: 'Dans le panier',
    book: 'Demander la location',
    addCart: 'Ajouter au panier',
    details: 'Voir les détails',
    overview: 'Aperçu',
    equipment: 'Équipements',
    seller: 'Informations vendeur',
    contact: 'Contacter le vendeur',
    inspected: 'Informations de l’annonce vérifiées',
    noAccident: 'Accidents : demander au vendeur',
    original: 'État des pièces : demander au vendeur',
    service: 'Carnet d’entretien sur demande',
    close: 'Fermer les détails',
  },
  es: {
    buyCar: 'Comprar un coche',
    rentCar: 'Alquilar un coche',
    parts: 'Repuestos',
    cart: 'Carrito',
    signIn: 'Iniciar sesión',
    buy: 'Comprar',
    rent: 'Alquilar',
    partsDemand: 'Repuestos bajo pedido',
    allMakes: 'Todas las marcas',
    allModels: 'Todos los modelos {brand}',
    models: 'Modelos',
    refine: 'Afinar',
    clear: 'Borrar todo',
    selected: 'Filtros seleccionados',
    insurance: 'Condiciones de alquiler disponibles',
    options: 'Confirma las fechas con el vendedor',
    added: 'Añadido',
    inCart: 'En el carrito',
    book: 'Solicitar alquiler',
    addCart: 'Añadir al carrito',
    details: 'Ver detalles',
    overview: 'Resumen',
    equipment: 'Equipamiento',
    seller: 'Información del vendedor',
    contact: 'Contactar al vendedor',
    inspected: 'Detalles del anuncio revisados',
    noAccident: 'Accidentes: consultar al vendedor',
    original: 'Estado de piezas: consultar al vendedor',
    service: 'Historial de mantenimiento bajo pedido',
    close: 'Cerrar detalles',
  },
} as const;
const marketCopy = {
  en: {
    trust: [
      'Five regional markets',
      'Clear listing details',
      'Direct seller contact',
      'Parts on demand',
    ],
    browse: 'Browse makes',
    listings: 'listings',
    allBrands: 'All brands',
    year: 'Year from',
    location: 'Location',
    source: 'Stock source',
    local: 'Local stock',
    abroad: 'Abroad stock',
    country: 'Country',
    importRegion: 'Import region',
    engine: 'Engine size',
    sellerType: 'Seller type',
    minPrice: 'Minimum FCFA',
    maxPrice: 'Maximum FCFA',
    dailyPrice: 'Daily rate',
    rentUnder: 'Under 60,000 FCFA/day',
    verifiedOnly: 'Verified listing',
    availableOnly: 'Available listing',
    onDemand: 'On demand',
    listedToday: 'Listed today',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    latestOnly: 'Listed in 7 days',
    privateOnly: 'Private seller',
    mileage: 'Mileage',
    transmission: 'Transmission',
    drivetrain: 'Drivetrain',
    color: 'Color',
    doors: 'Doors',
    seats: 'Seats',
    under: 'Under',
    doorCount: 'doors',
    seatCount: 'seats',
    localAvailability: 'Available locally',
    abroadAvailability: 'Available abroad — import required',
    importNote:
      'Estimated import: 4–8 weeks. Shipping and customs are quoted separately.',
    show: 'Show',
    cars: 'cars',
    rentReady: 'AVAILABLE TO RENT',
    trip: 'cars ready for your trip',
    sort: [
      'Price: Low to high',
      'Price: High to low',
      'Newest first',
      'Oldest first',
      'Lowest mileage',
      'Engine size',
    ],
    rentalTerms: 'Rental terms shown',
    selected: 'selected',
    compareNow: 'Compare now',
    help: 'Help',
    privacy: 'Privacy',
    terms: 'Terms',
    tagline: 'Move happy.',
  },
  fr: {
    trust: [
      'Cinq marchés régionaux',
      'Annonces détaillées',
      'Contact direct vendeur',
      'Pièces sur demande',
    ],
    browse: 'Parcourir les marques',
    listings: 'annonces',
    allBrands: 'Toutes les marques',
    year: 'Année à partir de',
    location: 'Localisation',
    source: 'Origine du stock',
    local: 'Stock local',
    abroad: 'Stock à l’étranger',
    country: 'Pays',
    importRegion: 'Région d’importation',
    engine: 'Cylindrée',
    sellerType: 'Type de vendeur',
    minPrice: 'Minimum FCFA',
    maxPrice: 'Maximum FCFA',
    dailyPrice: 'Tarif journalier',
    rentUnder: 'Moins de 60 000 FCFA/jour',
    verifiedOnly: 'Annonce vérifiée',
    availableOnly: 'Annonce disponible',
    onDemand: 'Sur demande',
    listedToday: 'Publiée aujourd’hui',
    dayAgo: 'jour',
    daysAgo: 'jours',
    latestOnly: 'Publiée sous 7 jours',
    privateOnly: 'Vendeur particulier',
    mileage: 'Kilométrage',
    transmission: 'Transmission',
    drivetrain: 'Motricité',
    color: 'Couleur',
    doors: 'Portes',
    seats: 'Places',
    under: 'Moins de',
    doorCount: 'portes',
    seatCount: 'places',
    localAvailability: 'Disponible localement',
    abroadAvailability: 'À l’étranger — importation requise',
    importNote:
      'Importation estimée : 4 à 8 semaines. Transport et douane sont chiffrés séparément.',
    show: 'Voir',
    cars: 'voitures',
    rentReady: 'DISPONIBLES À LA LOCATION',
    trip: 'voitures prêtes pour votre voyage',
    sort: [
      'Prix croissant',
      'Prix décroissant',
      'Plus récentes',
      'Plus anciennes',
      'Kilométrage le plus bas',
      'Cylindrée',
    ],
    rentalTerms: 'Conditions de location',
    selected: 'sélectionnées',
    compareNow: 'Comparer maintenant',
    help: 'Aide',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    tagline: 'Roulez heureux.',
  },
  es: {
    trust: [
      'Cinco mercados regionales',
      'Anuncios detallados',
      'Contacto directo',
      'Repuestos bajo pedido',
    ],
    browse: 'Explorar marcas',
    listings: 'anuncios',
    allBrands: 'Todas las marcas',
    year: 'Año desde',
    location: 'Ubicación',
    source: 'Origen del stock',
    local: 'Stock local',
    abroad: 'Stock en el extranjero',
    country: 'País',
    importRegion: 'Región de importación',
    engine: 'Cilindrada',
    sellerType: 'Tipo de vendedor',
    minPrice: 'Mínimo FCFA',
    maxPrice: 'Máximo FCFA',
    dailyPrice: 'Tarifa diaria',
    rentUnder: 'Menos de 60.000 FCFA/día',
    verifiedOnly: 'Anuncio verificado',
    availableOnly: 'Anuncio disponible',
    onDemand: 'Bajo pedido',
    listedToday: 'Publicado hoy',
    dayAgo: 'día',
    daysAgo: 'días',
    latestOnly: 'Publicado en 7 días',
    privateOnly: 'Vendedor particular',
    mileage: 'Kilometraje',
    transmission: 'Transmisión',
    drivetrain: 'Tracción',
    color: 'Color',
    doors: 'Puertas',
    seats: 'Plazas',
    under: 'Menos de',
    doorCount: 'puertas',
    seatCount: 'plazas',
    localAvailability: 'Disponible localmente',
    abroadAvailability: 'En el extranjero — requiere importación',
    importNote:
      'Importación estimada: 4–8 semanas. Envío y aduanas se cotizan por separado.',
    show: 'Ver',
    cars: 'coches',
    rentReady: 'DISPONIBLES PARA ALQUILAR',
    trip: 'coches listos para tu viaje',
    sort: [
      'Precio: menor a mayor',
      'Precio: mayor a menor',
      'Más recientes',
      'Más antiguos',
      'Menor kilometraje',
      'Cilindrada',
    ],
    rentalTerms: 'Condiciones del alquiler',
    selected: 'seleccionados',
    compareNow: 'Comparar ahora',
    help: 'Ayuda',
    privacy: 'Privacidad',
    terms: 'Condiciones',
    tagline: 'Conduce feliz.',
  },
} as const;
const flowCopy = {
  en: {
    eyebrow: 'Central Africa’s trusted car market.',
    markets: 'regional markets',
    quick: ['Electric', 'SUV', 'Under 20M FCFA'],
    sellEyebrow: 'SELL WITH JFCARS',
    account: 'YOUR JFCARS ACCOUNT',
    welcome: 'Welcome back.',
    moving: 'Let’s get you moving.',
    signinDesc: 'Sign in to manage your cars, bookings and requests.',
    signupDesc: 'Create an account to save, compare and move faster.',
    signIn: 'Sign in',
    create: 'Create account',
    name: 'Full name',
    email: 'Email address',
    password: 'Password',
    remember: 'Remember me',
    forgot: 'Forgot password?',
    forgotSent: 'Reset instructions are ready for the email entered above.',
    continue: 'By continuing, you agree to our Terms and Privacy Policy.',
    selection: 'YOUR SELECTION',
    estimated: 'Estimated total',
    purchase: 'Purchase',
    rental: 'Rental',
    day: 'day',
    rentalDates: 'Rental dates',
    rentalStart: 'Pickup date',
    rentalEnd: 'Return date',
    pickupAt: 'Pickup',
    rentalConsent:
      'I understand this is an availability request. The seller confirms the deposit, ID and licence requirements, and final rental terms before payment.',
    rentalRequired:
      'Choose valid pickup and return dates, then confirm the rental terms.',
    chooseDates: 'Choose dates to calculate the rental total',
    checkout: 'Submit purchase or rental request',
    checkoutNote:
      'JFcars takes no payment on this website. Payment is arranged separately with the seller. JFcars does not issue refunds.',
    signinContinue: 'Sign in to continue',
    checkoutDone:
      'Request submitted. No purchase or rental is confirmed until the seller accepts it and agrees the final terms with you.',
    emptyCart: 'Your cart is ready for an adventure.',
    emptyCartP: 'Add a car or rental and it will appear here.',
    browse: 'Keep browsing',
    profileSaved: 'Profile changes saved.',
    viewDetails: 'View details',
    adminHint: 'Admin access is limited to the verified JFcars owner.',
    helpTitle: 'How can we help?',
    privacyTitle: 'Privacy at JFcars',
    termsTitle: 'Marketplace terms',
    helpText:
      'Browse, compare, rent or request a part. For transaction support, use the seller form on any listing.',
    privacyText:
      'Marketplace requests and signed-in account data are stored securely for service delivery. Language preferences may also be stored on this device.',
    termsText:
      'All requests remain subject to inspection, seller confirmation, payment, delivery and local registration requirements. JFcars does not issue refunds.',
    sellTitle: 'List your vehicle',
    sellText:
      'Share the essentials. The JFcars team will review your listing before it goes live.',
    sellDone:
      'Listing request saved. Our team will contact you for photos and verification.',
  },
  fr: {
    eyebrow: 'Le marché automobile de confiance en Afrique centrale.',
    markets: 'marchés régionaux',
    quick: ['Électrique', 'SUV', 'Moins de 20 M FCFA'],
    sellEyebrow: 'VENDEZ AVEC JFCARS',
    account: 'VOTRE COMPTE JFCARS',
    welcome: 'Bon retour.',
    moving: 'Prenons la route.',
    signinDesc:
      'Connectez-vous pour gérer vos voitures, réservations et demandes.',
    signupDesc:
      'Créez un compte pour enregistrer, comparer et avancer plus vite.',
    signIn: 'Se connecter',
    create: 'Créer un compte',
    name: 'Nom complet',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    remember: 'Se souvenir de moi',
    forgot: 'Mot de passe oublié ?',
    forgotSent:
      'Les instructions seront envoyées à l’adresse saisie ci-dessus.',
    continue:
      'En continuant, vous acceptez nos Conditions et notre Politique de confidentialité.',
    selection: 'VOTRE SÉLECTION',
    estimated: 'Total estimé',
    purchase: 'Achat',
    rental: 'Location',
    day: 'jour',
    rentalDates: 'Dates de location',
    rentalStart: 'Date de prise en charge',
    rentalEnd: 'Date de retour',
    pickupAt: 'Prise en charge',
    rentalConsent:
      'Je comprends qu’il s’agit d’une demande de disponibilité. Le vendeur confirme la caution, les exigences de pièce d’identité et de permis, ainsi que les conditions finales avant le paiement.',
    rentalRequired:
      'Choisissez des dates valides, puis confirmez les conditions de location.',
    chooseDates: 'Choisissez les dates pour calculer le total de la location',
    checkout: 'Envoyer la demande d’achat ou de location',
    checkoutNote:
      'JFcars ne prélève aucun paiement sur ce site. Le paiement est organisé séparément avec le vendeur. JFcars n’effectue aucun remboursement.',
    signinContinue: 'Se connecter pour continuer',
    checkoutDone:
      'Demande envoyée. Aucun achat ni aucune location n’est confirmé tant que le vendeur ne l’a pas accepté et n’a pas convenu des conditions finales avec vous.',
    emptyCart: 'Votre panier attend votre prochaine aventure.',
    emptyCartP: 'Ajoutez une voiture ou une location : elle apparaîtra ici.',
    browse: 'Continuer à chercher',
    profileSaved: 'Profil enregistré.',
    viewDetails: 'Voir les détails',
    adminHint: 'L’accès Admin est réservé au propriétaire JFcars vérifié.',
    helpTitle: 'Comment pouvons-nous aider ?',
    privacyTitle: 'Confidentialité chez JFcars',
    termsTitle: 'Conditions de la place de marché',
    helpText:
      'Parcourez, comparez, louez ou demandez une pièce. Pour une transaction, utilisez le formulaire vendeur de l’annonce.',
    privacyText:
      'Les demandes et les données des comptes connectés sont conservées pour assurer le service. La préférence de langue peut aussi être stockée sur cet appareil.',
    termsText:
      'Toute demande reste soumise à l’inspection, à la confirmation du vendeur, au paiement, à la livraison et aux règles locales d’immatriculation. JFcars n’effectue aucun remboursement.',
    sellTitle: 'Publier votre véhicule',
    sellText:
      'Partagez l’essentiel. L’équipe JFcars vérifiera votre annonce avant publication.',
    sellDone:
      'Demande enregistrée. Notre équipe vous contactera pour les photos et la vérification.',
  },
  es: {
    eyebrow: 'El mercado de automóviles de confianza en África Central.',
    markets: 'mercados regionales',
    quick: ['Eléctrico', 'SUV', 'Menos de 20 M FCFA'],
    sellEyebrow: 'VENDE CON JFCARS',
    account: 'TU CUENTA JFCARS',
    welcome: 'Bienvenido de nuevo.',
    moving: 'Pongámonos en marcha.',
    signinDesc: 'Inicia sesión para gestionar coches, reservas y solicitudes.',
    signupDesc: 'Crea una cuenta para guardar, comparar y avanzar más rápido.',
    signIn: 'Iniciar sesión',
    create: 'Crear cuenta',
    name: 'Nombre completo',
    email: 'Correo electrónico',
    password: 'Contraseña',
    remember: 'Recordarme',
    forgot: '¿Olvidaste la contraseña?',
    forgotSent: 'Las instrucciones se enviarán al correo indicado arriba.',
    continue:
      'Al continuar, aceptas nuestros Términos y Política de privacidad.',
    selection: 'TU SELECCIÓN',
    estimated: 'Total estimado',
    purchase: 'Compra',
    rental: 'Alquiler',
    day: 'día',
    rentalDates: 'Fechas de alquiler',
    rentalStart: 'Fecha de recogida',
    rentalEnd: 'Fecha de devolución',
    pickupAt: 'Recogida',
    rentalConsent:
      'Entiendo que es una solicitud de disponibilidad. El vendedor confirma el depósito, los requisitos de identidad y permiso, y las condiciones finales antes del pago.',
    rentalRequired:
      'Elige fechas válidas y confirma las condiciones del alquiler.',
    chooseDates: 'Elige las fechas para calcular el total del alquiler',
    checkout: 'Enviar solicitud de compra o alquiler',
    checkoutNote:
      'JFcars no cobra pagos en este sitio. El pago se organiza por separado con el vendedor. JFcars no realiza reembolsos.',
    signinContinue: 'Inicia sesión para continuar',
    checkoutDone:
      'Solicitud enviada. La compra o el alquiler no se confirma hasta que el vendedor lo acepte y acuerde contigo las condiciones finales.',
    emptyCart: 'Tu carrito espera una aventura.',
    emptyCartP: 'Añade un coche o alquiler y aparecerá aquí.',
    browse: 'Seguir buscando',
    profileSaved: 'Perfil guardado.',
    viewDetails: 'Ver detalles',
    adminHint:
      'El acceso Admin está limitado al propietario verificado de JFcars.',
    helpTitle: '¿Cómo podemos ayudarte?',
    privacyTitle: 'Privacidad en JFcars',
    termsTitle: 'Términos del mercado',
    helpText:
      'Explora, compara, alquila o solicita una pieza. Para una operación, usa el formulario del vendedor en el anuncio.',
    privacyText:
      'Las solicitudes y los datos de las cuentas conectadas se guardan para prestar el servicio. La preferencia de idioma también puede guardarse en este dispositivo.',
    termsText:
      'Toda solicitud está sujeta a inspección, confirmación del vendedor, pago, entrega y requisitos locales de matriculación. JFcars no realiza reembolsos.',
    sellTitle: 'Publica tu vehículo',
    sellText:
      'Comparte lo esencial. El equipo de JFcars revisará el anuncio antes de publicarlo.',
    sellDone:
      'Solicitud guardada. Nuestro equipo te contactará para las fotos y la verificación.',
  },
} as const;
const profileCopy = {
  en: {
    welcome: 'Welcome back',
    tabs: ['Overview', 'Purchases', 'Rentals', 'Settings'],
    glance: 'Your JFcars at a glance',
    saved: 'Saved cars',
    cart: 'In cart',
    parts: 'Part requests',
    recent: 'Recent activity',
    ready: 'Profile ready',
    readyText: 'Your account is set up and ready to go.',
    noPurchases: 'No purchases yet',
    purchasesText: 'Your vehicle orders will be tracked here.',
    noRentals: 'No upcoming rentals',
    rentalsText: 'Book a car and manage your trip here.',
    settings: 'Profile settings',
    save: 'Save changes',
    signout: 'Sign out',
  },
  fr: {
    welcome: 'Bon retour',
    tabs: ['Aperçu', 'Achats', 'Locations', 'Paramètres'],
    glance: 'Votre activité JFcars',
    saved: 'Voitures favorites',
    cart: 'Dans le panier',
    parts: 'Demandes de pièces',
    recent: 'Activité récente',
    ready: 'Profil prêt',
    readyText: 'Votre compte est configuré et prêt.',
    noPurchases: 'Aucun achat',
    purchasesText: 'Vos commandes de véhicules seront suivies ici.',
    noRentals: 'Aucune location à venir',
    rentalsText: 'Réservez une voiture et gérez votre voyage ici.',
    settings: 'Paramètres du profil',
    save: 'Enregistrer',
    signout: 'Se déconnecter',
  },
  es: {
    welcome: 'Bienvenido de nuevo',
    tabs: ['Resumen', 'Compras', 'Alquileres', 'Ajustes'],
    glance: 'Tu actividad en JFcars',
    saved: 'Coches guardados',
    cart: 'En el carrito',
    parts: 'Solicitudes de piezas',
    recent: 'Actividad reciente',
    ready: 'Perfil listo',
    readyText: 'Tu cuenta está configurada y lista.',
    noPurchases: 'Sin compras todavía',
    purchasesText: 'Aquí podrás seguir tus pedidos de vehículos.',
    noRentals: 'Sin alquileres próximos',
    rentalsText: 'Reserva un coche y gestiona tu viaje aquí.',
    settings: 'Ajustes del perfil',
    save: 'Guardar cambios',
    signout: 'Cerrar sesión',
  },
} as const;
const compareCopy = {
  en: {
    eyebrow: 'SIDE-BY-SIDE',
    title: 'Compare your shortlist',
    close: 'Close comparison',
    remove: 'Remove',
    mileage: 'Mileage',
    body: 'Body',
    transmission: 'Transmission',
    drivetrain: 'Drivetrain',
    seats: 'Seats',
    location: 'Location',
    add: 'Add to cart',
  },
  fr: {
    eyebrow: 'CÔTE À CÔTE',
    title: 'Comparez votre sélection',
    close: 'Fermer la comparaison',
    remove: 'Retirer',
    mileage: 'Kilométrage',
    body: 'Carrosserie',
    transmission: 'Transmission',
    drivetrain: 'Motricité',
    seats: 'Places',
    location: 'Localisation',
    add: 'Ajouter au panier',
  },
  es: {
    eyebrow: 'LADO A LADO',
    title: 'Compara tu selección',
    close: 'Cerrar comparación',
    remove: 'Quitar',
    mileage: 'Kilometraje',
    body: 'Carrocería',
    transmission: 'Transmisión',
    drivetrain: 'Tracción',
    seats: 'Plazas',
    location: 'Ubicación',
    add: 'Añadir al carrito',
  },
} as const;
export default function Home() {
  const [lang, setLang] = useState<Lang>('en'),
    [query, setQuery] = useState(''),
    [body, setBody] = useState('Any'),
    [fuel, setFuel] = useState('Any'),
    [minPrice, setMinPrice] = useState('Any'),
    [maxPrice, setMaxPrice] = useState('Any'),
    [minYear, setMinYear] = useState('Any'),
    [location, setLocation] = useState('Any'),
    [origin, setOrigin] = useState('Any'),
    [country, setCountry] = useState('Any'),
    [importRegion, setImportRegion] = useState('Any'),
    [engineMax, setEngineMax] = useState('Any'),
    [sellerType, setSellerType] = useState('Any'),
    [verifiedOnly, setVerifiedOnly] = useState(false),
    [availableOnly, setAvailableOnly] = useState(false),
    [latestOnly, setLatestOnly] = useState(false),
    [color, setColor] = useState('Any'),
    [transmission, setTransmission] = useState('Any'),
    [drivetrain, setDrivetrain] = useState('Any'),
    [maxKm, setMaxKm] = useState('Any'),
    [doors, setDoors] = useState('Any'),
    [seats, setSeats] = useState('Any'),
    [sort, setSort] = useState('recommended'),
    [page, setPage] = useState(1);
  const [saved, setSaved] = useState<number[]>([]),
    [compare, setCompare] = useState<number[]>([]),
    [compareOpen, setCompareOpen] = useState(false),
    [selectedCar, setSelectedCar] = useState<Car | null>(null),
    [cart, setCart] = useState<number[]>([]),
    [rentalCart, setRentalCart] = useState<number[]>([]),
    [inventory, setInventory] = useState<Car[]>(cars),
    [mobileFilters, setMobileFilters] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false),
    [mode, setMode] = useState<'buy' | 'rent' | 'parts'>('buy'),
    [heroVisible, setHeroVisible] = useState(true),
    [brand, setBrand] = useState('All'),
    [model, setModel] = useState('All'),
    [panel, setPanel] = useState<'auth' | 'cart' | 'profile' | 'admin' | null>(
      null,
    ),
    [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin'),
    [user, setUser] = useState<UserAccount | null>(null),
    [partRequests, setPartRequests] = useState<PartRequest[]>([]),
    [sellerInquiries, setSellerInquiries] = useState<SellerInquiry[]>([]),
    [sellRequests, setSellRequests] = useState<SellRequest[]>([]),
    [accountPartRequestCount, setAccountPartRequestCount] = useState(0),
    [storefrontContent, setStorefrontContent] = useState<StorefrontContent>({}),
    [authenticated, setAuthenticated] = useState(false),
    [isAdmin, setIsAdmin] = useState(false),
    [remoteReady, setRemoteReady] = useState(false),
    [accountReady, setAccountReady] = useState(false),
    [adminRevision, setAdminRevision] = useState(0),
    [adminSyncError, setAdminSyncError] = useState(false),
    [userOrders, setUserOrders] = useState<OrderRecord[]>([]),
    [orders, setOrders] = useState<OrderRecord[]>([]),
    [sellOpen, setSellOpen] = useState(false),
    [infoTopic, setInfoTopic] = useState<'help' | 'privacy' | 'terms' | null>(
      null,
    ),
    [persistenceReady, setPersistenceReady] = useState(false);
  const t = copy[lang],
    u = ui[lang],
    m = marketCopy[lang],
    f = flowCopy[lang],
    a = accessibilityCopy[lang];
  const modeInventory = useMemo(
    () =>
      mode === 'rent'
        ? inventory.filter(
            (car) =>
              (car.origin || 'local') === 'local' &&
              car.rentable === true &&
              car.available !== false &&
              rentalRate(car) > 0,
          )
        : inventory,
    [inventory, mode],
  );
  const directoryBrands = useMemo(
    () => catalogBrands(modeInventory),
    [modeInventory],
  );
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const raw =
          window.localStorage.getItem('jfcars-store-v5') ||
          window.localStorage.getItem('jfcars-store-v4');
        if (raw) {
          const data = JSON.parse(raw) as {
            lang?: Lang;
            cart?: number[];
            rentalCart?: number[];
            saved?: number[];
          };
          if (data.lang && ['en', 'fr', 'es'].includes(data.lang))
            setLang(data.lang);
          if (Array.isArray(data.cart)) setCart(data.cart);
          if (Array.isArray(data.rentalCart)) setRentalCart(data.rentalCart);
          if (Array.isArray(data.saved)) setSaved(data.saved);
        }
      } catch {
        window.localStorage.removeItem('jfcars-store-v5');
      }
      const params = new URLSearchParams(window.location.search);
      const applyParam = (key: string, setter: (value: string) => void) => {
        const value = params.get(key);
        if (value) setter(value);
      };
      const urlLang = params.get('lang');
      if (urlLang === 'en' || urlLang === 'fr' || urlLang === 'es')
        setLang(urlLang);
      const urlMode = params.get('mode');
      if (urlMode === 'buy' || urlMode === 'rent' || urlMode === 'parts') {
        setMode(urlMode);
        setHeroVisible(false);
      }
      applyParam('q', setQuery);
      applyParam('make', setBrand);
      applyParam('model', setModel);
      applyParam('body', setBody);
      applyParam('fuel', setFuel);
      applyParam('minPrice', setMinPrice);
      applyParam('price', setMaxPrice);
      applyParam('year', setMinYear);
      const urlSource = params.get('source');
      const urlCountry = params.get('country');
      const urlRegion = params.get('region');
      const urlCity = params.get('city');
      if (urlCountry || urlCity) {
        const validCountry =
          urlCountry && citiesByCountry[urlCountry] ? urlCountry : null;
        const inferredCountry = countryForCity(urlCity || '') || null;
        const validCity =
          urlCity &&
          inferredCountry &&
          (!validCountry || inferredCountry === validCountry)
            ? urlCity
            : 'Any';
        setOrigin('local');
        setCountry(validCountry || inferredCountry || 'Any');
        setLocation(validCity);
        setImportRegion('Any');
      } else if (urlRegion) {
        setOrigin('abroad');
        setImportRegion(urlRegion);
        setCountry('Any');
        setLocation('Any');
      } else if (urlSource === 'local' || urlSource === 'abroad') {
        setOrigin(urlSource);
      }
      if (urlMode === 'rent') {
        setOrigin('local');
        setImportRegion('Any');
      }
      applyParam('engine', setEngineMax);
      applyParam('seller', setSellerType);
      applyParam('color', setColor);
      applyParam('gearbox', setTransmission);
      applyParam('drive', setDrivetrain);
      applyParam('mileage', setMaxKm);
      applyParam('doors', setDoors);
      applyParam('seats', setSeats);
      applyParam('sort', setSort);
      setVerifiedOnly(params.get('verified') === '1');
      setAvailableOnly(params.get('available') === '1');
      setLatestOnly(params.get('latest') === '1');
      if (
        Array.from(params.keys()).some((key) =>
          [
            'q',
            'make',
            'model',
            'body',
            'fuel',
            'minPrice',
            'price',
            'year',
            'source',
            'country',
            'region',
            'city',
            'engine',
            'seller',
            'verified',
            'available',
            'latest',
          ].includes(key),
        )
      )
        setHeroVisible(false);
      setPersistenceReady(true);

      const [sessionResult, marketplaceResult] = await Promise.allSettled([
        fetch('/api/session', { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error('Session unavailable');
          return response.json() as Promise<AuthSession>;
        }),
        fetch('/api/marketplace', { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error('Marketplace unavailable');
          return response.json() as Promise<{
            inventory: Car[] | null;
            partRequests: PartRequest[];
            sellerInquiries: SellerInquiry[];
            sellRequests: SellRequest[];
            storefrontContent: StorefrontContent;
          }>;
        }),
      ]);
      if (!active) return;
      const loadedInventoryForSession =
        marketplaceResult.status === 'fulfilled' &&
        Array.isArray(marketplaceResult.value.inventory)
          ? marketplaceResult.value.inventory
          : cars;

      if (marketplaceResult.status === 'fulfilled') {
        const data = marketplaceResult.value;
        const loadedInventory = loadedInventoryForSession;
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        const liveIds = new Set(
          loadedInventory.filter((car) => !car.hidden).map((car) => car.id),
        );
        const rentableIds = new Set(
          loadedInventory
            .filter(
              (car) =>
                !car.hidden &&
                (car.origin || 'local') === 'local' &&
                car.rentable === true &&
                car.available !== false &&
                rentalRate(car) > 0,
            )
            .map((car) => car.id),
        );
        setCart((current) => current.filter((id) => liveIds.has(id)));
        setRentalCart((current) => current.filter((id) => rentableIds.has(id)));
        setSaved((current) => current.filter((id) => liveIds.has(id)));
        setCompare((current) => current.filter((id) => liveIds.has(id)));
        if (urlMode === 'rent') {
          const requestedBrand = params.get('make');
          const requestedModel = params.get('model');
          const matchingRentals = loadedInventory.filter((car) =>
            rentableIds.has(car.id),
          );
          const validBrand =
            !requestedBrand ||
            matchingRentals.some((car) =>
              car.make.toLowerCase().includes(requestedBrand.toLowerCase()),
            );
          const validModel =
            !requestedModel ||
            matchingRentals.some(
              (car) =>
                car.model === requestedModel &&
                (!requestedBrand ||
                  car.make
                    .toLowerCase()
                    .includes(requestedBrand.toLowerCase())),
            );
          if (!validBrand) setBrand('All');
          if (!validBrand || !validModel) setModel('All');
        }
        if (Array.isArray(data.partRequests))
          setPartRequests(data.partRequests);
        if (Array.isArray(data.sellerInquiries))
          setSellerInquiries(data.sellerInquiries);
        if (Array.isArray(data.sellRequests))
          setSellRequests(data.sellRequests);
        if (data.storefrontContent)
          setStorefrontContent(data.storefrontContent);
        setRemoteReady(true);
      }

      if (sessionResult.status === 'fulfilled') {
        const session = sessionResult.value;
        setAuthenticated(session.authenticated);
        setIsAdmin(session.isAdmin);
        setUser(session.user);
        if (session.authenticated) {
          try {
            const response = await fetch('/api/account', { cache: 'no-store' });
            if (response.ok) {
              const account = (await response.json()) as {
                user?: UserAccount;
                cart?: number[];
                rentalCart?: number[];
                saved?: number[];
                orders?: OrderRecord[];
                partRequestCount?: number;
              };
              if (!active) return;
              if (account.user) setUser(account.user);
              if (Array.isArray(account.cart))
                setCart((current) =>
                  Array.from(new Set([...current, ...account.cart!])),
                );
              if (Array.isArray(account.rentalCart))
                setRentalCart((current) =>
                  Array.from(
                    new Set([...current, ...account.rentalCart!]),
                  ).filter((id) =>
                    loadedInventoryForSession.some(
                      (car) =>
                        car.id === id &&
                        !car.hidden &&
                        (car.origin || 'local') === 'local' &&
                        car.rentable === true &&
                        car.available !== false &&
                        rentalRate(car) > 0,
                    ),
                  ),
                );
              if (Array.isArray(account.saved))
                setSaved((current) =>
                  Array.from(new Set([...current, ...account.saved!])),
                );
              if (Array.isArray(account.orders)) setUserOrders(account.orders);
              if (Number.isFinite(account.partRequestCount))
                setAccountPartRequestCount(Number(account.partRequestCount));
            }
          } catch {
            // Device-local selections remain available if account sync is offline.
          }
        }
        if (session.isAdmin) {
          try {
            const response = await fetch('/api/admin', { cache: 'no-store' });
            if (response.ok) {
              const data = (await response.json()) as {
                orders?: OrderRecord[];
              };
              if (active && Array.isArray(data.orders)) setOrders(data.orders);
            }
          } catch {
            // The storefront remains usable if Admin reporting is unavailable.
          }
        }
      }
      if (active) setAccountReady(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (!persistenceReady) return;
    window.localStorage.setItem(
      'jfcars-store-v5',
      JSON.stringify({
        lang,
        cart,
        rentalCart,
        saved,
      }),
    );
  }, [lang, cart, rentalCart, saved, persistenceReady]);
  useEffect(() => {
    if (!persistenceReady) return;
    const params = new URLSearchParams();
    const add = (key: string, value: string, empty: string) => {
      if (value !== empty) params.set(key, value);
    };
    add('lang', lang, 'en');
    add('mode', mode, 'buy');
    add('q', query, '');
    add('make', brand, 'All');
    add('model', model, 'All');
    add('body', body, 'Any');
    add('fuel', fuel, 'Any');
    add('minPrice', minPrice, 'Any');
    add('price', maxPrice, 'Any');
    add('year', minYear, 'Any');
    add('source', origin, 'Any');
    add('country', country, 'Any');
    add('region', importRegion, 'Any');
    add('city', location, 'Any');
    add('engine', engineMax, 'Any');
    add('seller', sellerType, 'Any');
    add('color', color, 'Any');
    add('gearbox', transmission, 'Any');
    add('drive', drivetrain, 'Any');
    add('mileage', maxKm, 'Any');
    add('doors', doors, 'Any');
    add('seats', seats, 'Any');
    add('sort', sort, 'recommended');
    if (verifiedOnly) params.set('verified', '1');
    if (availableOnly) params.set('available', '1');
    if (latestOnly) params.set('latest', '1');
    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
    );
  }, [
    persistenceReady,
    lang,
    mode,
    query,
    brand,
    model,
    body,
    fuel,
    minPrice,
    maxPrice,
    minYear,
    origin,
    country,
    importRegion,
    location,
    engineMax,
    sellerType,
    verifiedOnly,
    availableOnly,
    latestOnly,
    color,
    transmission,
    drivetrain,
    maxKm,
    doors,
    seats,
    sort,
  ]);
  useEffect(() => {
    if (!authenticated || !accountReady || !user) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void fetch('/api/account', {
        method: 'PUT',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          profile: { name: user.name },
          cart,
          rentalCart,
          saved,
        }),
      }).catch(() => undefined);
    }, 350);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authenticated, accountReady, user, cart, rentalCart, saved]);
  useEffect(() => {
    if (!isAdmin || !remoteReady || adminRevision === 0) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void fetch('/api/marketplace', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-sync',
          inventory,
          storefrontContent,
        }),
      })
        .then((response) => {
          if (!controller.signal.aborted) setAdminSyncError(!response.ok);
        })
        .catch(() => {
          if (!controller.signal.aborted) setAdminSyncError(true);
        });
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isAdmin, remoteReady, adminRevision, inventory, storefrontContent]);
  const filtered = useMemo(() => {
    let r = inventory.filter(
      (c) =>
        !c.hidden &&
        (mode !== 'rent' ||
          ((c.origin || 'local') === 'local' &&
            c.rentable === true &&
            c.available !== false &&
            rentalRate(c) > 0)) &&
        (brand === 'All' ||
          c.make.toLowerCase().includes(brand.toLowerCase())) &&
        (model === 'All' || c.model === model) &&
        (body === 'Any' || c.body === body) &&
        (fuel === 'Any' || c.fuel === fuel) &&
        (minPrice === 'Any' ||
          (mode === 'rent' ? rentalRate(c) : c.price) >= Number(minPrice)) &&
        (maxPrice === 'Any' ||
          (mode === 'rent' ? rentalRate(c) : c.price) <= Number(maxPrice)) &&
        (minYear === 'Any' || c.year >= Number(minYear)) &&
        (origin === 'Any' || (c.origin || 'local') === origin) &&
        (country === 'Any' || c.country === country) &&
        (importRegion === 'Any' || c.importRegion === importRegion) &&
        (location === 'Any' || (c.city || c.location) === location) &&
        (engineMax === 'Any' ||
          Number(c.engineLitres || 0) <= Number(engineMax)) &&
        (sellerType === 'Any' || c.sellerType === sellerType) &&
        (!verifiedOnly || c.verified === true) &&
        (!availableOnly || c.available !== false) &&
        (!latestOnly || Number(c.listedDaysAgo ?? 999) <= 7) &&
        (color === 'Any' || c.color === color) &&
        (transmission === 'Any' || c.transmission === transmission) &&
        (drivetrain === 'Any' || c.drivetrain === drivetrain) &&
        (maxKm === 'Any' || c.km <= Number(maxKm)) &&
        (doors === 'Any' || c.doors === Number(doors)) &&
        (seats === 'Any' || c.seats === Number(seats)) &&
        [
          c.make,
          c.model,
          c.location,
          c.city,
          c.country,
          c.importRegion,
          c.fuel,
          c.body,
          c.color,
          c.transmission,
          c.sellerType,
          localize(c.country, lang),
          localize(c.importRegion, lang),
          localize(c.fuel, lang),
          localize(c.body, lang),
          localize(c.color, lang),
          localize(c.transmission, lang),
          localize(c.sellerType, lang),
          c.origin === 'abroad' ? m.abroad : m.local,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    const priceForMode = (car: Car) =>
      mode === 'rent' ? rentalRate(car) : car.price;
    if (sort === 'price-low')
      r = [...r].sort((a, b) => priceForMode(a) - priceForMode(b));
    if (sort === 'price-high')
      r = [...r].sort((a, b) => priceForMode(b) - priceForMode(a));
    if (sort === 'newest') r = [...r].sort((a, b) => b.year - a.year);
    if (sort === 'oldest') r = [...r].sort((a, b) => a.year - b.year);
    if (sort === 'mileage') r = [...r].sort((a, b) => a.km - b.km);
    if (sort === 'engine')
      r = [...r].sort(
        (a, b) => Number(a.engineLitres || 0) - Number(b.engineLitres || 0),
      );
    return r;
  }, [
    inventory,
    mode,
    lang,
    m.local,
    m.abroad,
    brand,
    model,
    body,
    fuel,
    minPrice,
    maxPrice,
    minYear,
    location,
    origin,
    country,
    importRegion,
    engineMax,
    sellerType,
    verifiedOnly,
    availableOnly,
    latestOnly,
    color,
    transmission,
    drivetrain,
    maxKm,
    doors,
    seats,
    query,
    sort,
  ]);
  const chooseBrand = (name: string) => {
    setBrand(name);
    setModel('All');
    setPage(1);
  };
  const selectMode = (next: 'buy' | 'rent' | 'parts') => {
    if (next !== mode) {
      setMinPrice('Any');
      setMaxPrice('Any');
      setSort('recommended');
      setCompare([]);
      setCompareOpen(false);
    }
    setMode(next);
    setPage(1);
    if (next === 'rent') {
      const rentableInventory = inventory.filter(
        (car) =>
          !car.hidden &&
          (car.origin || 'local') === 'local' &&
          car.rentable === true &&
          car.available !== false &&
          rentalRate(car) > 0,
      );
      const brandStillAvailable =
        brand === 'All' ||
        rentableInventory.some((car) =>
          car.make.toLowerCase().includes(brand.toLowerCase()),
        );
      const modelStillAvailable =
        model === 'All' ||
        rentableInventory.some(
          (car) =>
            car.model === model &&
            (brand === 'All' ||
              car.make.toLowerCase().includes(brand.toLowerCase())),
        );
      if (!brandStillAvailable) setBrand('All');
      if (!brandStillAvailable || !modelStillAvailable) setModel('All');
      setOrigin('local');
      setImportRegion('Any');
    }
  };
  const headerNavigate = (next: 'buy' | 'rent' | 'parts') => {
    selectMode(next);
    setHeroVisible(false);
    setTimeout(
      () =>
        document
          .getElementById('inventory')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      0,
    );
  };
  const reset = () => {
    setPage(1);
    setQuery('');
    setBrand('All');
    setModel('All');
    setBody('Any');
    setFuel('Any');
    setMinPrice('Any');
    setMaxPrice('Any');
    setMinYear('Any');
    setLocation('Any');
    setOrigin('Any');
    setCountry('Any');
    setImportRegion('Any');
    setEngineMax('Any');
    setSellerType('Any');
    setVerifiedOnly(false);
    setAvailableOnly(false);
    setLatestOnly(false);
    setColor('Any');
    setTransmission('Any');
    setDrivetrain('Any');
    setMaxKm('Any');
    setDoors('Any');
    setSeats('Any');
  };
  const activeFilters = [
    query && [`“${query}”`, () => setQuery('')],
    brand !== 'All' && [brand, () => chooseBrand('All')],
    model !== 'All' && [model, () => setModel('All')],
    body !== 'Any' && [localize(body, lang), () => setBody('Any')],
    fuel !== 'Any' && [localize(fuel, lang), () => setFuel('Any')],
    minPrice !== 'Any' && [
      `≥ ${money(Number(minPrice), lang)}${mode === 'rent' ? `/${f.day}` : ''}`,
      () => setMinPrice('Any'),
    ],
    maxPrice !== 'Any' && [
      `${m.under} ${money(Number(maxPrice), lang)}${mode === 'rent' ? `/${f.day}` : ''}`,
      () => setMaxPrice('Any'),
    ],
    minYear !== 'Any' && [`${minYear}+`, () => setMinYear('Any')],
    location !== 'Any' && [location, () => setLocation('Any')],
    origin !== 'Any' &&
      mode !== 'rent' && [
        origin === 'local' ? m.local : m.abroad,
        () => setOrigin('Any'),
      ],
    country !== 'Any' && [localize(country, lang), () => setCountry('Any')],
    importRegion !== 'Any' && [
      localize(importRegion, lang),
      () => setImportRegion('Any'),
    ],
    engineMax !== 'Any' && [`≤ ${engineMax} L`, () => setEngineMax('Any')],
    sellerType !== 'Any' && [
      localize(sellerType, lang),
      () => setSellerType('Any'),
    ],
    verifiedOnly && [m.verifiedOnly, () => setVerifiedOnly(false)],
    availableOnly && [m.availableOnly, () => setAvailableOnly(false)],
    latestOnly && [m.latestOnly, () => setLatestOnly(false)],
    color !== 'Any' && [localize(color, lang), () => setColor('Any')],
    transmission !== 'Any' && [
      localize(transmission, lang),
      () => setTransmission('Any'),
    ],
    drivetrain !== 'Any' && [drivetrain, () => setDrivetrain('Any')],
    maxKm !== 'Any' && [`≤ ${Number(maxKm) / 1000}k km`, () => setMaxKm('Any')],
    doors !== 'Any' && [`${doors} ${m.doorCount}`, () => setDoors('Any')],
    seats !== 'Any' && [`${seats} ${m.seatCount}`, () => setSeats('Any')],
  ].filter(Boolean) as [string, () => void][];
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleCars = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  return (
    <main>
      <header className="topbar">
        <button
          className="logo"
          onClick={() => {
            setHeroVisible(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span>JF</span>cars<i>.</i>
        </button>
        <nav>
          <button
            className={mode === 'buy' && !heroVisible ? 'active' : ''}
            onClick={() => headerNavigate('buy')}
          >
            {u.buyCar}
          </button>
          <button
            className={mode === 'rent' && !heroVisible ? 'active' : ''}
            onClick={() => headerNavigate('rent')}
          >
            {u.rentCar}
          </button>
          <button
            className={mode === 'parts' && !heroVisible ? 'active' : ''}
            onClick={() => headerNavigate('parts')}
          >
            {u.parts}
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setHeroVisible(false);
                setPanel('admin');
              }}
            >
              Admin
            </button>
          )}
        </nav>
        <div className="actions">
          <div className="lang">
            <Languages size={17} />
            <select
              aria-label={a.language}
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
          </div>
          <button
            className="saved"
            aria-label={u.cart}
            onClick={() => setPanel('cart')}
          >
            <ShoppingCart size={18} />
            <span>{u.cart}</span>
            {cart.length + rentalCart.length > 0 && (
              <b>{cart.length + rentalCart.length}</b>
            )}
          </button>
          <button
            className="account"
            aria-label={user ? user.name : u.signIn}
            onClick={() => setPanel(user ? 'profile' : 'auth')}
          >
            <User size={18} />
            <span>{user ? user.name.split(' ')[0] : u.signIn}</span>
          </button>
          <button className="sell" onClick={() => setSellOpen(true)}>
            {t.sell}
            <ArrowRight size={17} />
          </button>
          <button
            className="menu"
            aria-label={a.menu}
            onClick={() => setMobileMenu((v) => !v)}
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {mobileMenu && (
        <nav className="mobile-nav">
          <button
            onClick={() => {
              headerNavigate('buy');
              setMobileMenu(false);
            }}
          >
            {u.buyCar}
          </button>
          <button
            onClick={() => {
              headerNavigate('rent');
              setMobileMenu(false);
            }}
          >
            {u.rentCar}
          </button>
          <button
            onClick={() => {
              headerNavigate('parts');
              setMobileMenu(false);
            }}
          >
            {u.parts}
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setHeroVisible(false);
                setPanel('admin');
                setMobileMenu(false);
              }}
            >
              Admin console
            </button>
          )}
        </nav>
      )}
      {heroVisible && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={15} /> {f.eyebrow}
            </p>
            <h1>{storefrontContent[lang]?.headline || t.hero}</h1>
            <p>{storefrontContent[lang]?.description || t.sub}</p>
            <div className="searchbar">
              <Search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
              />
              {query && (
                <button
                  className="clear"
                  onClick={() => setQuery('')}
                  aria-label={a.clearSearch}
                >
                  <X />
                </button>
              )}
              <button
                className="searchbtn"
                onClick={() =>
                  document
                    .getElementById('inventory')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {t.go}
                <ArrowRight />
              </button>
            </div>
            <div className="quick">
              <span>{t.quick}:</span>
              {f.quick.map((label, index) => (
                <button
                  key={label}
                  onClick={() =>
                    index === 0
                      ? setFuel('Electric')
                      : index === 1
                        ? setBody('SUV')
                        : setMaxPrice('20000000')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-art">
            <Image
              src="/jfcars-central-africa-hero.webp"
              alt={a.heroAlt}
              width={1600}
              height={900}
              priority
            />
            <div className="stat">
              <b>5</b>
              <span>{f.markets}</span>
            </div>
            <div className="shape shape-one" />
            <div className="shape shape-two" />
          </div>
        </section>
      )}
      <section className="trust">
        {m.trust.map((x) => (
          <span key={x}>
            <Check />
            {x}
          </span>
        ))}
      </section>
      <section
        className={`brand-search ${mode === 'parts' ? 'parts-mode' : ''}`}
        id="inventory"
      >
        <div className="mode-tabs">
          <button
            className={mode === 'buy' ? 'active' : ''}
            onClick={() => selectMode('buy')}
          >
            <CarFront />
            {u.buy}
          </button>
          <button
            className={mode === 'rent' ? 'active' : ''}
            onClick={() => selectMode('rent')}
          >
            <KeyRound />
            {u.rent}
          </button>
          <button
            className={mode === 'parts' ? 'active' : ''}
            onClick={() => selectMode('parts')}
          >
            <Cog />
            {u.partsDemand}
          </button>
        </div>
        {!heroVisible && mode !== 'parts' && (
          <div className="catalog-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter')
                  document
                    .querySelector('.inventory')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              placeholder={t.search}
              aria-label={t.search}
            />
            <button
              onClick={() =>
                document
                  .querySelector('.inventory')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              {t.go} <ArrowRight />
            </button>
          </div>
        )}
        <div className="brand-strip">
          <button
            className={brand === 'All' ? 'active' : ''}
            onClick={() => chooseBrand('All')}
          >
            <span className="all-brand">ALL</span>
            <b>{u.allMakes}</b>
          </button>
          {(mode === 'rent'
            ? brands.filter((brandOption) =>
                directoryBrands.some(
                  (availableBrand) => availableBrand.name === brandOption.name,
                ),
              )
            : brands.slice(0, 7)
          ).map((b) => (
            <button
              key={b.name}
              className={brand == b.name ? 'active' : ''}
              onClick={() => {
                chooseBrand(b.name);
              }}
            >
              <BrandLogo name={b.name} slug={b.slug} />
              <b>{b.name}</b>
            </button>
          ))}
        </div>
        {brand !== 'All' && (
          <div className="model-row">
            <span>{u.models}</span>
            <button
              className={model === 'All' ? 'active' : ''}
              onClick={() => setModel('All')}
            >
              {u.allModels.replace('{brand}', brand)}
            </button>
            {Array.from(
              new Set(
                modeInventory
                  .filter((car) =>
                    car.make.toLowerCase().includes(brand.toLowerCase()),
                  )
                  .map((car) => car.model),
              ),
            ).map((availableModel) => (
              <button
                key={availableModel}
                className={model === availableModel ? 'active' : ''}
                onClick={() => setModel(availableModel)}
              >
                {availableModel}
              </button>
            ))}
          </div>
        )}
        <div className="quick-filters">
          <span>{u.refine}</span>
          <button
            onClick={() => setMaxPrice(mode === 'rent' ? '60000' : '20000000')}
          >
            {mode === 'rent' ? m.rentUnder : f.quick[2]}
          </button>
          <button onClick={() => setBody('SUV')}>SUV</button>
          <button onClick={() => setFuel('Electric')}>{f.quick[0]}</button>
          <button onClick={reset}>{u.clear}</button>
        </div>
        {activeFilters.length > 0 && (
          <div className="selected-filters">
            <b>{u.selected}</b>
            {activeFilters.map(([label, clear]) => (
              <button key={label} onClick={clear}>
                {label}
                <X />
              </button>
            ))}
            <button className="clear-filters" onClick={reset}>
              {u.clear}
            </button>
          </div>
        )}
      </section>
      {mode === 'parts' ? (
        <PartsPanel
          lang={lang}
          onRequest={async (request) => {
            try {
              const response = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  action: 'part-request',
                  payload: request,
                }),
              });
              if (!response.ok) return null;
              const data = (await response.json()) as { item: PartRequest };
              setPartRequests((items) => [data.item, ...items]);
              if (authenticated)
                setAccountPartRequestCount((count) => count + 1);
              return data.item;
            } catch {
              return null;
            }
          }}
        />
      ) : (
        <section className="market">
          <aside className={mobileFilters ? 'filters open' : 'filters'}>
            <div className="directory-title">
              <h2>{m.browse}</h2>
              <span>
                {modeInventory.filter((c) => !c.hidden).length} {m.listings}
              </span>
            </div>
            <div className="az-grid">
              {letters.map((l) => (
                <button
                  key={l}
                  disabled={!directoryBrands.some((b) => b.name.startsWith(l))}
                  onClick={() => {
                    const match = directoryBrands.find((b) =>
                      b.name.startsWith(l),
                    );
                    if (match) chooseBrand(match.name);
                  }}
                  aria-label={`${m.browse}: ${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="brand-list">
              <button
                className={brand === 'All' ? 'active' : ''}
                onClick={() => chooseBrand('All')}
              >
                <span>{m.allBrands}</span>
                <b>{modeInventory.filter((c) => !c.hidden).length}</b>
              </button>
              {directoryBrands.map((b) => (
                <button
                  key={b.name}
                  className={brand == b.name ? 'active' : ''}
                  onClick={() => chooseBrand(b.name)}
                >
                  <span>{b.name}</span>
                  <b>{b.count}</b>
                </button>
              ))}
            </div>
            <div className="filter-head">
              <h2>{t.filters}</h2>
              <button onClick={reset}>{t.reset}</button>
              <button
                className="filter-close"
                onClick={() => setMobileFilters(false)}
                aria-label={a.closeFilters}
              >
                <X />
              </button>
            </div>
            {mode !== 'rent' && (
              <Filter
                title={m.source}
                value={origin}
                set={(value) => {
                  setOrigin(value);
                  if (value === 'local') setImportRegion('Any');
                  if (value === 'abroad') {
                    setCountry('Any');
                    setLocation('Any');
                  }
                }}
                values={['Any', 'local', 'abroad']}
                labels={[t.any, m.local, m.abroad]}
              />
            )}
            {(mode === 'rent' || origin !== 'abroad') && (
              <Filter
                title={m.country}
                value={country}
                set={(value) => {
                  setCountry(value);
                  if (value !== 'Any') {
                    setOrigin('local');
                    setImportRegion('Any');
                  }
                  if (
                    location !== 'Any' &&
                    value !== 'Any' &&
                    !citiesByCountry[value]?.includes(location)
                  )
                    setLocation('Any');
                }}
                values={[
                  'Any',
                  'Republic of the Congo',
                  'Angola',
                  'Cameroon',
                  'Gabon',
                  'DR Congo',
                ]}
                labels={[
                  t.any,
                  ...[
                    'Republic of the Congo',
                    'Angola',
                    'Cameroon',
                    'Gabon',
                    'DR Congo',
                  ].map((value) => localize(value, lang)),
                ]}
              />
            )}
            {mode !== 'rent' && origin !== 'local' && (
              <Filter
                title={m.importRegion}
                value={importRegion}
                set={(value) => {
                  setImportRegion(value);
                  if (value !== 'Any') {
                    setOrigin('abroad');
                    setCountry('Any');
                    setLocation('Any');
                  }
                }}
                values={['Any', 'Europe', 'Asia', 'America']}
                labels={[
                  t.any,
                  ...['Europe', 'Asia', 'America'].map((value) =>
                    localize(value, lang),
                  ),
                ]}
              />
            )}
            {(mode === 'rent' || origin !== 'abroad') && (
              <Filter
                title={m.location}
                value={location}
                set={(value) => {
                  setLocation(value);
                  if (value !== 'Any') {
                    setOrigin('local');
                    setImportRegion('Any');
                    setCountry(countryForCity(value) || 'Any');
                  }
                }}
                values={[
                  'Any',
                  ...(country === 'Any'
                    ? Object.values(citiesByCountry).flat()
                    : citiesByCountry[country] || []),
                ]}
                labels={[
                  t.any,
                  ...(country === 'Any'
                    ? Object.values(citiesByCountry).flat()
                    : citiesByCountry[country] || []),
                ]}
              />
            )}
            <Filter
              title={mode === 'rent' ? m.dailyPrice : t.price}
              value={maxPrice}
              set={setMaxPrice}
              values={
                mode === 'rent'
                  ? ['Any', '30000', '40000', '50000', '60000']
                  : ['Any', '15000000', '20000000', '25000000', '30000000']
              }
              labels={
                mode === 'rent'
                  ? [t.any, '30k', '40k', '50k', `60k FCFA/${f.day}`]
                  : [t.any, '15M', '20M', '25M', '30M FCFA']
              }
            />
            <div className="custom-price-range">
              <label>
                {m.minPrice}
                {mode === 'rent' ? ` / ${f.day}` : ''}
                <input
                  type="number"
                  min="0"
                  step={mode === 'rent' ? '1000' : '100000'}
                  value={minPrice === 'Any' ? '' : minPrice}
                  onChange={(event) => setMinPrice(event.target.value || 'Any')}
                />
              </label>
              <label>
                {m.maxPrice}
                {mode === 'rent' ? ` / ${f.day}` : ''}
                <input
                  type="number"
                  min="0"
                  step={mode === 'rent' ? '1000' : '100000'}
                  value={maxPrice === 'Any' ? '' : maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value || 'Any')}
                />
              </label>
            </div>
            <Filter
              title={m.year}
              value={minYear}
              set={setMinYear}
              values={['Any', '2024', '2023', '2022', '2020']}
              labels={[t.any, '2024', '2023', '2022', '2020']}
            />
            <Filter
              title={t.body}
              value={body}
              set={setBody}
              values={[
                'Any',
                'SUV',
                'Sedan',
                'Hatchback',
                'Wagon',
                'Coupe',
                'Pickup',
                'Van',
              ]}
              labels={[
                t.any,
                'SUV',
                ...[
                  'Sedan',
                  'Hatchback',
                  'Wagon',
                  'Coupe',
                  'Pickup',
                  'Van',
                ].map((value) => localize(value, lang)),
              ]}
            />
            <Filter
              title={t.fuel}
              value={fuel}
              set={setFuel}
              values={['Any', 'Electric', 'Hybrid', 'Petrol', 'Diesel']}
              labels={[
                t.any,
                ...['Electric', 'Hybrid', 'Petrol', 'Diesel'].map((value) =>
                  localize(value, lang),
                ),
              ]}
            />
            <Filter
              title={m.engine}
              value={engineMax}
              set={setEngineMax}
              values={['Any', '1.6', '2', '3', '4']}
              labels={[t.any, '≤ 1.6 L', '≤ 2.0 L', '≤ 3.0 L', '≤ 4.0 L']}
            />
            <Filter
              title={m.sellerType}
              value={sellerType}
              set={setSellerType}
              values={['Any', 'Dealer', 'Private']}
              labels={[
                t.any,
                localize('Dealer', lang),
                localize('Private', lang),
              ]}
            />
            <Filter
              title={m.mileage}
              value={maxKm}
              set={setMaxKm}
              values={['Any', '20000', '40000', '60000']}
              labels={[t.any, '≤20k', '≤40k', '≤60k']}
            />
            <Filter
              title={m.transmission}
              value={transmission}
              set={setTransmission}
              values={['Any', 'Automatic', 'Manual']}
              labels={[
                t.any,
                localize('Automatic', lang),
                localize('Manual', lang),
              ]}
            />
            <Filter
              title={m.drivetrain}
              value={drivetrain}
              set={setDrivetrain}
              values={['Any', 'FWD', 'RWD', 'AWD']}
              labels={[t.any, 'FWD', 'RWD', 'AWD']}
            />
            <Filter
              title={m.color}
              value={color}
              set={setColor}
              values={[
                'Any',
                'Black',
                'White',
                'Silver',
                'Blue',
                'Yellow',
                'Sage',
              ]}
              labels={[
                t.any,
                ...['Black', 'White', 'Silver', 'Blue', 'Yellow', 'Sage'].map(
                  (value) => localize(value, lang),
                ),
              ]}
            />
            <Filter
              title={m.doors}
              value={doors}
              set={setDoors}
              values={['Any', '2', '4', '5']}
              labels={[t.any, '2', '4', '5']}
            />
            <Filter
              title={m.seats}
              value={seats}
              set={setSeats}
              values={['Any', '2', '5', '7']}
              labels={[t.any, '2', '5', '7']}
            />
            <button
              className="show-results"
              onClick={() => setMobileFilters(false)}
            >
              {m.show} {filtered.length} {m.cars}
            </button>
          </aside>
          <div className="inventory">
            <div className="inventory-head">
              <div>
                <p>{mode === 'rent' ? m.rentReady : t.popular}</p>
                <h2>
                  {filtered.length} {mode === 'rent' ? m.trip : t.results}
                </h2>
              </div>
              <div>
                <button
                  className="mobile-filter"
                  onClick={() => setMobileFilters(true)}
                >
                  <SlidersHorizontal /> {t.filters}
                  {activeFilters.length > 0 && ` (${activeFilters.length})`}
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label={t.sort}
                >
                  <option value="recommended">{t.sort}</option>
                  <option value="price-low">{m.sort[0]}</option>
                  <option value="price-high">{m.sort[1]}</option>
                  <option value="newest">{m.sort[2]}</option>
                  <option value="oldest">{m.sort[3]}</option>
                  <option value="mileage">{m.sort[4]}</option>
                  <option value="engine">{m.sort[5]}</option>
                </select>
              </div>
            </div>
            <div className="listing-flags" aria-label={u.refine}>
              <button
                className={verifiedOnly ? 'active' : ''}
                onClick={() => setVerifiedOnly((value) => !value)}
                aria-pressed={verifiedOnly}
              >
                <Check /> {m.verifiedOnly}
              </button>
              <button
                className={availableOnly ? 'active' : ''}
                onClick={() => setAvailableOnly((value) => !value)}
                aria-pressed={availableOnly}
              >
                <CarFront /> {m.availableOnly}
              </button>
              <button
                className={latestOnly ? 'active' : ''}
                onClick={() => setLatestOnly((value) => !value)}
                aria-pressed={latestOnly}
              >
                <Sparkles /> {m.latestOnly}
              </button>
              <button
                className={sellerType === 'Private' ? 'active' : ''}
                onClick={() =>
                  setSellerType((value) =>
                    value === 'Private' ? 'Any' : 'Private',
                  )
                }
                aria-pressed={sellerType === 'Private'}
              >
                <User /> {m.privateOnly}
              </button>
            </div>
            {filtered.length ? (
              <div
                className={
                  activeFilters.length ? 'car-grid list-view' : 'car-grid'
                }
              >
                {visibleCars.map((car) => (
                  <article className="car-card" key={car.id}>
                    <div className="photo">
                      <Image
                        src={car.image}
                        alt={`${car.make} ${car.model}`}
                        width={960}
                        height={600}
                        unoptimized
                      />
                      <button
                        className="details-hitbox"
                        aria-label={`${u.details}: ${car.make} ${car.model}`}
                        onClick={() => setSelectedCar(car)}
                      />
                      <span className="badge">
                        {mode === 'rent'
                          ? m.rentalTerms
                          : localize(car.badge, lang)}
                      </span>
                      {car.sample && (
                        <span className="sample-badge">
                          {lang === 'fr'
                            ? 'Annonce exemple'
                            : lang === 'es'
                              ? 'Anuncio de muestra'
                              : 'Sample listing'}
                        </span>
                      )}
                      <button
                        className={
                          saved.includes(car.id) ? 'heart on' : 'heart'
                        }
                        aria-label={
                          lang === 'fr'
                            ? 'Ajouter aux favoris'
                            : lang === 'es'
                              ? 'Guardar vehículo'
                              : 'Save car'
                        }
                        onClick={() =>
                          setSaved((s) =>
                            s.includes(car.id)
                              ? s.filter((x) => x !== car.id)
                              : [...s, car.id],
                          )
                        }
                      >
                        <Heart
                          fill={
                            saved.includes(car.id) ? 'currentColor' : 'none'
                          }
                        />
                      </button>
                    </div>
                    <div className="card-body">
                      <div className="car-title">
                        <div>
                          <p>
                            {car.year} · {localize(car.fuel, lang)} ·{' '}
                            {car.origin === 'abroad' ? m.abroad : m.local}
                          </p>
                          <h3>
                            {car.make} {car.model}
                          </h3>
                        </div>
                        <h4>
                          {mode === 'rent'
                            ? `${money(rentalRate(car), lang)}/${f.day}`
                            : money(car.price, lang)}
                        </h4>
                      </div>
                      <div className="meta">
                        <span>{numberFor(car.km, lang)} km</span>
                        <span>{localize(car.body, lang)}</span>
                        <span>
                          <MapPin /> {carPlace(car, lang)}
                        </span>
                        <span>
                          {Number(car.listedDaysAgo || 0) === 0
                            ? m.listedToday
                            : `${car.listedDaysAgo} ${
                                car.listedDaysAgo === 1 ? m.dayAgo : m.daysAgo
                              }`}
                        </span>
                      </div>
                      <div className="verified">
                        <Check />{' '}
                        {mode === 'rent'
                          ? u.insurance
                          : car.verified
                            ? u.inspected
                            : localize(car.sellerType, lang)}
                        <span>
                          {mode === 'rent'
                            ? u.options
                            : `${
                                car.available === false
                                  ? m.onDemand
                                  : car.origin === 'abroad'
                                    ? m.abroadAvailability
                                    : m.localAvailability
                              } · ${localize(car.transmission, lang)} · ${car.drivetrain}`}
                        </span>
                      </div>
                      {car.origin === 'abroad' && (
                        <p className="import-note">{m.importNote}</p>
                      )}
                      <div className="card-actions">
                        <button
                          onClick={() =>
                            setCompare((s) =>
                              s.includes(car.id)
                                ? s.filter((x) => x !== car.id)
                                : s.length < 3
                                  ? [...s, car.id]
                                  : s,
                            )
                          }
                          className={
                            compare.includes(car.id)
                              ? 'compare selected'
                              : 'compare'
                          }
                        >
                          <GitCompareArrows />
                          {compare.includes(car.id) ? u.added : t.compare}
                        </button>
                        <button
                          className={
                            (mode === 'rent' ? rentalCart : cart).includes(
                              car.id,
                            )
                              ? 'view in-cart'
                              : 'view'
                          }
                          onClick={() =>
                            mode === 'rent'
                              ? setRentalCart((s) =>
                                  s.includes(car.id) ? s : [...s, car.id],
                                )
                              : setCart((s) =>
                                  s.includes(car.id) ? s : [...s, car.id],
                                )
                          }
                        >
                          {(mode === 'rent' ? rentalCart : cart).includes(
                            car.id,
                          )
                            ? u.inCart
                            : mode === 'rent'
                              ? u.book
                              : u.addCart}
                          <ShoppingCart />
                        </button>
                      </div>
                      <button
                        className="card-details"
                        onClick={() => setSelectedCar(car)}
                      >
                        {f.viewDetails} <ArrowRight />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <CarFront />
                <h3>{t.empty}</h3>
                <p>{t.emptySub}</p>
                <button onClick={reset}>{t.reset}</button>
              </div>
            )}
            {filtered.length > pageSize && (
              <nav className="pagination" aria-label={a.inventoryPages}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  aria-label={a.previousPage}
                >
                  <ChevronLeft />
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (number) => (
                    <button
                      key={number}
                      className={currentPage === number ? 'active' : ''}
                      onClick={() => setPage(number)}
                      aria-current={currentPage === number ? 'page' : undefined}
                    >
                      {number}
                    </button>
                  ),
                )}
                <button
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                  aria-label={a.nextPage}
                >
                  <ChevronRight />
                </button>
              </nav>
            )}
          </div>
        </section>
      )}
      <section className="sell-band">
        <div>
          <p>{f.sellEyebrow}</p>
          <h2>{t.sellCta}</h2>
          <span>{t.sellSub}</span>
        </div>
        <button onClick={() => setSellOpen(true)}>
          {t.start}
          <ArrowRight />
        </button>
      </section>
      {compare.length > 0 && (
        <div className="compare-bar">
          <div>
            <GitCompareArrows />
            <span>
              <b>{compare.length}</b> {m.cars} {m.selected}
            </span>
          </div>
          <div>
            <button onClick={() => setCompare([])}>{u.clear}</button>
            <button
              disabled={compare.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              {m.compareNow} <ArrowRight />
            </button>
          </div>
        </div>
      )}
      {compareOpen && (
        <ComparePanel
          cars={modeInventory.filter((c) => compare.includes(c.id))}
          close={() => setCompareOpen(false)}
          remove={(id) => {
            const next = compare.filter((x) => x !== id);
            setCompare(next);
            if (next.length < 2) setCompareOpen(false);
          }}
          add={(id) =>
            mode === 'rent'
              ? setRentalCart((items) =>
                  items.includes(id) ? items : [...items, id],
                )
              : setCart((items) =>
                  items.includes(id) ? items : [...items, id],
                )
          }
          lang={lang}
          mode={mode}
        />
      )}
      {selectedCar && (
        <VehicleDetails
          car={selectedCar}
          lang={lang}
          mode={mode}
          inCart={(mode === 'rent' ? rentalCart : cart).includes(
            selectedCar.id,
          )}
          close={() => setSelectedCar(null)}
          add={() =>
            mode === 'rent'
              ? setRentalCart((s) =>
                  s.includes(selectedCar.id) ? s : [...s, selectedCar.id],
                )
              : setCart((s) =>
                  s.includes(selectedCar.id) ? s : [...s, selectedCar.id],
                )
          }
          onInquiry={async (inquiry) => {
            try {
              const response = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  action: 'seller-inquiry',
                  payload: inquiry,
                }),
              });
              if (!response.ok) return false;
              const data = (await response.json()) as {
                item: SellerInquiry;
              };
              setSellerInquiries((items) => [data.item, ...items]);
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
      {panel && panel !== 'admin' && (
        <AccountLayer
          panel={panel}
          close={() => setPanel(null)}
          goAuth={() => setPanel('auth')}
          user={user}
          setUser={setUser}
          authMode={authMode}
          setAuthMode={setAuthMode}
          cart={cart}
          setCart={setCart}
          rentalCart={rentalCart}
          setRentalCart={setRentalCart}
          inventory={inventory}
          saved={saved}
          partRequestCount={
            authenticated ? accountPartRequestCount : partRequests.length
          }
          orders={userOrders}
          setOrders={setUserOrders}
          lang={lang}
        />
      )}{' '}
      {panel === 'admin' && isAdmin && (
        <AdminPanel
          inventory={inventory}
          setInventory={(items) => {
            setAdminSyncError(false);
            setInventory(items);
            setAdminRevision((revision) => revision + 1);
          }}
          partRequests={partRequests}
          setPartRequests={setPartRequests}
          sellerInquiries={sellerInquiries}
          setSellerInquiries={setSellerInquiries}
          storefrontContent={storefrontContent}
          setStorefrontContent={(content) => {
            setAdminSyncError(false);
            setStorefrontContent(content);
            setAdminRevision((revision) => revision + 1);
          }}
          orders={orders}
          setOrders={setOrders}
          sellRequests={sellRequests}
          setSellRequests={setSellRequests}
          persistenceError={adminSyncError}
          close={() => setPanel(null)}
        />
      )}
      {sellOpen && (
        <SellCarPanel
          lang={lang}
          close={() => setSellOpen(false)}
          onSubmit={async (car) => {
            try {
              const response = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  action: 'sell-request',
                  payload: car,
                }),
              });
              if (!response.ok) return false;
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
      {infoTopic && (
        <InfoPanel
          lang={lang}
          topic={infoTopic}
          close={() => setInfoTopic(null)}
        />
      )}
      <footer>
        <button
          className="logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span>JF</span>cars<i>.</i>
        </button>
        <p>{m.tagline} © 2026 JFcars</p>
        <div>
          <button onClick={() => setInfoTopic('help')}>{m.help}</button>
          <button onClick={() => setInfoTopic('privacy')}>{m.privacy}</button>
          <button onClick={() => setInfoTopic('terms')}>{m.terms}</button>
        </div>
      </footer>
    </main>
  );
}

function InfoPanel({
  lang,
  topic,
  close,
}: {
  lang: Lang;
  topic: 'help' | 'privacy' | 'terms';
  close: () => void;
}) {
  const f = flowCopy[lang];
  const content = {
    help: [f.helpTitle, f.helpText],
    privacy: [f.privacyTitle, f.privacyText],
    terms: [f.termsTitle, f.termsText],
  }[topic];
  useDialog(close);
  return (
    <div
      className="layer compact-layer"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
      role="presentation"
    >
      <dialog open className="compact-dialog" aria-label={content[0]}>
        <button
          className="drawer-close"
          onClick={close}
          aria-label={ui[lang].close}
        >
          <X />
        </button>
        <p className="auth-kicker">JFCARS</p>
        <h2>{content[0]}</h2>
        <p>{content[1]}</p>
        <button className="dialog-primary" onClick={close}>
          {flowCopy[lang].browse}
        </button>
      </dialog>
    </div>
  );
}

function SellCarPanel({
  lang,
  close,
  onSubmit,
}: {
  lang: Lang;
  close: () => void;
  onSubmit: (car: Car) => Promise<boolean>;
}) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [listingOrigin, setListingOrigin] = useState<'local' | 'abroad'>(
    'local',
  );
  const [listingCountry, setListingCountry] = useState('Republic of the Congo');
  const f = flowCopy[lang];
  const s = {
    en: {
      make: 'Make',
      model: 'Model',
      year: 'Year',
      price: 'Price (FCFA)',
      mileage: 'Mileage',
      source: 'Where is the car now?',
      local: 'Local stock',
      abroad: 'Abroad stock',
      country: 'Country',
      city: 'City',
      region: 'Import region',
      engine: 'Engine size (litres; 0 for electric)',
      fuel: 'Fuel',
      body: 'Body',
      color: 'Color',
      photo: 'Main photo URL',
      photos: 'More photo URLs',
      onePerLine: 'One URL per line',
    },
    fr: {
      make: 'Marque',
      model: 'Modèle',
      year: 'Année',
      price: 'Prix (FCFA)',
      mileage: 'Kilométrage',
      source: 'Où se trouve la voiture ?',
      local: 'Stock local',
      abroad: 'Stock à l’étranger',
      country: 'Pays',
      city: 'Ville',
      region: 'Région d’importation',
      engine: 'Cylindrée (litres ; 0 si électrique)',
      fuel: 'Énergie',
      body: 'Carrosserie',
      color: 'Couleur',
      photo: 'URL de la photo principale',
      photos: 'Autres URL de photos',
      onePerLine: 'Une URL par ligne',
    },
    es: {
      make: 'Marca',
      model: 'Modelo',
      year: 'Año',
      price: 'Precio (FCFA)',
      mileage: 'Kilometraje',
      source: '¿Dónde está el coche?',
      local: 'Stock local',
      abroad: 'Stock en el extranjero',
      country: 'País',
      city: 'Ciudad',
      region: 'Región de importación',
      engine: 'Cilindrada (litros; 0 si es eléctrico)',
      fuel: 'Combustible',
      body: 'Carrocería',
      color: 'Color',
      photo: 'URL de la foto principal',
      photos: 'Más URL de fotos',
      onePerLine: 'Una URL por línea',
    },
  }[lang];
  useDialog(close);
  return (
    <div
      className="layer compact-layer"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
      role="presentation"
    >
      <dialog
        open
        className="compact-dialog sell-dialog"
        aria-label={f.sellTitle}
      >
        <button
          className="drawer-close"
          onClick={close}
          aria-label={ui[lang].close}
        >
          <X />
        </button>
        {sent ? (
          <div className="checkout-success">
            <Check />
            <h3>{f.sellDone}</h3>
            <button onClick={close}>{f.browse}</button>
          </div>
        ) : (
          <>
            <p className="auth-kicker">{f.sellEyebrow}</p>
            <h2>{f.sellTitle}</h2>
            <p>{f.sellText}</p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const image = formValue(data, 'image', cars[0].image);
                const selectedOrigin = formValue(
                  data,
                  'origin',
                  'local',
                ) as Car['origin'];
                const city = formValue(data, 'city');
                const selectedCountry = formValue(data, 'country');
                const selectedRegion = formValue(data, 'importRegion') as
                  | Car['importRegion']
                  | '';
                setSubmitting(true);
                setSubmitError(false);
                const saved = await onSubmit({
                  id: Date.now(),
                  make: formValue(data, 'make'),
                  model: formValue(data, 'model'),
                  year: Number(formValue(data, 'year')),
                  price: Number(formValue(data, 'price')),
                  km: Number(formValue(data, 'km')),
                  fuel: formValue(data, 'fuel', 'Petrol'),
                  body: formValue(data, 'body', 'SUV'),
                  origin: selectedOrigin,
                  country:
                    selectedOrigin === 'local' ? selectedCountry : undefined,
                  city: selectedOrigin === 'local' ? city : undefined,
                  importRegion:
                    selectedOrigin === 'abroad'
                      ? selectedRegion || undefined
                      : undefined,
                  location:
                    selectedOrigin === 'abroad'
                      ? selectedRegion || 'Europe'
                      : city,
                  engineLitres: Number(formValue(data, 'engineLitres', '0')),
                  sellerType: 'Private',
                  verified: false,
                  available: true,
                  listedDaysAgo: 0,
                  image,
                  images: formImages(data, image),
                  badge: 'Pending review',
                  color: formValue(data, 'color', 'Black'),
                  transmission: 'Automatic',
                  drivetrain: 'FWD',
                  doors: 5,
                  seats: 5,
                  hidden: true,
                });
                setSubmitting(false);
                if (saved) setSent(true);
                else setSubmitError(true);
              }}
            >
              <div className="sell-form-grid">
                <label>
                  {s.make}
                  <input name="make" required />
                </label>
                <label>
                  {s.model}
                  <input name="model" required />
                </label>
                <label>
                  {s.year}
                  <input
                    name="year"
                    type="number"
                    min="1990"
                    max="2027"
                    required
                  />
                </label>
                <label>
                  {s.price}
                  <input name="price" type="number" min="1" required />
                </label>
                <label>
                  {s.mileage}
                  <input name="km" type="number" min="0" required />
                </label>
                <label>
                  {s.source}
                  <select
                    name="origin"
                    value={listingOrigin}
                    onChange={(event) =>
                      setListingOrigin(event.target.value as 'local' | 'abroad')
                    }
                  >
                    <option value="local">{s.local}</option>
                    <option value="abroad">{s.abroad}</option>
                  </select>
                </label>
                {listingOrigin === 'local' ? (
                  <>
                    <label>
                      {s.country}
                      <select
                        name="country"
                        value={listingCountry}
                        onChange={(event) =>
                          setListingCountry(event.target.value)
                        }
                        required
                      >
                        {[
                          'Republic of the Congo',
                          'Angola',
                          'Cameroon',
                          'Gabon',
                          'DR Congo',
                        ].map((value) => (
                          <option key={value} value={value}>
                            {localize(value, lang)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {s.city}
                      <select name="city" key={listingCountry} required>
                        {citiesByCountry[listingCountry].map((city) => (
                          <option key={city}>{city}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : (
                  <label>
                    {s.region}
                    <select name="importRegion" required>
                      {['Europe', 'Asia', 'America'].map((value) => (
                        <option key={value} value={value}>
                          {localize(value, lang)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {s.engine}
                  <input
                    name="engineLitres"
                    type="number"
                    min="0"
                    max="12"
                    step="0.1"
                    defaultValue="2"
                    required
                  />
                </label>
                <label>
                  {s.fuel}
                  <select name="fuel">
                    {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((value) => (
                      <option key={value} value={value}>
                        {localize(value, lang)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {s.body}
                  <select name="body">
                    {['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van'].map(
                      (value) => (
                        <option key={value} value={value}>
                          {localize(value, lang)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  {s.color}
                  <select name="color" defaultValue="Black">
                    {['Black', 'White', 'Silver', 'Blue', 'Yellow'].map(
                      (value) => (
                        <option key={value} value={value}>
                          {localize(value, lang)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  {s.photo}
                  <input
                    name="image"
                    type="url"
                    placeholder="https://…"
                    required
                  />
                </label>
                <label className="span-two">
                  {s.photos}
                  <textarea name="images" placeholder={s.onePerLine} />
                </label>
              </div>
              <button className="dialog-primary" disabled={submitting}>
                {submitting
                  ? lang === 'fr'
                    ? 'Envoi…'
                    : lang === 'es'
                      ? 'Enviando…'
                      : 'Sending…'
                  : copy[lang].start}{' '}
                <ArrowRight />
              </button>
              {submitError && (
                <p className="form-notice" role="alert">
                  {lang === 'fr'
                    ? 'Impossible d’envoyer l’annonce. Réessayez.'
                    : lang === 'es'
                      ? 'No se pudo enviar el anuncio. Inténtalo de nuevo.'
                      : 'We could not submit your listing. Please try again.'}
                </p>
              )}
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}

function Filter({
  title,
  value,
  set,
  values,
  labels,
}: {
  title: string;
  value: string;
  set: (v: string) => void;
  values: string[];
  labels: string[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="filter-group">
      <button
        className="filter-title"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <h3>{title}</h3>
        <ChevronDown className={open ? 'open' : ''} />
      </button>
      {open && (
        <div className="pills">
          {values.map((v, i) => (
            <button
              key={v}
              className={value === v ? 'active' : ''}
              onClick={() => set(v)}
            >
              {labels[i]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function BrandLogo({ name, slug }: { name: string; slug: string }) {
  const [failed, setFailed] = useState(name === 'Mercedes');
  return failed ? (
    <span className="brand-fallback" aria-hidden="true">
      {name === 'Mercedes' ? 'MB' : name.slice(0, 2).toUpperCase()}
    </span>
  ) : (
    <Image
      src={`https://cdn.simpleicons.org/${slug}/142b3a`}
      alt=""
      width={72}
      height={48}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
const partCopy = {
  en: {
    k: 'PARTS ON DEMAND',
    h: 'Tell us the part. We’ll find the match.',
    p: 'New, used, original or compatible—verified sellers respond directly.',
    s: ['Describe your part', 'Get verified offers', 'Choose your match'],
    received: 'Request received.',
    receivedP:
      'We’ll match your part with verified sellers and notify you when offers arrive.',
    again: 'Send another request',
    vehicle: 'Vehicle make and model',
    part: 'Part needed',
    condition: 'Part condition',
    delivery: 'Delivery country',
    details: 'Details',
    send: 'Send my request',
    fast: 'Usually matched within 24 hours',
    cats: ['Lighting', 'Brakes', 'Batteries', 'Service parts'],
    conditions: ['Any condition', 'New', 'Used', 'Reconditioned'],
    countries: [
      'Republic of the Congo',
      'Angola — Cabinda',
      'Cameroon',
      'Gabon',
      'DR Congo',
    ],
  },
  fr: {
    k: 'PIÈCES SUR DEMANDE',
    h: 'Dites-nous la pièce. Nous trouvons la bonne.',
    p: 'Neuve, d’occasion, d’origine ou compatible—des vendeurs vérifiés vous répondent.',
    s: [
      'Décrivez votre pièce',
      'Recevez des offres vérifiées',
      'Choisissez la bonne offre',
    ],
    received: 'Demande reçue.',
    receivedP:
      'Nous rechercherons votre pièce et vous informerons dès réception des offres.',
    again: 'Envoyer une autre demande',
    vehicle: 'Marque et modèle du véhicule',
    part: 'Pièce recherchée',
    condition: 'État de la pièce',
    delivery: 'Pays de livraison',
    details: 'Détails',
    send: 'Envoyer ma demande',
    fast: 'Réponse habituelle sous 24 heures',
    cats: ['Éclairage', 'Freinage', 'Batteries', 'Entretien'],
    conditions: ['Tous états', 'Neuf', 'Occasion', 'Reconditionné'],
    countries: [
      'République du Congo',
      'Angola — Cabinda',
      'Cameroun',
      'Gabon',
      'RD Congo',
    ],
  },
  es: {
    k: 'REPUESTOS BAJO PEDIDO',
    h: 'Dinos qué pieza buscas. Encontraremos la adecuada.',
    p: 'Nueva, usada, original o compatible—vendedores verificados te responden.',
    s: [
      'Describe la pieza',
      'Recibe ofertas verificadas',
      'Elige la mejor opción',
    ],
    received: 'Solicitud recibida.',
    receivedP: 'Buscaremos la pieza y te avisaremos cuando lleguen ofertas.',
    again: 'Enviar otra solicitud',
    vehicle: 'Marca y modelo del vehículo',
    part: 'Repuesto necesario',
    condition: 'Estado de la pieza',
    delivery: 'País de entrega',
    details: 'Detalles',
    send: 'Enviar mi solicitud',
    fast: 'Respuesta habitual en 24 horas',
    cats: ['Iluminación', 'Frenos', 'Baterías', 'Mantenimiento'],
    conditions: ['Cualquier estado', 'Nuevo', 'Usado', 'Reacondicionado'],
    countries: [
      'República del Congo',
      'Angola — Cabinda',
      'Camerún',
      'Gabón',
      'RD del Congo',
    ],
  },
} as const;
function PartsPanel({
  lang,
  onRequest,
}: {
  lang: Lang;
  onRequest: (request: PartRequest) => Promise<PartRequest | null>;
}) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [selectedPart, setSelectedPart] = useState(0);
  const [partName, setPartName] = useState('');
  const p = partCopy[lang];
  const details = {
    en: [
      'Headlamps, bulbs and body lighting',
      'Pads, discs and hydraulic parts',
      'Starter and EV batteries',
      'Filters, belts and maintenance kits',
    ],
    fr: [
      'Phares, ampoules et éclairage',
      'Plaquettes, disques et hydraulique',
      'Batteries de démarrage et véhicules électriques',
      'Filtres, courroies et kits d’entretien',
    ],
    es: [
      'Faros, bombillas e iluminación',
      'Pastillas, discos y piezas hidráulicas',
      'Baterías de arranque y vehículos eléctricos',
      'Filtros, correas y kits de mantenimiento',
    ],
  }[lang];
  return (
    <section className="parts-panel">
      <div className="parts-intro">
        <span>
          <Cog /> {p.k}
        </span>
        <h2>{p.h}</h2>
        <p>{p.p}</p>
        <Image
          className="parts-market-image"
          src="/jfcars-parts-market.webp"
          width={1200}
          height={720}
          alt={
            lang === 'fr'
              ? 'Phare, freins, batterie et pièces d’entretien'
              : lang === 'es'
                ? 'Faro, frenos, batería y piezas de mantenimiento'
                : 'Headlamp, brakes, battery and service parts'
          }
        />
        <div className="parts-categories">
          {p.cats.map((x, i) => (
            <button
              type="button"
              className={selectedPart === i ? 'active' : ''}
              key={x}
              onClick={() => {
                setSelectedPart(i);
                setPartName(x);
              }}
            >
              <b>{i + 1}</b>
              <span>
                {x}
                <small>{details[i]}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="part-preview-detail" aria-live="polite">
          <b>{p.cats[selectedPart]}</b>
          <span>{details[selectedPart]}</span>
          <small>
            {p.condition} · {p.delivery}
          </small>
        </div>
        <div className="parts-steps">
          <div>
            <b>1</b>
            <span>{p.s[0]}</span>
          </div>
          <div>
            <b>2</b>
            <span>{p.s[1]}</span>
          </div>
          <div>
            <b>3</b>
            <span>{p.s[2]}</span>
          </div>
        </div>
      </div>
      {sent ? (
        <div className="parts-success">
          <span>
            <Check />
          </span>
          <h3>{p.received}</h3>
          <p>{p.receivedP}</p>
          <button onClick={() => setSent(false)}>{p.again}</button>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setSubmitting(true);
            setSubmitError(false);
            const saved = await onRequest({
              id: crypto.randomUUID(),
              vehicle: formValue(data, 'vehicle'),
              part: formValue(data, 'part'),
              condition: formValue(data, 'condition', p.conditions[0]),
              delivery: formValue(data, 'delivery', p.countries[0]),
              details: formValue(data, 'details'),
              status: 'Open',
            });
            setSubmitting(false);
            if (saved) setSent(true);
            else setSubmitError(true);
          }}
        >
          <label>
            {p.vehicle}
            <input
              name="vehicle"
              required
              placeholder={
                lang === 'fr'
                  ? 'ex. Audi A4 2020'
                  : lang === 'es'
                    ? 'p. ej., Audi A4 2020'
                    : 'e.g. 2020 Audi A4'
              }
            />
          </label>
          <label>
            {p.part}
            <input
              name="part"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
              placeholder={
                lang === 'fr'
                  ? 'ex. phare LED gauche'
                  : lang === 'es'
                    ? 'p. ej., faro LED izquierdo'
                    : 'e.g. Left LED headlight'
              }
            />
          </label>
          <div>
            <label>
              {p.condition}
              <select name="condition">
                {p.conditions.map((condition) => (
                  <option key={condition}>{condition}</option>
                ))}
              </select>
            </label>
            <label>
              {p.delivery}
              <select name="delivery">
                {p.countries.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            {p.details}
            <textarea
              name="details"
              placeholder={
                lang === 'fr'
                  ? 'Référence de pièce, VIN, couleur…'
                  : lang === 'es'
                    ? 'Añade la referencia, VIN, color…'
                    : 'Add a part number, VIN, color or anything helpful…'
              }
            />
          </label>
          <button disabled={submitting}>
            {submitting
              ? lang === 'fr'
                ? 'Envoi…'
                : lang === 'es'
                  ? 'Enviando…'
                  : 'Sending…'
              : p.send}{' '}
            <ArrowRight />
          </button>
          {submitError && (
            <p className="form-notice" role="alert">
              {lang === 'fr'
                ? 'Impossible d’envoyer la demande. Réessayez.'
                : lang === 'es'
                  ? 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
                  : 'We could not send your request. Please try again.'}
            </p>
          )}
          <small>
            <CircleDot /> {p.fast}
          </small>
        </form>
      )}
    </section>
  );
}

function useDialog(close: () => void) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const dialogs = Array.from(
      document.querySelectorAll<HTMLDialogElement>('dialog[open]'),
    );
    const dialog = dialogs.at(-1);
    dialog?.setAttribute('aria-modal', 'true');
    if (dialog && !dialog.hasAttribute('tabindex'))
      dialog.setAttribute('tabindex', '-1');
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusTimer = window.setTimeout(() => {
      const first = dialog?.querySelector<HTMLElement>(focusableSelector);
      (first || dialog)?.focus();
    }, 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key === 'Tab' && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelector),
        ).filter((element) => element.offsetParent !== null);
        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable.at(-1)!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused))
        previouslyFocused.focus();
    };
  }, [close]);
}

function AccountLayer({
  panel,
  close,
  goAuth,
  user,
  setUser,
  authMode,
  setAuthMode,
  cart,
  setCart,
  rentalCart,
  setRentalCart,
  inventory,
  saved,
  partRequestCount,
  orders,
  setOrders,
  lang,
}: {
  panel: 'auth' | 'cart' | 'profile';
  close: () => void;
  goAuth: () => void;
  user: UserAccount | null;
  setUser: (u: UserAccount | null) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (m: 'signin' | 'signup') => void;
  cart: number[];
  setCart: (v: number[]) => void;
  rentalCart: number[];
  setRentalCart: (v: number[]) => void;
  inventory: Car[];
  saved: number[];
  partRequestCount: number;
  orders: OrderRecord[];
  setOrders: (orders: OrderRecord[]) => void;
  lang: Lang;
}) {
  const [profileTab, setProfileTab] = useState('overview');
  const [notice, setNotice] = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [rentalStart, setRentalStart] = useState('');
  const [rentalEnd, setRentalEnd] = useState('');
  const [rentalConsent, setRentalConsent] = useState(false);
  const f = flowCopy[lang];
  const u = ui[lang];
  const p = profileCopy[lang];
  const a = accessibilityCopy[lang];
  const m = marketCopy[lang];
  const today = new Date().toISOString().slice(0, 10);
  const minimumReturnDate = rentalStart
    ? new Date(Date.parse(`${rentalStart}T00:00:00Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10)
    : today;
  useDialog(close);
  const hasRentals = rentalCart.length > 0;
  const rentalDays = rentalDaysBetween(rentalStart, rentalEnd);
  const rentalReady =
    !hasRentals ||
    (rentalConsent &&
      rentalStart >= today &&
      rentalDays >= 1 &&
      rentalDays <= 60);
  const picked = [
    ...inventory
      .filter((car) => cart.includes(car.id))
      .map((car) => ({ car, kind: 'buy' as const, amount: car.price })),
    ...inventory
      .filter((car) => rentalCart.includes(car.id))
      .map((car) => ({
        car,
        kind: 'rent' as const,
        amount: rentalRate(car) * rentalDays,
      })),
  ];
  const submitCheckout = async () => {
    if (!user) {
      goAuth();
      return;
    }
    if (hasRentals && (!rentalConsent || rentalDays < 1 || rentalDays > 60)) {
      setNotice(f.rentalRequired);
      return;
    }
    setCheckoutBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: picked.map(({ car, kind }) => ({
            carId: car.id,
            kind,
          })),
          rentalDetails: hasRentals
            ? {
                startDate: rentalStart,
                endDate: rentalEnd,
                termsAccepted: rentalConsent,
              }
            : undefined,
        }),
      });
      if (!response.ok) throw new Error('Order request failed');
      const result = (await response.json()) as {
        orderId: string;
        items: OrderItem[];
        total: number;
      };
      setOrders([
        {
          id: result.orderId,
          email: user.email,
          items: result.items,
          total: result.total,
          status: 'New',
          createdAt: new Date().toISOString(),
        },
        ...orders,
      ]);
      setCart([]);
      setRentalCart([]);
      setCheckoutDone(true);
    } catch {
      setNotice(
        lang === 'fr'
          ? 'La demande n’a pas pu être envoyée. Réessayez.'
          : lang === 'es'
            ? 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
            : 'We could not submit the request. Please try again.',
      );
    } finally {
      setCheckoutBusy(false);
    }
  };
  return (
    <div
      className="layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      role="presentation"
    >
      <dialog
        open
        className={`drawer ${panel}`}
        aria-label={
          panel === 'auth'
            ? f.account
            : panel === 'cart'
              ? u.cart
              : user?.name || 'Profile'
        }
      >
        <button className="drawer-close" onClick={close} aria-label={u.close}>
          <X />
        </button>
        {panel === 'auth' && (
          <div className="auth-box">
            <button className="logo logo-button" onClick={close}>
              <span>JF</span>cars<i>.</i>
            </button>
            <p className="auth-kicker">{f.account}</p>
            <h2>{authMode === 'signin' ? f.welcome : f.moving}</h2>
            <p>{authMode === 'signin' ? f.signinDesc : f.signupDesc}</p>
            <div className="auth-tabs">
              <button
                className={authMode === 'signin' ? 'active' : ''}
                onClick={() => setAuthMode('signin')}
              >
                {f.signIn}
              </button>
              <button
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => setAuthMode('signup')}
              >
                {f.create}
              </button>
            </div>
            <Link
              className="auth-submit"
              href="/signin-with-chatgpt?return_to=/"
              target="_top"
            >
              {authMode === 'signin' ? f.signIn : f.create}
              <ArrowRight />
            </Link>
            <small>{f.continue}</small>
          </div>
        )}
        {panel === 'cart' && (
          <div className="cart-box">
            <p className="auth-kicker">{f.selection}</p>
            <h2>
              {u.cart} <span>{cart.length + rentalCart.length}</span>
            </h2>
            {checkoutDone ? (
              <div className="checkout-success" aria-live="polite">
                <Check />
                <h3>{f.checkoutDone}</h3>
                <button onClick={close}>{f.browse}</button>
              </div>
            ) : picked.length ? (
              <>
                <div className="cart-items">
                  {picked.map(({ car: c, kind, amount }) => (
                    <article key={`${kind}-${c.id}`}>
                      <Image
                        src={c.image}
                        alt={`${c.make} ${c.model}`}
                        width={320}
                        height={200}
                        unoptimized
                      />
                      <div>
                        <b>
                          {c.make} {c.model}
                        </b>
                        <span>
                          {c.year} · {numberFor(c.km, lang)} km
                        </span>
                        <small className="cart-kind">
                          {kind === 'rent'
                            ? `${f.rental} · ${f.pickupAt}: ${carPlace(c, lang)}`
                            : f.purchase}
                        </small>
                        <strong>
                          {kind === 'rent'
                            ? `${money(rentalRate(c), lang)}/${f.day}`
                            : money(amount, lang)}
                        </strong>
                        {kind === 'buy' && c.origin === 'abroad' && (
                          <small className="cart-import-note">
                            {m.abroadAvailability}. {m.importNote}
                          </small>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          kind === 'rent'
                            ? setRentalCart(
                                rentalCart.filter((x) => x !== c.id),
                              )
                            : setCart(cart.filter((x) => x !== c.id))
                        }
                        aria-label={`${a.remove} ${c.make} ${c.model}`}
                      >
                        <X />
                      </button>
                    </article>
                  ))}
                </div>
                {hasRentals && (
                  <fieldset className="rental-request-fields">
                    <legend>{f.rentalDates}</legend>
                    <div>
                      <label>
                        {f.rentalStart}
                        <input
                          type="date"
                          value={rentalStart}
                          min={today}
                          onChange={(event) => {
                            const nextStart = event.target.value;
                            setRentalStart(nextStart);
                            if (rentalEnd && rentalEnd <= nextStart)
                              setRentalEnd('');
                          }}
                          required
                        />
                      </label>
                      <label>
                        {f.rentalEnd}
                        <input
                          type="date"
                          value={rentalEnd}
                          min={minimumReturnDate}
                          onChange={(event) => setRentalEnd(event.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <label className="rental-consent">
                      <input
                        type="checkbox"
                        checked={rentalConsent}
                        onChange={(event) =>
                          setRentalConsent(event.target.checked)
                        }
                      />
                      <span>{f.rentalConsent}</span>
                    </label>
                  </fieldset>
                )}
                <div className="cart-total">
                  <span>{f.estimated}</span>
                  <b>
                    {rentalReady
                      ? money(
                          picked.reduce((n, item) => n + item.amount, 0),
                          lang,
                        )
                      : f.chooseDates}
                  </b>
                </div>
                <p className="checkout-note">{f.checkoutNote}</p>
                <button
                  className="checkout"
                  onClick={() => void submitCheckout()}
                  disabled={checkoutBusy || (!!user && !rentalReady)}
                >
                  {checkoutBusy
                    ? lang === 'fr'
                      ? 'Envoi…'
                      : lang === 'es'
                        ? 'Enviando…'
                        : 'Submitting…'
                    : user
                      ? f.checkout
                      : f.signinContinue}
                  <ArrowRight />
                </button>
                {notice && (
                  <p className="form-notice" aria-live="polite">
                    {notice}
                  </p>
                )}
                {!user && (
                  <button
                    className="cart-signin"
                    onClick={() => {
                      setAuthMode('signup');
                      goAuth();
                    }}
                  >
                    {f.create}
                  </button>
                )}
              </>
            ) : (
              <div className="cart-empty">
                <ShoppingBag />
                <h3>{f.emptyCart}</h3>
                <p>{f.emptyCartP}</p>
                <button onClick={close}>{f.browse}</button>
              </div>
            )}
          </div>
        )}
        {panel === 'profile' && user && (
          <div className="profile-box">
            <div className="profile-head">
              <span>{user.name.slice(0, 1)}</span>
              <div>
                <p>{p.welcome}</p>
                <h2>{user.name}</h2>
                <small>{user.email}</small>
              </div>
            </div>
            <nav>
              {[
                ['overview', p.tabs[0], User],
                ['orders', p.tabs[1], Package],
                ['rentals', p.tabs[2], CalendarDays],
                ['settings', p.tabs[3], Settings],
              ].map(([id, label, Icon]) => (
                <button
                  key={String(id)}
                  className={profileTab === id ? 'active' : ''}
                  onClick={() => setProfileTab(String(id))}
                >
                  <Icon />
                  {String(label)}
                </button>
              ))}
            </nav>
            <div className="profile-content">
              {profileTab === 'overview' && (
                <>
                  <h3>{p.glance}</h3>
                  <div className="profile-stats">
                    <div>
                      <Heart />
                      <b>{saved.length}</b>
                      <span>{p.saved}</span>
                    </div>
                    <div>
                      <ShoppingCart />
                      <b>{cart.length + rentalCart.length}</b>
                      <span>{p.cart}</span>
                    </div>
                    <div>
                      <Cog />
                      <b>{partRequestCount}</b>
                      <span>{p.parts}</span>
                    </div>
                  </div>
                  <h4>{p.recent}</h4>
                  <div className="activity">
                    <span>
                      <Check />
                    </span>
                    <div>
                      <b>{p.ready}</b>
                      <p>{p.readyText}</p>
                    </div>
                  </div>
                </>
              )}
              {profileTab === 'orders' && (
                <ProfileOrders
                  orders={orders.filter((order) =>
                    order.items.some((item) => item.kind === 'buy'),
                  )}
                  emptyTitle={p.noPurchases}
                  emptyText={p.purchasesText}
                  lang={lang}
                />
              )}
              {profileTab === 'rentals' && (
                <ProfileOrders
                  orders={orders.filter((order) =>
                    order.items.some((item) => item.kind === 'rent'),
                  )}
                  emptyTitle={p.noRentals}
                  emptyText={p.rentalsText}
                  lang={lang}
                />
              )}
              {profileTab === 'settings' && (
                <form
                  className="profile-settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    setUser({
                      name: formValue(data, 'profileName', user.name),
                      email: formValue(data, 'profileEmail', user.email),
                    });
                    setNotice(f.profileSaved);
                  }}
                >
                  <h3>{p.settings}</h3>
                  <label>
                    {f.name}
                    <input
                      name="profileName"
                      defaultValue={user.name}
                      required
                    />
                  </label>
                  <label>
                    {f.email}
                    <input
                      name="profileEmail"
                      type="email"
                      defaultValue={user.email}
                      readOnly
                    />
                  </label>
                  <button className="save-profile">{p.save}</button>
                  {notice && (
                    <p className="form-notice" aria-live="polite">
                      <Check />
                      {notice}
                    </p>
                  )}
                </form>
              )}
            </div>
            <Link
              className="signout"
              href="/signout-with-chatgpt?return_to=/"
              target="_top"
            >
              <LogOut />
              {p.signout}
            </Link>
          </div>
        )}
      </dialog>
    </div>
  );
}
function ProfileEmpty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Package;
  title: string;
  text: string;
}) {
  return (
    <div className="profile-empty">
      <Icon />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function ProfileOrders({
  orders,
  emptyTitle,
  emptyText,
  lang,
}: {
  orders: OrderRecord[];
  emptyTitle: string;
  emptyText: string;
  lang: Lang;
}) {
  if (!orders.length)
    return <ProfileEmpty icon={Package} title={emptyTitle} text={emptyText} />;
  return (
    <div className="profile-order-list">
      {orders.map((order) => (
        <article key={order.id}>
          <div>
            <b>{order.items.map((item) => item.vehicle).join(', ')}</b>
            <span>
              {new Date(order.createdAt).toLocaleDateString(
                lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US',
              )}
            </span>
            {order.items.some((item) => item.rentalStart) && (
              <span>
                {order.items
                  .filter((item) => item.rentalStart)
                  .map(
                    (item) =>
                      `${item.rentalStart} → ${item.rentalEnd} · ${flowCopy[lang].pickupAt}: ${item.pickup}`,
                  )
                  .join(' | ')}
              </span>
            )}
          </div>
          <strong>{money(order.total, lang)}</strong>
          <small>{orderStatus(order.status, lang)}</small>
        </article>
      ))}
    </div>
  );
}
function VehicleDetails({
  car,
  lang,
  mode,
  close,
  add,
  inCart,
  onInquiry,
}: {
  car: Car;
  lang: Lang;
  mode: 'buy' | 'rent' | 'parts';
  close: () => void;
  add: () => void;
  inCart: boolean;
  onInquiry: (inquiry: SellerInquiry) => Promise<boolean>;
}) {
  const u = ui[lang];
  const m = marketCopy[lang];
  const images = car.images?.length ? car.images : [car.image];
  const [photoView, setPhotoView] = useState(0);
  const [added, setAdded] = useState(inCart);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const closeVehicleLayer = useCallback(() => {
    if (viewerOpen) setViewerOpen(false);
    else close();
  }, [viewerOpen, close]);
  useDialog(closeVehicleLayer);
  const labels = {
    en: {
      year: 'Year',
      mileage: 'Mileage',
      fuel: 'Fuel',
      body: 'Body',
      gearbox: 'Transmission',
      drive: 'Drivetrain',
      color: 'Color',
      seats: 'Seats',
      location: 'Location',
      source: 'Stock source',
      engine: 'Engine',
      sellerType: 'Seller',
      price: 'Price',
      desc: 'A vehicle listing with clear seller-provided details and support from our regional team.',
      gallery: ['Exterior', 'Cabin', 'Detail'],
      viewAll: 'View all photos',
      photos: 'photos',
      contactTitle: 'Contact this seller',
      contactName: 'Your name',
      contactPhone: 'Phone or WhatsApp',
      contactMessage: 'Message',
      send: 'Send request',
      sent: 'Request sent. The seller will contact you shortly.',
      added: 'Added to cart',
      abs: 'ABS braking system',
      airConditioning: 'Air conditioning',
      bluetooth: 'Bluetooth',
      parkingCamera: 'Parking camera',
      sections: ['Overview', 'Equipment', 'Seller'],
    },
    fr: {
      year: 'Année',
      mileage: 'Kilométrage',
      fuel: 'Énergie',
      body: 'Carrosserie',
      gearbox: 'Transmission',
      drive: 'Motricité',
      color: 'Couleur',
      seats: 'Places',
      location: 'Localisation',
      source: 'Origine du stock',
      engine: 'Cylindrée',
      sellerType: 'Vendeur',
      price: 'Prix',
      desc: 'Une annonce automobile avec des informations claires fournies par le vendeur et l’accompagnement de notre équipe régionale.',
      gallery: ['Extérieur', 'Habitacle', 'Détail'],
      viewAll: 'Voir toutes les photos',
      photos: 'photos',
      contactTitle: 'Contacter ce vendeur',
      contactName: 'Votre nom',
      contactPhone: 'Téléphone ou WhatsApp',
      contactMessage: 'Message',
      send: 'Envoyer la demande',
      sent: 'Demande envoyée. Le vendeur vous contactera rapidement.',
      added: 'Ajouté au panier',
      abs: 'Système de freinage ABS',
      airConditioning: 'Climatisation',
      bluetooth: 'Bluetooth',
      parkingCamera: 'Caméra de recul',
      sections: ['Aperçu', 'Équipements', 'Vendeur'],
    },
    es: {
      year: 'Año',
      mileage: 'Kilometraje',
      fuel: 'Combustible',
      body: 'Carrocería',
      gearbox: 'Transmisión',
      drive: 'Tracción',
      color: 'Color',
      seats: 'Plazas',
      location: 'Ubicación',
      source: 'Origen del stock',
      engine: 'Cilindrada',
      sellerType: 'Vendedor',
      price: 'Precio',
      desc: 'Un anuncio de vehículo con información clara del vendedor y asistencia de nuestro equipo regional.',
      gallery: ['Exterior', 'Habitáculo', 'Detalle'],
      viewAll: 'Ver todas las fotos',
      photos: 'fotos',
      contactTitle: 'Contactar con este vendedor',
      contactName: 'Tu nombre',
      contactPhone: 'Teléfono o WhatsApp',
      contactMessage: 'Mensaje',
      send: 'Enviar solicitud',
      sent: 'Solicitud enviada. El vendedor se pondrá en contacto pronto.',
      added: 'Añadido al carrito',
      abs: 'Sistema de frenado ABS',
      airConditioning: 'Aire acondicionado',
      bluetooth: 'Bluetooth',
      parkingCamera: 'Cámara de aparcamiento',
      sections: ['Resumen', 'Equipamiento', 'Vendedor'],
    },
  }[lang];
  const specs = [
    [labels.year, car.year],
    [labels.mileage, `${numberFor(car.km, lang)} km`],
    [labels.fuel, localize(car.fuel, lang)],
    [labels.body, localize(car.body, lang)],
    [labels.gearbox, localize(car.transmission || 'Automatic', lang)],
    [labels.drive, car.drivetrain || 'FWD'],
    [labels.color, localize(car.color, lang)],
    [labels.seats, car.seats || 5],
    [
      labels.source,
      car.origin === 'abroad'
        ? localize('Abroad', lang)
        : localize('Local', lang),
    ],
    [
      labels.engine,
      Number(car.engineLitres || 0) === 0
        ? localize('Electric', lang)
        : `${car.engineLitres} L`,
    ],
    [labels.sellerType, localize(car.sellerType || 'Dealer', lang)],
  ];
  return (
    <div
      className="layer vehicle-layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      role="presentation"
    >
      <dialog
        open
        className="vehicle-detail"
        aria-label={`${car.make} ${car.model}`}
      >
        <button className="detail-close" onClick={close} aria-label={u.close}>
          <X />
        </button>
        <div className="detail-gallery">
          <Image
            src={images[photoView]}
            alt={`${car.make} ${car.model} — ${labels.gallery[photoView] || labels.photos}`}
            width={1400}
            height={900}
            unoptimized
          />
          <button
            className="view-all-photos"
            onClick={() => setViewerOpen(true)}
          >
            {labels.viewAll} · {images.length} {labels.photos}
          </button>
          <div>
            {images.map((image, i) => (
              <button
                key={image}
                className={photoView === i ? 'active' : ''}
                onClick={() => setPhotoView(i)}
              >
                <Image
                  src={image}
                  alt=""
                  width={260}
                  height={170}
                  unoptimized
                />
                <span>{labels.gallery[i] || `${labels.photos} ${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="detail-summary">
          <p className="auth-kicker">
            {car.verified
              ? u.inspected
              : localize(car.sellerType || 'Dealer', lang)}
          </p>
          <h2>
            {car.make} {car.model}
          </h2>
          {car.sample && (
            <p className="sample-detail-note">
              {lang === 'fr'
                ? 'Annonce et photos de démonstration — remplacez-les dans Admin avant toute transaction.'
                : lang === 'es'
                  ? 'Anuncio y fotos de demostración; sustitúyelos en Admin antes de cualquier operación.'
                  : 'Demonstration listing and reference photos—replace them in Admin before any transaction.'}
            </p>
          )}
          <p>{labels.desc}</p>
          <strong>
            {mode === 'rent'
              ? `${money(rentalRate(car), lang)}/${flowCopy[lang].day}`
              : money(car.price, lang)}
          </strong>
          <div className="detail-location">
            <MapPin />
            {carPlace(car, lang)}
          </div>
          {car.origin === 'abroad' && (
            <p className="detail-import-note">
              <strong>{m.abroadAvailability}</strong>
              {m.importNote}
            </p>
          )}
          <button
            className={added ? 'detail-added' : ''}
            onClick={() => {
              add();
              setAdded(true);
            }}
          >
            {added ? labels.added : mode === 'rent' ? u.book : u.addCart}
            {added ? <Check /> : <ShoppingCart />}
          </button>
          <button
            className="contact-seller"
            onClick={() => setContactOpen((v) => !v)}
            aria-expanded={contactOpen}
          >
            {u.contact}
            {contactOpen ? <X /> : <ArrowRight />}
          </button>
          {contactOpen && (
            <form
              className="seller-contact"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setContactBusy(true);
                setContactError(false);
                const saved = await onInquiry({
                  id: crypto.randomUUID(),
                  carId: car.id,
                  customer: formValue(data, 'customer'),
                  phone: formValue(data, 'phone'),
                  message: formValue(data, 'message'),
                });
                setContactBusy(false);
                if (saved) setContactSent(true);
                else setContactError(true);
              }}
            >
              {contactSent ? (
                <p>
                  <Check />
                  {labels.sent}
                </p>
              ) : (
                <>
                  <h3>{labels.contactTitle}</h3>
                  <label>
                    {labels.contactName}
                    <input name="customer" required />
                  </label>
                  <label>
                    {labels.contactPhone}
                    <input name="phone" required type="tel" />
                  </label>
                  <label>
                    {labels.contactMessage}
                    <textarea
                      name="message"
                      defaultValue={`${car.make} ${car.model}`}
                    />
                  </label>
                  <button disabled={contactBusy}>
                    {contactBusy
                      ? lang === 'fr'
                        ? 'Envoi…'
                        : lang === 'es'
                          ? 'Enviando…'
                          : 'Sending…'
                      : labels.send}
                    <ArrowRight />
                  </button>
                  {contactError && (
                    <p className="form-notice" role="alert">
                      {lang === 'fr'
                        ? 'Impossible d’envoyer la demande. Réessayez.'
                        : lang === 'es'
                          ? 'No se pudo enviar la solicitud. Inténtalo de nuevo.'
                          : 'We could not send your request. Please try again.'}
                    </p>
                  )}
                </>
              )}
            </form>
          )}
        </div>
        <nav className="detail-nav">
          {labels.sections.map((x, i) => (
            <button
              key={x}
              onClick={() =>
                document
                  .getElementById(
                    ['detail-overview', 'detail-equipment', 'detail-seller'][i],
                  )
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            >
              {x}
            </button>
          ))}
        </nav>
        <div className="detail-specs" id="detail-overview">
          <h3>{u.overview}</h3>
          <div>
            {specs.map(([k, v]) => (
              <span key={String(k)}>
                <small>{k}</small>
                <b>{v}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="detail-equipment" id="detail-equipment">
          <h3>{u.equipment}</h3>
          <div>
            {[
              u.inspected,
              u.noAccident,
              u.original,
              u.service,
              labels.abs,
              labels.airConditioning,
              labels.bluetooth,
              labels.parkingCamera,
            ].map((x) => (
              <span key={x}>
                <Check />
                {x}
              </span>
            ))}
          </div>
        </div>
        <div className="detail-seller" id="detail-seller">
          <div>
            <span>JF</span>
            <div>
              <h3>{u.seller}</h3>
              <p>
                JFcars Marketplace ·{' '}
                {localize(car.sellerType || 'Dealer', lang)}
              </p>
            </div>
          </div>
          <b>{carPlace(car, lang)}</b>
        </div>
      </dialog>
      {viewerOpen && (
        <dialog open className="photo-viewer" aria-label={labels.viewAll}>
          <button
            className="viewer-close"
            onClick={() => setViewerOpen(false)}
            aria-label={u.close}
          >
            <X />
          </button>
          {images.length > 1 ? (
            <button
              className="viewer-arrow prev"
              onClick={() =>
                setPhotoView((photoView + images.length - 1) % images.length)
              }
              aria-label={accessibilityCopy[lang].previousPhoto}
            >
              <ChevronLeft />
            </button>
          ) : (
            <span />
          )}
          <figure>
            <Image
              src={images[photoView]}
              alt={`${car.make} ${car.model} — ${labels.gallery[photoView] || labels.photos}`}
              width={1600}
              height={1000}
              unoptimized
            />
            <figcaption>
              <span>
                {labels.gallery[photoView] ||
                  `${labels.photos} ${photoView + 1}`}
              </span>
              <b>
                {photoView + 1} / {images.length}
              </b>
            </figcaption>
          </figure>
          {images.length > 1 ? (
            <button
              className="viewer-arrow next"
              onClick={() => setPhotoView((photoView + 1) % images.length)}
              aria-label={accessibilityCopy[lang].nextPhoto}
            >
              <ChevronRight />
            </button>
          ) : (
            <span />
          )}
          <div>
            {images.map((image, i) => (
              <button
                key={image}
                className={photoView === i ? 'active' : ''}
                onClick={() => setPhotoView(i)}
              >
                <Image
                  src={image}
                  alt={labels.gallery[i] || `${labels.photos} ${i + 1}`}
                  width={240}
                  height={150}
                  unoptimized
                />
              </button>
            ))}
          </div>
        </dialog>
      )}
    </div>
  );
}
function ComparePanel({
  cars,
  close,
  remove,
  add,
  lang,
  mode,
}: {
  cars: Car[];
  close: () => void;
  remove: (id: number) => void;
  add: (id: number) => void;
  lang: Lang;
  mode: 'buy' | 'rent' | 'parts';
}) {
  useDialog(close);
  const c = compareCopy[lang];
  const u = ui[lang];
  const f = flowCopy[lang];
  return (
    <div
      className="layer compare-layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      role="presentation"
    >
      <dialog open className="compare-panel" aria-label={c.title}>
        <header>
          <div>
            <p>{c.eyebrow}</p>
            <h2>{c.title}</h2>
          </div>
          <button onClick={close} aria-label={c.close}>
            <X />
          </button>
        </header>
        <div className="compare-columns">
          {cars.map((c) => (
            <article key={c.id}>
              <button
                onClick={() => remove(c.id)}
                aria-label={`${compareCopy[lang].remove} ${c.make} ${c.model}`}
              >
                <X />
              </button>
              <Image
                src={c.image}
                alt=""
                width={640}
                height={400}
                unoptimized
              />
              <p>
                {c.year} · {localize(c.fuel, lang)}
              </p>
              <h3>
                {c.make} {c.model}
              </h3>
              <strong>
                {mode === 'rent'
                  ? `${money(rentalRate(c), lang)}/${f.day}`
                  : money(c.price, lang)}
              </strong>
              <dl>
                <div>
                  <dt>{compareCopy[lang].mileage}</dt>
                  <dd>{numberFor(c.km, lang)} km</dd>
                </div>
                <div>
                  <dt>{compareCopy[lang].body}</dt>
                  <dd>{localize(c.body, lang)}</dd>
                </div>
                <div>
                  <dt>{compareCopy[lang].transmission}</dt>
                  <dd>{localize(c.transmission, lang)}</dd>
                </div>
                <div>
                  <dt>{compareCopy[lang].drivetrain}</dt>
                  <dd>{c.drivetrain}</dd>
                </div>
                <div>
                  <dt>{compareCopy[lang].seats}</dt>
                  <dd>{c.seats}</dd>
                </div>
                <div>
                  <dt>{compareCopy[lang].location}</dt>
                  <dd>{carPlace(c, lang)}</dd>
                </div>
              </dl>
              <button className="compare-cart" onClick={() => add(c.id)}>
                {mode === 'rent' ? u.book : compareCopy[lang].add}{' '}
                <ShoppingCart />
              </button>
            </article>
          ))}
        </div>
      </dialog>
    </div>
  );
}

function AdminPanel({
  inventory,
  setInventory,
  partRequests,
  setPartRequests,
  sellerInquiries,
  setSellerInquiries,
  storefrontContent,
  setStorefrontContent,
  orders,
  setOrders,
  sellRequests,
  setSellRequests,
  persistenceError,
  close,
}: {
  inventory: Car[];
  setInventory: (cars: Car[]) => void;
  partRequests: PartRequest[];
  setPartRequests: (requests: PartRequest[]) => void;
  sellerInquiries: SellerInquiry[];
  setSellerInquiries: (inquiries: SellerInquiry[]) => void;
  storefrontContent: StorefrontContent;
  setStorefrontContent: (content: StorefrontContent) => void;
  orders: OrderRecord[];
  setOrders: (orders: OrderRecord[]) => void;
  sellRequests: SellRequest[];
  setSellRequests: (requests: SellRequest[]) => void;
  persistenceError: boolean;
  close: () => void;
}) {
  const [tab, setTab] = useState('dashboard'),
    [adding, setAdding] = useState(false),
    [editingPhotos, setEditingPhotos] = useState<Car | null>(null),
    [contentSaved, setContentSaved] = useState(false),
    [contentLocale, setContentLocale] = useState<Lang>('en'),
    [contentDraft, setContentDraft] = useState<StorefrontContent>({
      en: storefrontContent.en || {
        headline: copy.en.hero,
        description: copy.en.sub,
      },
      fr: storefrontContent.fr || {
        headline: copy.fr.hero,
        description: copy.fr.sub,
      },
      es: storefrontContent.es || {
        headline: copy.es.hero,
        description: copy.es.sub,
      },
    });
  const [adminAddCountry, setAdminAddCountry] = useState(
    'Republic of the Congo',
  );
  const [adminEditCountry, setAdminEditCountry] = useState(
    'Republic of the Congo',
  );
  useDialog(close);
  const rentalOrders = orders.filter((order) =>
    order.items.some((item) => item.kind === 'rent'),
  );
  const managedBrands = catalogBrands(inventory);
  const updateOrderStatus = async (id: string, status: string) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'order-status', id, status }),
    });
    if (response.ok)
      setOrders(
        orders.map((order) => (order.id === id ? { ...order, status } : order)),
      );
  };
  const updatePartStatus = async (
    id: string,
    status: PartRequest['status'],
  ) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'part-status', id, status }),
    });
    if (response.ok)
      setPartRequests(
        partRequests.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );
  };
  const archivePart = async (id: string) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'part-archive', id }),
    });
    if (response.ok)
      setPartRequests(partRequests.filter((item) => item.id !== id));
  };
  const archiveInquiry = async (id: string) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'inquiry-archive', id }),
    });
    if (response.ok)
      setSellerInquiries(sellerInquiries.filter((item) => item.id !== id));
  };
  const reviewSellRequest = async (
    request: SellRequest,
    action: 'sell-accept' | 'sell-reject',
  ) => {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, id: request.id }),
    });
    if (!response.ok) return;
    if (action === 'sell-accept') {
      const result = (await response.json()) as { car: Car };
      setInventory([
        result.car,
        ...inventory.filter((car) => car.id !== result.car.id),
      ]);
    }
    setSellRequests(
      sellRequests.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: action === 'sell-accept' ? 'Accepted' : 'Rejected',
            }
          : item,
      ),
    );
  };
  const updatePrice = (id: number, price: number) =>
    setInventory(inventory.map((c) => (c.id === id ? { ...c, price } : c)));
  const addCar = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const image = formValue(d, 'image', cars[0].image);
    const origin = formValue(d, 'origin', 'local') as 'local' | 'abroad';
    const city = formValue(d, 'city');
    const importRegion = formValue(d, 'importRegion', 'Europe') as
      | 'Europe'
      | 'Asia'
      | 'America';
    setInventory([
      ...inventory,
      {
        id: Date.now(),
        make: formValue(d, 'make'),
        model: formValue(d, 'model'),
        year: Number(formValue(d, 'year')),
        price: Number(formValue(d, 'price')),
        km: Number(formValue(d, 'km')),
        fuel: formValue(d, 'fuel'),
        body: formValue(d, 'body'),
        origin,
        country: origin === 'local' ? formValue(d, 'country') : undefined,
        city: origin === 'local' ? city : undefined,
        importRegion:
          origin === 'abroad' ? importRegion || undefined : undefined,
        location: origin === 'abroad' ? importRegion || 'Europe' : city,
        engineLitres: Number(formValue(d, 'engineLitres', '0')),
        sellerType: formValue(d, 'sellerType', 'Dealer') as Car['sellerType'],
        verified: d.has('verified'),
        available: d.has('available'),
        rentable: origin === 'local' && d.has('rentable'),
        dailyRate:
          origin === 'local' && d.has('rentable')
            ? Number(formValue(d, 'dailyRate', '0'))
            : undefined,
        listedDaysAgo: Number(formValue(d, 'listedDaysAgo', '0')),
        color: formValue(d, 'color', 'Black'),
        transmission: formValue(d, 'transmission', 'Automatic'),
        drivetrain: formValue(d, 'drivetrain', 'FWD'),
        doors: Number(formValue(d, 'doors', '5')),
        seats: Number(formValue(d, 'seats', '5')),
        image,
        images: formImages(d, image),
        badge: 'New listing',
      },
    ]);
    setAdding(false);
  };
  const menu = [
    ['dashboard', 'Overview', BarChart3],
    ['inventory', 'Inventory', CarFront],
    ['brands', 'Brands & models', Cog],
    ['orders', 'Orders', ShoppingBag],
    ['rentals', 'Rentals', KeyRound],
    ['parts', 'Part requests', Package],
    ['seller-listings', 'Seller listings', Plus],
    ['customers', 'Customers', User],
    ['content', 'Site content', Settings],
  ] as const;
  return (
    <div className="layer admin-layer" role="presentation">
      <dialog open className="admin-panel" aria-label="JFcars admin console">
        <aside>
          <button className="logo" onClick={close}>
            <span>JF</span>cars<i>.</i>
          </button>
          <small>ADMIN CONSOLE</small>
          <nav>
            {menu.map(([id, label, Icon]) => (
              <button
                className={tab === id ? 'active' : ''}
                key={id}
                onClick={() => setTab(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </nav>
          <div className="admin-user">
            <span>AK</span>
            <div>
              <b>Admin</b>
              <small>Full access</small>
            </div>
          </div>
        </aside>
        <main>
          <header>
            <div>
              <p>JFcars operations</p>
              <h2>{menu.find((x) => x[0] === tab)?.[1]}</h2>
            </div>
            <button onClick={close}>
              <Eye />
              View storefront
            </button>
            <button className="admin-x" onClick={close}>
              <X />
            </button>
          </header>
          <div className="admin-content">
            {persistenceError && (
              <div className="admin-sync-error" role="alert">
                This change was not saved. Check the listing location, rental
                rate and connection, then try again.
              </div>
            )}
            {tab === 'dashboard' && (
              <>
                <div className="admin-stats">
                  <div>
                    <span>Live listings</span>
                    <b>{inventory.filter((car) => !car.hidden).length}</b>
                    <small>
                      Across {new Set(inventory.map((c) => c.make)).size} brands
                    </small>
                  </div>
                  <div>
                    <span>Rental bookings</span>
                    <b>{rentalOrders.length}</b>
                    <small>Submitted rental requests</small>
                  </div>
                  <div>
                    <span>Parts requests</span>
                    <b>{partRequests.length}</b>
                    <small>
                      {
                        partRequests.filter(
                          (request) => request.status === 'Open',
                        ).length
                      }{' '}
                      awaiting review
                    </small>
                  </div>
                  <div>
                    <span>Seller enquiries</span>
                    <b>{sellerInquiries.length}</b>
                    <small>Saved from listing forms</small>
                  </div>
                </div>
                <section className="admin-card">
                  <h3>Needs attention</h3>
                  {[
                    [
                      `${partRequests.filter((request) => request.status === 'Open').length} new part requests need matching`,
                      'parts',
                    ],
                    [
                      `${sellerInquiries.length} seller enquiries received`,
                      'customers',
                    ],
                    [
                      `${sellRequests.filter((request) => request.status === 'Pending').length} seller listings need review`,
                      'seller-listings',
                    ],
                    [
                      `${inventory.filter((car) => car.images?.length === 1).length} listings need more photos`,
                      'inventory',
                    ],
                  ].map(([x, target], i) => (
                    <div className="attention" key={x}>
                      <span>{i + 1}</span>
                      <b>{x}</b>
                      <button onClick={() => setTab(target)}>
                        Review <ArrowRight />
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}
            {tab === 'inventory' && (
              <>
                <div className="admin-toolbar">
                  <div>
                    <h3>Vehicle inventory</h3>
                    <p>Edit pricing, availability and listing details.</p>
                  </div>
                  <button onClick={() => setAdding(true)}>
                    <Plus />
                    Add vehicle
                  </button>
                </div>
                <div className="admin-table">
                  <div className="admin-row head">
                    <span>Vehicle</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {inventory.map((c) => (
                    <div className="admin-row" key={c.id}>
                      <span className="vehicle-cell">
                        <Image
                          src={c.image}
                          alt=""
                          width={160}
                          height={100}
                          unoptimized
                        />
                        <b>
                          {c.make} {c.model}
                        </b>
                        <small>#{String(c.id).slice(-4)}</small>
                      </span>
                      <span>
                        {c.body} · {c.fuel}
                      </span>
                      <span className="price-edit">
                        FCFA
                        <input
                          type="number"
                          value={c.price}
                          onChange={(e) =>
                            updatePrice(c.id, Number(e.target.value))
                          }
                        />
                      </span>
                      <span>
                        <i
                          className={c.hidden ? 'live-dot hidden' : 'live-dot'}
                        />
                        {c.hidden ? 'Hidden' : 'Live'}
                      </span>
                      <span className="row-actions">
                        <button
                          title="Edit listing"
                          onClick={() => {
                            setAdminEditCountry(
                              c.country || 'Republic of the Congo',
                            );
                            setEditingPhotos(c);
                          }}
                        >
                          <Plus />
                        </button>
                        <button
                          title={c.hidden ? 'Publish listing' : 'Hide listing'}
                          onClick={() =>
                            setInventory(
                              inventory.map((item) =>
                                item.id === c.id
                                  ? {
                                      ...item,
                                      hidden: !item.hidden,
                                      badge:
                                        item.hidden &&
                                        item.badge === 'Pending review'
                                          ? 'New listing'
                                          : item.badge,
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          {c.hidden ? <Eye /> : <EyeOff />}
                        </button>
                        <button
                          title="Delete"
                          onClick={() =>
                            setInventory(inventory.filter((x) => x.id !== c.id))
                          }
                        >
                          <Trash2 />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 'brands' && (
              <>
                <div className="admin-toolbar">
                  <div>
                    <h3>Brands and models</h3>
                    <p>Manage the filters shown to customers.</p>
                  </div>
                  <small>
                    Brands and models are derived from the live inventory.
                  </small>
                </div>
                <div className="brand-admin-grid">
                  {managedBrands.map((b) => {
                    const models = Array.from(
                      new Set(
                        inventory
                          .filter((car) =>
                            car.make
                              .toLowerCase()
                              .includes(b.name.toLowerCase()),
                          )
                          .map((car) => car.model),
                      ),
                    );
                    return (
                      <article key={b.name}>
                        <BrandLogo name={b.name} slug={b.slug} />
                        <div>
                          <h4>{b.name}</h4>
                          <p>
                            {models.length} models · {b.count} listings
                          </p>
                        </div>
                        <div>
                          {models.map((m) => (
                            <span key={m}>{m}</span>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
            {(tab === 'orders' || tab === 'rentals') && (
              <section className="admin-card admin-collection">
                <div>
                  <h3>{tab === 'rentals' ? 'Rental bookings' : 'Orders'}</h3>
                  <b>
                    {tab === 'rentals' ? rentalOrders.length : orders.length}{' '}
                    total
                  </b>
                </div>
                {(tab === 'rentals' ? rentalOrders : orders).length ? (
                  (tab === 'rentals' ? rentalOrders : orders).map((order) => (
                    <article key={order.id}>
                      <span>{order.id.slice(0, 2).toUpperCase()}</span>
                      <b>
                        {order.email} ·{' '}
                        {order.items.map((item) => item.vehicle).join(', ')} ·{' '}
                        {money(order.total, 'en')}
                      </b>
                      {order.items.some((item) => item.rentalStart) && (
                        <small>
                          {order.items
                            .filter((item) => item.rentalStart)
                            .map(
                              (item) =>
                                `${item.rentalStart} → ${item.rentalEnd} · ${item.rentalDays} days · pickup ${item.pickup}`,
                            )
                            .join(' | ')}
                        </small>
                      )}
                      <select
                        value={order.status}
                        onChange={(event) =>
                          void updateOrderStatus(order.id, event.target.value)
                        }
                      >
                        <option>New</option>
                        <option>Contacted</option>
                        <option>Complete</option>
                        <option>Cancelled</option>
                      </select>
                    </article>
                  ))
                ) : (
                  <p>No submitted requests yet.</p>
                )}
              </section>
            )}{' '}
            {tab === 'parts' && (
              <section className="admin-card admin-collection">
                <div>
                  <h3>Parts requests</h3>
                  <b>{partRequests.length} total</b>
                </div>
                {partRequests.length ? (
                  partRequests.map((request) => (
                    <article key={request.id}>
                      <span>{request.id.toString().slice(-2)}</span>
                      <b>
                        {request.vehicle} · {request.part} · {request.delivery}
                      </b>
                      <select
                        value={request.status}
                        onChange={(event) =>
                          void updatePartStatus(
                            request.id,
                            event.target.value as PartRequest['status'],
                          )
                        }
                      >
                        <option>Open</option>
                        <option>In progress</option>
                        <option>Complete</option>
                      </select>
                      <button onClick={() => void archivePart(request.id)}>
                        Archive
                      </button>
                    </article>
                  ))
                ) : (
                  <p>No part requests yet.</p>
                )}
              </section>
            )}{' '}
            {tab === 'seller-listings' && (
              <section className="admin-card admin-collection sell-requests">
                <div>
                  <h3>Seller listing requests</h3>
                  <b>
                    {
                      sellRequests.filter(
                        (request) => request.status === 'Pending',
                      ).length
                    }{' '}
                    pending
                  </b>
                </div>
                {sellRequests.length ? (
                  sellRequests.map((request) => (
                    <article key={request.id}>
                      <Image
                        src={request.car.image}
                        alt=""
                        width={160}
                        height={100}
                        unoptimized
                      />
                      <b>
                        {request.car.make} {request.car.model} ·{' '}
                        {carPlace(request.car, 'en')} ·{' '}
                        {money(request.car.price, 'en')}
                      </b>
                      <small>{request.status}</small>
                      <span className="request-actions">
                        <button
                          disabled={request.status !== 'Pending'}
                          onClick={() =>
                            void reviewSellRequest(request, 'sell-accept')
                          }
                        >
                          Publish
                        </button>
                        <button
                          disabled={request.status !== 'Pending'}
                          onClick={() =>
                            void reviewSellRequest(request, 'sell-reject')
                          }
                        >
                          Reject
                        </button>
                      </span>
                    </article>
                  ))
                ) : (
                  <p>No seller listing requests yet.</p>
                )}
              </section>
            )}{' '}
            {tab === 'customers' && (
              <section className="admin-card admin-collection">
                <div>
                  <h3>Seller enquiries</h3>
                  <b>{sellerInquiries.length} total</b>
                </div>
                {sellerInquiries.length ? (
                  sellerInquiries.map((inquiry) => {
                    const car = inventory.find(
                      (item) => item.id === inquiry.carId,
                    );
                    return (
                      <article key={inquiry.id}>
                        <span>{inquiry.id.toString().slice(-2)}</span>
                        <b>
                          {inquiry.customer} · {inquiry.phone} ·{' '}
                          {car
                            ? `${car.make} ${car.model}`
                            : 'Listing unavailable'}
                        </b>
                        <small>{inquiry.message}</small>
                        <button onClick={() => void archiveInquiry(inquiry.id)}>
                          Archive
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <p>No seller enquiries yet.</p>
                )}
              </section>
            )}{' '}
            {tab === 'content' && (
              <section className="admin-card content-form">
                <h3>Storefront content</h3>
                <div
                  className="content-language-tabs"
                  aria-label="Content language"
                >
                  {(['en', 'fr', 'es'] as Lang[]).map((locale) => (
                    <button
                      key={locale}
                      className={contentLocale === locale ? 'active' : ''}
                      onClick={() => setContentLocale(locale)}
                    >
                      {locale.toUpperCase()}
                    </button>
                  ))}
                </div>
                <label>
                  Homepage headline
                  <input
                    value={
                      contentDraft[contentLocale]?.headline ||
                      copy[contentLocale].hero
                    }
                    onChange={(event) =>
                      setContentDraft({
                        ...contentDraft,
                        [contentLocale]: {
                          headline: event.target.value,
                          description:
                            contentDraft[contentLocale]?.description ||
                            copy[contentLocale].sub,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Homepage description
                  <textarea
                    value={
                      contentDraft[contentLocale]?.description ||
                      copy[contentLocale].sub
                    }
                    onChange={(event) =>
                      setContentDraft({
                        ...contentDraft,
                        [contentLocale]: {
                          headline:
                            contentDraft[contentLocale]?.headline ||
                            copy[contentLocale].hero,
                          description: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Announcement
                  <input
                    value="Five regional markets · Clear listing details · Direct seller contact"
                    readOnly
                  />
                </label>
                <button
                  onClick={() => {
                    setStorefrontContent(contentDraft);
                    setContentSaved(true);
                  }}
                >
                  Save storefront changes
                </button>
                {contentSaved && (
                  <p className="form-notice">
                    <Check /> Storefront copy saved to the shared site.
                  </p>
                )}
              </section>
            )}
          </div>
        </main>
      </dialog>
      {adding && (
        <div className="admin-modal">
          <form onSubmit={addCar}>
            <button type="button" onClick={() => setAdding(false)}>
              <X />
            </button>
            <h3>Add a vehicle</h3>
            <div>
              <label>
                Make
                <input name="make" required />
              </label>
              <label>
                Model
                <input name="model" required />
              </label>
              <label>
                Year
                <input name="year" type="number" defaultValue="2024" required />
              </label>
              <label>
                Price (FCFA)
                <input name="price" type="number" required />
              </label>
              <label>
                Mileage
                <input name="km" type="number" required />
              </label>
              <label>
                Fuel
                <select name="fuel">
                  <option>Electric</option>
                  <option>Hybrid</option>
                  <option>Petrol</option>
                  <option>Diesel</option>
                </select>
              </label>
              <label>
                Body
                <select name="body">
                  <option>SUV</option>
                  <option>Sedan</option>
                  <option>Hatchback</option>
                  <option>Wagon</option>
                </select>
              </label>
              <label>
                Stock source
                <select name="origin" defaultValue="local">
                  <option value="local">Local</option>
                  <option value="abroad">Abroad</option>
                </select>
              </label>
              <label>
                Local country
                <select
                  name="country"
                  value={adminAddCountry}
                  onChange={(event) => setAdminAddCountry(event.target.value)}
                >
                  <option>Republic of the Congo</option>
                  <option>Angola</option>
                  <option>Cameroon</option>
                  <option>Gabon</option>
                  <option>DR Congo</option>
                </select>
              </label>
              <label>
                Local city
                <select name="city" key={adminAddCountry}>
                  {citiesByCountry[adminAddCountry].map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label>
                Abroad region
                <select name="importRegion">
                  <option>Europe</option>
                  <option>Asia</option>
                  <option>America</option>
                </select>
              </label>
              <label>
                Engine size (L; 0 electric)
                <input
                  name="engineLitres"
                  type="number"
                  min="0"
                  max="12"
                  step="0.1"
                  defaultValue="2"
                  required
                />
              </label>
              <label>
                Seller type
                <select name="sellerType">
                  <option>Dealer</option>
                  <option>Private</option>
                </select>
              </label>
              <label>
                Listed days ago
                <input
                  name="listedDaysAgo"
                  type="number"
                  min="0"
                  defaultValue="0"
                  required
                />
              </label>
              <label className="admin-checkbox">
                <input name="verified" type="checkbox" /> Verified listing
              </label>
              <label className="admin-checkbox">
                <input name="available" type="checkbox" defaultChecked /> In
                stock
              </label>
              <label className="admin-checkbox">
                <input name="rentable" type="checkbox" /> Available to rent
              </label>
              <label>
                Daily rental rate (FCFA)
                <input
                  name="dailyRate"
                  type="number"
                  min="1000"
                  step="1000"
                  defaultValue="45000"
                  required
                />
              </label>
              <label>
                Color
                <input name="color" defaultValue="Black" required />
              </label>
              <label>
                Transmission
                <select name="transmission">
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </label>
              <label>
                Drivetrain
                <select name="drivetrain">
                  <option>FWD</option>
                  <option>RWD</option>
                  <option>AWD</option>
                </select>
              </label>
              <label>
                Doors
                <input
                  name="doors"
                  type="number"
                  min="2"
                  max="6"
                  defaultValue="5"
                  required
                />
              </label>
              <label>
                Seats
                <input
                  name="seats"
                  type="number"
                  min="2"
                  max="12"
                  defaultValue="5"
                  required
                />
              </label>
              <label>
                Main photo URL
                <input
                  name="image"
                  type="url"
                  placeholder="https://…"
                  required
                />
              </label>
              <label>
                Additional photo URLs
                <textarea name="images" placeholder="One URL per line" />
              </label>
            </div>
            <button className="save-listing">Publish listing</button>
          </form>
        </div>
      )}
      {editingPhotos && (
        <div className="admin-modal">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const image = formValue(data, 'image', editingPhotos.image);
              const origin = formValue(
                data,
                'origin',
                editingPhotos.origin || 'local',
              ) as 'local' | 'abroad';
              const city = formValue(
                data,
                'city',
                editingPhotos.city || editingPhotos.location,
              );
              const importRegion = formValue(
                data,
                'importRegion',
                editingPhotos.importRegion || 'Europe',
              ) as 'Europe' | 'Asia' | 'America';
              setInventory(
                inventory.map((car) =>
                  car.id === editingPhotos.id
                    ? {
                        ...car,
                        make: formValue(data, 'make', car.make),
                        model: formValue(data, 'model', car.model),
                        year: Number(formValue(data, 'year', String(car.year))),
                        price: Number(
                          formValue(data, 'price', String(car.price)),
                        ),
                        km: Number(formValue(data, 'km', String(car.km))),
                        fuel: formValue(data, 'fuel', car.fuel),
                        body: formValue(data, 'body', car.body),
                        color: formValue(data, 'color', car.color || 'Black'),
                        transmission: formValue(
                          data,
                          'transmission',
                          car.transmission || 'Automatic',
                        ),
                        drivetrain: formValue(
                          data,
                          'drivetrain',
                          car.drivetrain || 'FWD',
                        ),
                        origin,
                        country:
                          origin === 'local'
                            ? formValue(
                                data,
                                'country',
                                car.country || 'Republic of the Congo',
                              )
                            : undefined,
                        city: origin === 'local' ? city : undefined,
                        importRegion:
                          origin === 'abroad' ? importRegion : undefined,
                        location: origin === 'abroad' ? importRegion : city,
                        engineLitres: Number(
                          formValue(
                            data,
                            'engineLitres',
                            String(car.engineLitres || 0),
                          ),
                        ),
                        sellerType: formValue(
                          data,
                          'sellerType',
                          car.sellerType || 'Dealer',
                        ) as Car['sellerType'],
                        verified: data.has('verified'),
                        available: data.has('available'),
                        rentable: origin === 'local' && data.has('rentable'),
                        dailyRate:
                          origin === 'local' && data.has('rentable')
                            ? Number(
                                formValue(
                                  data,
                                  'dailyRate',
                                  String(car.dailyRate || 0),
                                ),
                              )
                            : undefined,
                        listedDaysAgo: Number(
                          formValue(
                            data,
                            'listedDaysAgo',
                            String(car.listedDaysAgo || 0),
                          ),
                        ),
                        image,
                        images: formImages(data, image),
                      }
                    : car,
                ),
              );
              setEditingPhotos(null);
            }}
          >
            <button type="button" onClick={() => setEditingPhotos(null)}>
              <X />
            </button>
            <h3>Edit vehicle listing</h3>
            <div>
              <label>
                Make
                <input name="make" defaultValue={editingPhotos.make} required />
              </label>
              <label>
                Model
                <input
                  name="model"
                  defaultValue={editingPhotos.model}
                  required
                />
              </label>
              <label>
                Year
                <input
                  name="year"
                  type="number"
                  defaultValue={editingPhotos.year}
                  required
                />
              </label>
              <label>
                Price (FCFA)
                <input
                  name="price"
                  type="number"
                  defaultValue={editingPhotos.price}
                  required
                />
              </label>
              <label>
                Mileage
                <input
                  name="km"
                  type="number"
                  defaultValue={editingPhotos.km}
                  required
                />
              </label>
              <label>
                Fuel
                <select name="fuel" defaultValue={editingPhotos.fuel}>
                  <option>Electric</option>
                  <option>Hybrid</option>
                  <option>Petrol</option>
                  <option>Diesel</option>
                </select>
              </label>
              <label>
                Body
                <select name="body" defaultValue={editingPhotos.body}>
                  <option>SUV</option>
                  <option>Sedan</option>
                  <option>Hatchback</option>
                  <option>Wagon</option>
                  <option>Coupe</option>
                  <option>Pickup</option>
                  <option>Van</option>
                </select>
              </label>
              <label>
                Color
                <input
                  name="color"
                  defaultValue={editingPhotos.color || 'Black'}
                />
              </label>
              <label>
                Transmission
                <select
                  name="transmission"
                  defaultValue={editingPhotos.transmission || 'Automatic'}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </label>
              <label>
                Drivetrain
                <select
                  name="drivetrain"
                  defaultValue={editingPhotos.drivetrain || 'FWD'}
                >
                  <option>FWD</option>
                  <option>RWD</option>
                  <option>AWD</option>
                </select>
              </label>
              <label>
                Stock source
                <select
                  name="origin"
                  defaultValue={editingPhotos.origin || 'local'}
                >
                  <option value="local">Local</option>
                  <option value="abroad">Abroad</option>
                </select>
              </label>
              <label>
                Local country
                <select
                  name="country"
                  value={adminEditCountry}
                  onChange={(event) => setAdminEditCountry(event.target.value)}
                >
                  <option>Republic of the Congo</option>
                  <option>Angola</option>
                  <option>Cameroon</option>
                  <option>Gabon</option>
                  <option>DR Congo</option>
                </select>
              </label>
              <label>
                Local city
                <select
                  name="city"
                  key={adminEditCountry}
                  defaultValue={
                    citiesByCountry[adminEditCountry].includes(
                      editingPhotos.city || editingPhotos.location,
                    )
                      ? editingPhotos.city || editingPhotos.location
                      : citiesByCountry[adminEditCountry][0]
                  }
                >
                  {citiesByCountry[adminEditCountry].map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </label>
              <label>
                Abroad region
                <select
                  name="importRegion"
                  defaultValue={editingPhotos.importRegion || 'Europe'}
                >
                  <option>Europe</option>
                  <option>Asia</option>
                  <option>America</option>
                </select>
              </label>
              <label>
                Engine size (L; 0 electric)
                <input
                  name="engineLitres"
                  type="number"
                  min="0"
                  max="12"
                  step="0.1"
                  defaultValue={editingPhotos.engineLitres || 0}
                  required
                />
              </label>
              <label>
                Seller type
                <select
                  name="sellerType"
                  defaultValue={editingPhotos.sellerType || 'Dealer'}
                >
                  <option>Dealer</option>
                  <option>Private</option>
                </select>
              </label>
              <label>
                Listed days ago
                <input
                  name="listedDaysAgo"
                  type="number"
                  min="0"
                  defaultValue={editingPhotos.listedDaysAgo || 0}
                  required
                />
              </label>
              <label className="admin-checkbox">
                <input
                  name="verified"
                  type="checkbox"
                  defaultChecked={editingPhotos.verified}
                />{' '}
                Verified listing
              </label>
              <label className="admin-checkbox">
                <input
                  name="available"
                  type="checkbox"
                  defaultChecked={editingPhotos.available !== false}
                />{' '}
                In stock
              </label>
              <label className="admin-checkbox">
                <input
                  name="rentable"
                  type="checkbox"
                  defaultChecked={editingPhotos.rentable === true}
                />{' '}
                Available to rent
              </label>
              <label>
                Daily rental rate (FCFA)
                <input
                  name="dailyRate"
                  type="number"
                  min="1000"
                  step="1000"
                  defaultValue={editingPhotos.dailyRate || 45000}
                  required
                />
              </label>
              <label>
                Main photo URL
                <input
                  name="image"
                  type="url"
                  defaultValue={editingPhotos.image}
                  required
                />
              </label>
              <label>
                Additional photo URLs
                <textarea
                  name="images"
                  defaultValue={(editingPhotos.images || [])
                    .filter((image) => image !== editingPhotos.image)
                    .join('\n')}
                  placeholder="One URL per line"
                />
              </label>
            </div>
            <button className="save-listing">Save listing</button>
          </form>
        </div>
      )}
    </div>
  );
}
