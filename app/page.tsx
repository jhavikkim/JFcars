'use client';

import { useMemo, useState } from 'react';
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
  badge: string;
  color?: string;
  transmission?: string;
  drivetrain?: string;
  doors?: number;
  seats?: number;
  hidden?: boolean;
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
    badge: 'Just arrived',
  },
  {
    id: 3,
    make: 'Mercedes-Benz',
    model: 'GLA 200',
    year: 2021,
    price: 20900000,
    km: 43700,
    fuel: 'Petrol',
    body: 'SUV',
    location: 'Cabinda',
    color: 'Silver',
    transmission: 'Automatic',
    drivetrain: 'FWD',
    doors: 5,
    seats: 5,
    image:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85',
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
    badge: 'Fast charge',
  },
];
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
const brandModels: Record<string, string[]> = {
  Toyota: [
    '4Runner',
    'Camry',
    'Corolla',
    'Corolla Cross',
    'GR Yaris',
    'Land Cruiser',
    'Prius',
    'RAV4',
    'Yaris Cross',
  ],
  BMW: ['1 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5', 'i4', 'iX'],
  Mercedes: [
    'A-Class',
    'C-Class',
    'E-Class',
    'GLA 200',
    'GLC',
    'GLE',
    'EQA',
    'Sprinter',
  ],
  Tesla: [
    'Model 3 Long Range',
    'Model 3 Performance',
    'Model Y',
    'Model S',
    'Model X',
  ],
  Audi: ['A3', 'A4 Avant', 'A5', 'A6', 'Q3', 'Q5', 'Q7', 'e-tron'],
  Volvo: ['XC40 Recharge', 'XC60', 'XC90', 'V60', 'S60', 'EX30'],
  Peugeot: ['e-208 GT', '208', '308', '3008', '5008', 'Partner'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'e:Ny1'],
};
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const money = (n: number, lang: Lang) =>
  `${new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { maximumFractionDigits: 0 }).format(n)} FCFA`;
const formValue = (data: FormData, key: string, fallback = '') => {
  const value = data.get(key);
  return typeof value === 'string' && value ? value : fallback;
};
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
    models: 'Models',
    refine: 'Quick refine',
    clear: 'Clear all',
    selected: 'Selected filters',
    insurance: 'Insurance included',
    options: 'Flexible options',
    added: 'Added',
    inCart: 'In cart',
    book: 'Book now',
    addCart: 'Add to cart',
    details: 'View details',
    overview: 'Overview',
    equipment: 'Equipment',
    seller: 'Seller information',
    contact: 'Contact seller',
    inspected: '150-point inspected',
    noAccident: 'No major accident reported',
    original: 'Original parts verified',
    service: 'Service history available',
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
    models: 'Modèles',
    refine: 'Affiner',
    clear: 'Tout effacer',
    selected: 'Filtres sélectionnés',
    insurance: 'Assurance incluse',
    options: 'Options flexibles',
    added: 'Ajouté',
    inCart: 'Dans le panier',
    book: 'Réserver',
    addCart: 'Ajouter au panier',
    details: 'Voir les détails',
    overview: 'Aperçu',
    equipment: 'Équipements',
    seller: 'Informations vendeur',
    contact: 'Contacter le vendeur',
    inspected: 'Inspection en 150 points',
    noAccident: 'Aucun accident majeur signalé',
    original: 'Pièces d’origine vérifiées',
    service: 'Historique d’entretien disponible',
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
    models: 'Modelos',
    refine: 'Afinar',
    clear: 'Borrar todo',
    selected: 'Filtros seleccionados',
    insurance: 'Seguro incluido',
    options: 'Opciones flexibles',
    added: 'Añadido',
    inCart: 'En el carrito',
    book: 'Reservar',
    addCart: 'Añadir al carrito',
    details: 'Ver detalles',
    overview: 'Resumen',
    equipment: 'Equipamiento',
    seller: 'Información del vendedor',
    contact: 'Contactar al vendedor',
    inspected: 'Inspección de 150 puntos',
    noAccident: 'Sin accidentes graves registrados',
    original: 'Piezas originales verificadas',
    service: 'Historial de mantenimiento disponible',
    close: 'Cerrar detalles',
  },
} as const;
export default function Home() {
  const [lang, setLang] = useState<Lang>('en'),
    [query, setQuery] = useState(''),
    [body, setBody] = useState('Any'),
    [fuel, setFuel] = useState('Any'),
    [maxPrice, setMaxPrice] = useState('Any'),
    [minYear, setMinYear] = useState('Any'),
    [location, setLocation] = useState('Any'),
    [color, setColor] = useState('Any'),
    [transmission, setTransmission] = useState('Any'),
    [drivetrain, setDrivetrain] = useState('Any'),
    [maxKm, setMaxKm] = useState('Any'),
    [doors, setDoors] = useState('Any'),
    [seats, setSeats] = useState('Any'),
    [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState<number[]>([]),
    [compare, setCompare] = useState<number[]>([]),
    [compareOpen, setCompareOpen] = useState(false),
    [selectedCar, setSelectedCar] = useState<Car | null>(null),
    [cart, setCart] = useState<number[]>([]),
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
    [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const t = copy[lang],
    u = ui[lang];
  const filtered = useMemo(() => {
    let r = inventory.filter(
      (c) =>
        !c.hidden &&
        (brand === 'All' ||
          c.make.toLowerCase().includes(brand.toLowerCase())) &&
        (model === 'All' || c.model === model) &&
        (body === 'Any' || c.body === body) &&
        (fuel === 'Any' || c.fuel === fuel) &&
        (maxPrice === 'Any' || c.price <= Number(maxPrice)) &&
        (minYear === 'Any' || c.year >= Number(minYear)) &&
        (location === 'Any' || c.location === location) &&
        (color === 'Any' || c.color === color) &&
        (transmission === 'Any' || c.transmission === transmission) &&
        (drivetrain === 'Any' || c.drivetrain === drivetrain) &&
        (maxKm === 'Any' || c.km <= Number(maxKm)) &&
        (doors === 'Any' || c.doors === Number(doors)) &&
        (seats === 'Any' || c.seats === Number(seats)) &&
        `${c.make} ${c.model} ${c.location} ${c.fuel} ${c.body}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    if (sort === 'price-low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'newest') r = [...r].sort((a, b) => b.year - a.year);
    if (sort === 'oldest') r = [...r].sort((a, b) => a.year - b.year);
    if (sort === 'mileage') r = [...r].sort((a, b) => a.km - b.km);
    return r;
  }, [
    inventory,
    brand,
    model,
    body,
    fuel,
    maxPrice,
    minYear,
    location,
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
  };
  const headerNavigate = (next: 'buy' | 'rent' | 'parts') => {
    setMode(next);
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
    setQuery('');
    setBrand('All');
    setModel('All');
    setBody('Any');
    setFuel('Any');
    setMaxPrice('Any');
    setMinYear('Any');
    setLocation('Any');
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
    body !== 'Any' && [body, () => setBody('Any')],
    fuel !== 'Any' && [fuel, () => setFuel('Any')],
    maxPrice !== 'Any' && [
      `Under ${money(Number(maxPrice), lang)}`,
      () => setMaxPrice('Any'),
    ],
    minYear !== 'Any' && [`${minYear}+`, () => setMinYear('Any')],
    location !== 'Any' && [location, () => setLocation('Any')],
    color !== 'Any' && [color, () => setColor('Any')],
    transmission !== 'Any' && [transmission, () => setTransmission('Any')],
    drivetrain !== 'Any' && [drivetrain, () => setDrivetrain('Any')],
    maxKm !== 'Any' && [`≤ ${Number(maxKm) / 1000}k km`, () => setMaxKm('Any')],
    doors !== 'Any' && [`${doors} doors`, () => setDoors('Any')],
    seats !== 'Any' && [`${seats} seats`, () => setSeats('Any')],
  ].filter(Boolean) as [string, () => void][];
  return (
    <main>
      <header className="topbar">
        <a
          className="logo"
          href="#"
          onClick={() => {
            setHeroVisible(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span>JF</span>cars<i>.</i>
        </a>
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
          <button
            onClick={() => {
              setHeroVisible(false);
              setPanel('admin');
            }}
          >
            Admin
          </button>
        </nav>
        <div className="actions">
          <button className="lang">
            <Languages size={17} />
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
          </button>
          <button
            className="saved"
            aria-label="Open cart"
            onClick={() => setPanel('cart')}
          >
            <ShoppingCart size={18} />
            <span>{u.cart}</span>
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
          <button
            className="account"
            aria-label={user ? 'Open profile' : 'Sign in'}
            onClick={() => setPanel(user ? 'profile' : 'auth')}
          >
            <User size={18} />
            <span>{user ? user.name.split(' ')[0] : u.signIn}</span>
          </button>
          <button className="sell">
            {t.sell}
            <ArrowRight size={17} />
          </button>
          <button
            className="menu"
            aria-label="Menu"
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
          <button
            onClick={() => {
              setHeroVisible(false);
              setPanel('admin');
              setMobileMenu(false);
            }}
          >
            Admin console
          </button>
        </nav>
      )}
      {heroVisible && (
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={15} /> Central Africa’s trusted car market.
            </p>
            <h1>{t.hero}</h1>
            <p>{t.sub}</p>
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
                  aria-label="Clear"
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
              {['Electric', 'SUV', 'Under 20M FCFA'].map((x) => (
                <button
                  key={x}
                  onClick={() =>
                    x === 'Electric'
                      ? setFuel('Electric')
                      : x === 'SUV'
                        ? setBody('SUV')
                        : setMaxPrice('20000000')
                  }
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-art">
            <img
              src="/jfcars-central-africa-hero.png"
              alt="Customers viewing a premium SUV at a Central African car market"
            />
            <div className="stat">
              <b>5</b>
              <span>regional markets</span>
            </div>
            <div className="shape shape-one" />
            <div className="shape shape-two" />
          </div>
        </section>
      )}
      <section className="trust">
        <span>
          <Check />
          7-day returns
        </span>
        <span>
          <Check />
          150-point inspection
        </span>
        <span>
          <Check />
          Simple financing
        </span>
        <span>
          <Check />
          No surprise fees
        </span>
      </section>
      <section className="brand-search" id="inventory">
        <div className="mode-tabs">
          <button
            className={mode === 'buy' ? 'active' : ''}
            onClick={() => setMode('buy')}
          >
            <CarFront />
            {u.buy}
          </button>
          <button
            className={mode === 'rent' ? 'active' : ''}
            onClick={() => setMode('rent')}
          >
            <KeyRound />
            {u.rent}
          </button>
          <button
            className={mode === 'parts' ? 'active' : ''}
            onClick={() => setMode('parts')}
          >
            <Cog />
            {u.partsDemand}
          </button>
        </div>
        <div className="brand-strip">
          <button
            className={brand === 'All' ? 'active' : ''}
            onClick={() => chooseBrand('All')}
          >
            <span className="all-brand">ALL</span>
            <b>{u.allMakes}</b>
          </button>
          {brands.slice(0, 7).map((b) => (
            <button
              key={b.name}
              className={brand == b.name ? 'active' : ''}
              onClick={() => {
                chooseBrand(b.name);
                setMode('buy');
              }}
            >
              <img
                src={`https://cdn.simpleicons.org/${b.slug}/142b3a`}
                alt=""
              />
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
              All {brand}
            </button>
            {(brandModels[brand] || []).map((m) => (
              <button
                key={m}
                className={model === m ? 'active' : ''}
                onClick={() => setModel(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}
        <div className="quick-filters">
          <span>{u.refine}</span>
          <button onClick={() => setMaxPrice('20000000')}>
            Under 20M FCFA
          </button>
          <button onClick={() => setBody('SUV')}>SUV</button>
          <button onClick={() => setFuel('Electric')}>Electric</button>
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
        <PartsPanel lang={lang} />
      ) : (
        <section className="market">
          <aside className={mobileFilters ? 'filters open' : 'filters'}>
            <div className="directory-title">
              <h2>Browse makes</h2>
              <span>{brands.reduce((n, b) => n + b.count, 0)} listings</span>
            </div>
            <div className="az-grid">
              {letters.map((l) => (
                <button
                  key={l}
                  disabled={!brands.some((b) => b.name.startsWith(l))}
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
                <span>All brands</span>
                <b>{inventory.length}</b>
              </button>
              {brands.map((b) => (
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
              >
                <X />
              </button>
            </div>
            <Filter
              title={t.price}
              value={maxPrice}
              set={setMaxPrice}
              values={['Any', '15000000', '20000000', '25000000', '30000000']}
              labels={[t.any, '15M', '20M', '25M', '30M FCFA']}
            />
            <Filter
              title="Year from"
              value={minYear}
              set={setMinYear}
              values={['Any', '2024', '2023', '2022', '2020']}
              labels={[t.any, '2024', '2023', '2022', '2020']}
            />
            <Filter
              title={t.body}
              value={body}
              set={setBody}
              values={['Any', 'SUV', 'Sedan', 'Hatchback', 'Wagon']}
              labels={[t.any, 'SUV', 'Sedan', 'Hatchback', 'Wagon']}
            />
            <Filter
              title={t.fuel}
              value={fuel}
              set={setFuel}
              values={['Any', 'Electric', 'Hybrid', 'Petrol', 'Diesel']}
              labels={[t.any, 'Electric', 'Hybrid', 'Petrol', 'Diesel']}
            />
            <Filter
              title="Location"
              value={location}
              set={setLocation}
              values={[
                'Any',
                'Brazzaville',
                'Pointe-Noire',
                'Cabinda',
                'Douala',
                'Libreville',
                'Kinshasa',
              ]}
              labels={[
                t.any,
                'Brazzaville',
                'Pointe-Noire',
                'Cabinda',
                'Douala',
                'Libreville',
                'Kinshasa',
              ]}
            />
            <Filter
              title="Mileage"
              value={maxKm}
              set={setMaxKm}
              values={['Any', '20000', '40000', '60000']}
              labels={[t.any, '≤20k', '≤40k', '≤60k']}
            />
            <Filter
              title="Transmission"
              value={transmission}
              set={setTransmission}
              values={['Any', 'Automatic', 'Manual']}
              labels={[t.any, 'Automatic', 'Manual']}
            />
            <Filter
              title="Drivetrain"
              value={drivetrain}
              set={setDrivetrain}
              values={['Any', 'FWD', 'RWD', 'AWD']}
              labels={[t.any, 'FWD', 'RWD', 'AWD']}
            />
            <Filter
              title="Color"
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
                'Black',
                'White',
                'Silver',
                'Blue',
                'Yellow',
                'Sage',
              ]}
            />
            <Filter
              title="Doors"
              value={doors}
              set={setDoors}
              values={['Any', '4', '5']}
              labels={[t.any, '4', '5']}
            />
            <Filter
              title="Seats"
              value={seats}
              set={setSeats}
              values={['Any', '2', '5', '7']}
              labels={[t.any, '2', '5', '7']}
            />
            <button
              className="show-results"
              onClick={() => setMobileFilters(false)}
            >
              Show {filtered.length} cars
            </button>
          </aside>
          <div className="inventory">
            <div className="inventory-head">
              <div>
                <p>{mode === 'rent' ? 'AVAILABLE TO RENT' : t.popular}</p>
                <h2>
                  {filtered.length}{' '}
                  {mode === 'rent' ? 'cars ready for your trip' : t.results}
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
                  aria-label="Sort cars"
                >
                  <option value="recommended">{t.sort}</option>
                  <option value="price-low">Price: Low to high</option>
                  <option value="price-high">Price: High to low</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="mileage">Lowest mileage</option>
                </select>
              </div>
            </div>
            {filtered.length ? (
              <div
                className={
                  activeFilters.length ? 'car-grid list-view' : 'car-grid'
                }
              >
                {filtered.map((car) => (
                  <article className="car-card" key={car.id}>
                    <div className="photo">
                      <img src={car.image} alt={`${car.make} ${car.model}`} />
                      <button
                        className="details-hitbox"
                        aria-label={`${u.details}: ${car.make} ${car.model}`}
                        onClick={() => setSelectedCar(car)}
                      />
                      <span className="badge">
                        {mode === 'rent' ? 'Free cancellation' : car.badge}
                      </span>
                      <button
                        className={
                          saved.includes(car.id) ? 'heart on' : 'heart'
                        }
                        aria-label="Save car"
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
                            {car.year} · {car.fuel}
                          </p>
                          <h3>
                            {car.make} {car.model}
                          </h3>
                        </div>
                        <h4>
                          {mode === 'rent'
                            ? `${money(Math.round(car.price / 650), lang)}/day`
                            : money(car.price, lang)}
                        </h4>
                      </div>
                      <div className="meta">
                        <span>{car.km.toLocaleString()} km</span>
                        <span>{car.body}</span>
                        <span>
                          <MapPin /> {car.location}
                        </span>
                      </div>
                      <div className="verified">
                        <Check /> {mode === 'rent' ? u.insurance : t.trusted}
                        <span>
                          {mode === 'rent'
                            ? u.options
                            : `${money(Math.round(car.price / 72), lang)} ${t.monthly}`}
                        </span>
                      </div>
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
                            cart.includes(car.id) ? 'view in-cart' : 'view'
                          }
                          onClick={() =>
                            setCart((s) =>
                              s.includes(car.id) ? s : [...s, car.id],
                            )
                          }
                        >
                          {cart.includes(car.id)
                            ? u.inCart
                            : mode === 'rent'
                              ? u.book
                              : u.addCart}
                          <ShoppingCart />
                        </button>
                      </div>
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
          </div>
        </section>
      )}
      <section className="sell-band">
        <div>
          <p>SELL WITH JFCARS</p>
          <h2>{t.sellCta}</h2>
          <span>{t.sellSub}</span>
        </div>
        <button>
          {t.start}
          <ArrowRight />
        </button>
      </section>
      {compare.length > 0 && (
        <div className="compare-bar">
          <div>
            <GitCompareArrows />
            <span>
              <b>{compare.length}</b> car{compare.length > 1 ? 's' : ''}{' '}
              selected
            </span>
          </div>
          <div>
            <button onClick={() => setCompare([])}>Clear</button>
            <button
              disabled={compare.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              Compare now <ArrowRight />
            </button>
          </div>
        </div>
      )}
      {compareOpen && (
        <ComparePanel
          cars={inventory.filter((c) => compare.includes(c.id))}
          close={() => setCompareOpen(false)}
          remove={(id) => {
            const next = compare.filter((x) => x !== id);
            setCompare(next);
            if (next.length < 2) setCompareOpen(false);
          }}
          add={(id) => setCart((s) => (s.includes(id) ? s : [...s, id]))}
          lang={lang}
        />
      )}
      {selectedCar && (
        <VehicleDetails
          car={selectedCar}
          lang={lang}
          mode={mode}
          inCart={cart.includes(selectedCar.id)}
          close={() => setSelectedCar(null)}
          add={() =>
            setCart((s) =>
              s.includes(selectedCar.id) ? s : [...s, selectedCar.id],
            )
          }
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
          saved={saved}
          lang={lang}
        />
      )}{' '}
      {panel === 'admin' && (
        <AdminPanel
          inventory={inventory}
          setInventory={setInventory}
          close={() => setPanel(null)}
        />
      )}
      <footer>
        <a className="logo" href="#">
          <span>JF</span>cars<i>.</i>
        </a>
        <p>Move happy. © 2026 JFcars</p>
        <div>
          <a href="#">Help</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </main>
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
  return (
    <div className="filter-group">
      <button className="filter-title">
        <h3>{title}</h3>
        <ChevronDown />
      </button>
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
    </div>
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
  },
} as const;
function PartsPanel({ lang }: { lang: Lang }) {
  const [sent, setSent] = useState(false);
  const p = partCopy[lang];
  return (
    <section className="parts-panel">
      <div className="parts-intro">
        <span>
          <Cog /> {p.k}
        </span>
        <h2>{p.h}</h2>
        <p>{p.p}</p>
        <img
          className="parts-market-image"
          src="/jfcars-parts-market.png"
          alt="Headlamp, brakes, battery and service parts"
        />
        <div className="parts-categories">
          {p.cats.map((x, i) => (
            <span key={x}>
              <b>{i + 1}</b>
              {x}
            </span>
          ))}
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
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <label>
            {p.vehicle}
            <input required placeholder="e.g. 2020 Audi A4" />
          </label>
          <label>
            {p.part}
            <input required placeholder="e.g. Left LED headlight" />
          </label>
          <div>
            <label>
              {p.condition}
              <select>
                <option>Any condition</option>
                <option>New</option>
                <option>Used</option>
                <option>Reconditioned</option>
              </select>
            </label>
            <label>
              {p.delivery}
              <select>
                <option>Republic of the Congo</option>
                <option>Cabinda (Angola)</option>
                <option>Cameroon</option>
                <option>Gabon</option>
                <option>DR Congo</option>
              </select>
            </label>
          </div>
          <label>
            {p.details}
            <textarea placeholder="Add a part number, VIN, color or anything helpful…" />
          </label>
          <button>
            {p.send} <ArrowRight />
          </button>
          <small>
            <CircleDot /> {p.fast}
          </small>
        </form>
      )}
    </section>
  );
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
  saved,
  lang,
}: {
  panel: 'auth' | 'cart' | 'profile';
  close: () => void;
  goAuth: () => void;
  user: { name: string; email: string } | null;
  setUser: (u: { name: string; email: string } | null) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (m: 'signin' | 'signup') => void;
  cart: number[];
  setCart: (v: number[]) => void;
  saved: number[];
  lang: Lang;
}) {
  const [profileTab, setProfileTab] = useState('overview');
  const submit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setUser({
      name: formValue(data, 'name', 'Alex Morgan'),
      email: formValue(data, 'email', 'alex@example.com'),
    });
    close();
  };
  const picked = cars.filter((c) => cart.includes(c.id));
  return (
    <div
      className="layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section className={`drawer ${panel}`}>
        <button className="drawer-close" onClick={close} aria-label="Close">
          <X />
        </button>
        {panel === 'auth' && (
          <div className="auth-box">
            <a className="logo" href="#">
              <span>JF</span>cars<i>.</i>
            </a>
            <p className="auth-kicker">YOUR JFCARS ACCOUNT</p>
            <h2>
              {authMode === 'signin'
                ? 'Welcome back.'
                : 'Let’s get you moving.'}
            </h2>
            <p>
              {authMode === 'signin'
                ? 'Sign in to manage your cars, bookings and requests.'
                : 'Create an account to save, compare and move faster.'}
            </p>
            <div className="auth-tabs">
              <button
                className={authMode === 'signin' ? 'active' : ''}
                onClick={() => setAuthMode('signin')}
              >
                Sign in
              </button>
              <button
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => setAuthMode('signup')}
              >
                Create account
              </button>
            </div>
            <form onSubmit={submit}>
              {authMode === 'signup' && (
                <label>
                  Full name
                  <input name="name" required placeholder="Alex Morgan" />
                </label>
              )}
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="alex@example.com"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  minLength={6}
                  required
                  placeholder="At least 6 characters"
                />
              </label>
              <div className="remember">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button">Forgot password?</button>
              </div>
              <button className="auth-submit">
                {authMode === 'signin' ? 'Sign in' : 'Create my account'}
                <ArrowRight />
              </button>
            </form>
            <small>
              By continuing, you agree to our Terms and Privacy Policy.
            </small>
          </div>
        )}
        {panel === 'cart' && (
          <div className="cart-box">
            <p className="auth-kicker">YOUR SELECTION</p>
            <h2>
              Cart <span>{cart.length}</span>
            </h2>
            {picked.length ? (
              <>
                <div className="cart-items">
                  {picked.map((c) => (
                    <article key={c.id}>
                      <img src={c.image} alt="" />
                      <div>
                        <b>
                          {c.make} {c.model}
                        </b>
                        <span>
                          {c.year} · {c.km.toLocaleString()} km
                        </span>
                        <strong>{money(c.price, lang)}</strong>
                      </div>
                      <button
                        onClick={() => setCart(cart.filter((x) => x !== c.id))}
                      >
                        <X />
                      </button>
                    </article>
                  ))}
                </div>
                <div className="cart-total">
                  <span>Estimated total</span>
                  <b>
                    {money(
                      picked.reduce((n, c) => n + c.price, 0),
                      lang,
                    )}
                  </b>
                </div>
                <button
                  className="checkout"
                  onClick={() => (user ? close() : goAuth())}
                >
                  {user ? 'Continue to checkout' : 'Sign in to continue'}
                  <ArrowRight />
                </button>
                {!user && (
                  <button
                    className="cart-signin"
                    onClick={() => {
                      setAuthMode('signup');
                      goAuth();
                    }}
                  >
                    Create an account at checkout
                  </button>
                )}
              </>
            ) : (
              <div className="cart-empty">
                <ShoppingBag />
                <h3>Your cart is ready for an adventure.</h3>
                <p>Add a car or rental and it will appear here.</p>
                <button onClick={close}>Keep browsing</button>
              </div>
            )}
          </div>
        )}
        {panel === 'profile' && user && (
          <div className="profile-box">
            <div className="profile-head">
              <span>{user.name.slice(0, 1)}</span>
              <div>
                <p>Welcome back</p>
                <h2>{user.name}</h2>
                <small>{user.email}</small>
              </div>
            </div>
            <nav>
              {[
                ['overview', 'Overview', User],
                ['orders', 'Purchases', Package],
                ['rentals', 'Rentals', CalendarDays],
                ['settings', 'Settings', Settings],
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
                  <h3>Your JFcars at a glance</h3>
                  <div className="profile-stats">
                    <div>
                      <Heart />
                      <b>{saved.length}</b>
                      <span>Saved cars</span>
                    </div>
                    <div>
                      <ShoppingCart />
                      <b>{cart.length}</b>
                      <span>In cart</span>
                    </div>
                    <div>
                      <Cog />
                      <b>1</b>
                      <span>Part request</span>
                    </div>
                  </div>
                  <h4>Recent activity</h4>
                  <div className="activity">
                    <span>
                      <Check />
                    </span>
                    <div>
                      <b>Profile ready</b>
                      <p>Your account is set up and ready to go.</p>
                    </div>
                  </div>
                </>
              )}
              {profileTab === 'orders' && (
                <ProfileEmpty
                  icon={Package}
                  title="No purchases yet"
                  text="Your vehicle orders will be tracked here."
                />
              )}
              {profileTab === 'rentals' && (
                <ProfileEmpty
                  icon={CalendarDays}
                  title="No upcoming rentals"
                  text="Book a car and manage your trip here."
                />
              )}
              {profileTab === 'settings' && (
                <>
                  <h3>Profile settings</h3>
                  <label>
                    Full name
                    <input defaultValue={user.name} />
                  </label>
                  <label>
                    Email
                    <input defaultValue={user.email} />
                  </label>
                  <button className="save-profile">Save changes</button>
                </>
              )}
            </div>
            <button
              className="signout"
              onClick={() => {
                setUser(null);
                close();
              }}
            >
              <LogOut />
              Sign out
            </button>
          </div>
        )}
      </section>
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
function VehicleDetails({
  car,
  lang,
  mode,
  close,
  add,
  inCart,
}: {
  car: Car;
  lang: Lang;
  mode: 'buy' | 'rent' | 'parts';
  close: () => void;
  add: () => void;
  inCart: boolean;
}) {
  const u = ui[lang];
  const [photoView, setPhotoView] = useState(0);
  const [added, setAdded] = useState(inCart);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
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
      price: 'Price',
      desc: 'A carefully selected vehicle with transparent details, verified documents and support from our regional team.',
      gallery: ['Exterior', 'Front detail', 'Rear detail'],
      viewAll: 'View all photos',
      photos: 'photos',
      contactTitle: 'Contact this seller',
      contactName: 'Your name',
      contactPhone: 'Phone or WhatsApp',
      contactMessage: 'Message',
      send: 'Send request',
      sent: 'Request sent. The seller will contact you shortly.',
      added: 'Added to cart',
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
      price: 'Prix',
      desc: 'Un véhicule soigneusement sélectionné, avec des informations claires, des documents vérifiés et l’accompagnement de notre équipe régionale.',
      gallery: ['Extérieur', 'Détail avant', 'Détail arrière'],
      viewAll: 'Voir toutes les photos',
      photos: 'photos',
      contactTitle: 'Contacter ce vendeur',
      contactName: 'Votre nom',
      contactPhone: 'Téléphone ou WhatsApp',
      contactMessage: 'Message',
      send: 'Envoyer la demande',
      sent: 'Demande envoyée. Le vendeur vous contactera rapidement.',
      added: 'Ajouté au panier',
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
      price: 'Precio',
      desc: 'Un vehículo seleccionado cuidadosamente, con información transparente, documentos verificados y asistencia de nuestro equipo regional.',
      gallery: ['Exterior', 'Detalle frontal', 'Detalle trasero'],
      viewAll: 'Ver todas las fotos',
      photos: 'fotos',
      contactTitle: 'Contactar con este vendedor',
      contactName: 'Tu nombre',
      contactPhone: 'Teléfono o WhatsApp',
      contactMessage: 'Mensaje',
      send: 'Enviar solicitud',
      sent: 'Solicitud enviada. El vendedor se pondrá en contacto pronto.',
      added: 'Añadido al carrito',
      sections: ['Resumen', 'Equipamiento', 'Vendedor'],
    },
  }[lang];
  const specs = [
    [labels.year, car.year],
    [labels.mileage, `${car.km.toLocaleString()} km`],
    [labels.fuel, car.fuel],
    [labels.body, car.body],
    [labels.gearbox, car.transmission || 'Automatic'],
    [labels.drive, car.drivetrain || 'FWD'],
    [labels.color, car.color || '—'],
    [labels.seats, car.seats || 5],
  ];
  return (
    <div
      className="layer vehicle-layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section className="vehicle-detail">
        <button className="detail-close" onClick={close} aria-label={u.close}>
          <X />
        </button>
        <div className="detail-gallery">
          <img
            className={`photo-view-${photoView}`}
            src={car.image}
            alt={`${car.make} ${car.model}`}
          />
          <button
            className="view-all-photos"
            onClick={() => setViewerOpen(true)}
          >
            {labels.viewAll} · 3 {labels.photos}
          </button>
          <div>
            {labels.gallery.map((label, i) => (
              <button
                key={label}
                className={photoView === i ? 'active' : ''}
                onClick={() => setPhotoView(i)}
              >
                <img src={car.image} alt="" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        {viewerOpen && (
          <div className="photo-viewer">
            <button
              className="viewer-close"
              onClick={() => setViewerOpen(false)}
              aria-label={u.close}
            >
              <X />
            </button>
            <button
              className="viewer-arrow prev"
              onClick={() => setPhotoView((photoView + 2) % 3)}
              aria-label="Previous photo"
            >
              <ChevronLeft />
            </button>
            <figure>
              <img
                className={`photo-view-${photoView}`}
                src={car.image}
                alt={`${car.make} ${car.model} — ${labels.gallery[photoView]}`}
              />
              <figcaption>
                <span>{labels.gallery[photoView]}</span>
                <b>{photoView + 1} / 3</b>
              </figcaption>
            </figure>
            <button
              className="viewer-arrow next"
              onClick={() => setPhotoView((photoView + 1) % 3)}
              aria-label="Next photo"
            >
              <ChevronRight />
            </button>
            <div>
              {labels.gallery.map((x, i) => (
                <button
                  key={x}
                  className={photoView === i ? 'active' : ''}
                  onClick={() => setPhotoView(i)}
                >
                  <img className={`photo-view-${i}`} src={car.image} alt={x} />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="detail-summary">
          <p className="auth-kicker">{u.inspected}</p>
          <h2>
            {car.make} {car.model}
          </h2>
          <p>{labels.desc}</p>
          <strong>
            {mode === 'rent'
              ? `${money(Math.round(car.price / 650), lang)}/day`
              : money(car.price, lang)}
          </strong>
          <div className="detail-location">
            <MapPin />
            {car.location}
          </div>
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
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
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
                    <input required />
                  </label>
                  <label>
                    {labels.contactPhone}
                    <input required type="tel" />
                  </label>
                  <label>
                    {labels.contactMessage}
                    <textarea defaultValue={`${car.make} ${car.model}`} />
                  </label>
                  <button>
                    {labels.send}
                    <ArrowRight />
                  </button>
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
              'ABS',
              'Air conditioning',
              'Bluetooth',
              'Parking camera',
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
              <p>JFcars Verified Partner · {car.location}</p>
            </div>
          </div>
          <b>4.9 / 5</b>
        </div>
      </section>
    </div>
  );
}
function ComparePanel({
  cars,
  close,
  remove,
  add,
  lang,
}: {
  cars: Car[];
  close: () => void;
  remove: (id: number) => void;
  add: (id: number) => void;
  lang: Lang;
}) {
  return (
    <div
      className="layer compare-layer"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section className="compare-panel">
        <header>
          <div>
            <p>SIDE-BY-SIDE</p>
            <h2>Compare your shortlist</h2>
          </div>
          <button onClick={close} aria-label="Close comparison">
            <X />
          </button>
        </header>
        <div className="compare-columns">
          {cars.map((c) => (
            <article key={c.id}>
              <button
                onClick={() => remove(c.id)}
                aria-label={`Remove ${c.make} ${c.model}`}
              >
                <X />
              </button>
              <img src={c.image} alt="" />
              <p>
                {c.year} · {c.fuel}
              </p>
              <h3>
                {c.make} {c.model}
              </h3>
              <strong>{money(c.price, lang)}</strong>
              <dl>
                <div>
                  <dt>Mileage</dt>
                  <dd>{c.km.toLocaleString()} km</dd>
                </div>
                <div>
                  <dt>Body</dt>
                  <dd>{c.body}</dd>
                </div>
                <div>
                  <dt>Transmission</dt>
                  <dd>{c.transmission}</dd>
                </div>
                <div>
                  <dt>Drivetrain</dt>
                  <dd>{c.drivetrain}</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>{c.seats}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{c.location}</dd>
                </div>
              </dl>
              <button className="compare-cart" onClick={() => add(c.id)}>
                Add to cart <ShoppingCart />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminPanel({
  inventory,
  setInventory,
  close,
}: {
  inventory: Car[];
  setInventory: (cars: Car[]) => void;
  close: () => void;
}) {
  const [tab, setTab] = useState('dashboard'),
    [adding, setAdding] = useState(false);
  const updatePrice = (id: number, price: number) =>
    setInventory(inventory.map((c) => (c.id === id ? { ...c, price } : c)));
  const addCar = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
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
        location: formValue(d, 'location'),
        image: cars[0].image,
        badge: 'New listing',
      },
    ]);
    setAdding(false);
  };
  const menu = [
    ['dashboard', 'Overview', BarChart3],
    ['inventory', 'Inventory', CarFront],
    ['brands', 'Brands & models', Cog],
    ['rentals', 'Rentals', KeyRound],
    ['parts', 'Part requests', Package],
    ['customers', 'Customers', User],
    ['content', 'Site content', Settings],
  ] as const;
  return (
    <div className="layer admin-layer">
      <section className="admin-panel">
        <aside>
          <a className="logo" href="#">
            <span>JF</span>cars<i>.</i>
          </a>
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
            {tab === 'dashboard' && (
              <>
                <div className="admin-stats">
                  <div>
                    <span>Live listings</span>
                    <b>{inventory.length}</b>
                    <small>
                      Across {new Set(inventory.map((c) => c.make)).size} brands
                    </small>
                  </div>
                  <div>
                    <span>Rental bookings</span>
                    <b>24</b>
                    <small>8 active today</small>
                  </div>
                  <div>
                    <span>Parts requests</span>
                    <b>17</b>
                    <small>6 awaiting quote</small>
                  </div>
                  <div>
                    <span>Customers</span>
                    <b>1,248</b>
                    <small>+12% this month</small>
                  </div>
                </div>
                <section className="admin-card">
                  <h3>Needs attention</h3>
                  {[
                    '6 new part requests need matching',
                    '3 rental returns due today',
                    '2 listings need updated photos',
                  ].map((x, i) => (
                    <div className="attention" key={x}>
                      <span>{i + 1}</span>
                      <b>{x}</b>
                      <button>
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
                        <img src={c.image} alt="" />
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
                        <i className="live-dot" />
                        Live
                      </span>
                      <span className="row-actions">
                        <button title="Hide listing">
                          <EyeOff />
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
                  <button>
                    <Plus />
                    Add brand
                  </button>
                </div>
                <div className="brand-admin-grid">
                  {brands.map((b) => (
                    <article key={b.name}>
                      <img
                        src={`https://cdn.simpleicons.org/${b.slug}/142b3a`}
                        alt=""
                      />
                      <div>
                        <h4>{b.name}</h4>
                        <p>
                          {brandModels[b.name]?.length || 0} models · {b.count}{' '}
                          listings
                        </p>
                      </div>
                      <button>Edit</button>
                      <div>
                        {brandModels[b.name]?.map((m) => (
                          <span key={m}>
                            {m}
                            <X />
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
            {tab === 'rentals' && (
              <AdminCollection
                title="Rental bookings"
                count="24"
                items={[
                  'Volvo XC40 · Sep 8–11 · Brazzaville',
                  'Tesla Model 3 · Sep 10–14 · Kinshasa',
                  'Peugeot e-208 · Sep 12–13 · Douala',
                ]}
              />
            )}{' '}
            {tab === 'parts' && (
              <AdminCollection
                title="Parts requests"
                count="17"
                items={[
                  'Audi A4 · Left LED headlight · New',
                  'BMW 330e · Charging module · Used',
                  'Volvo XC40 · Front bumper · Any condition',
                ]}
              />
            )}{' '}
            {tab === 'customers' && (
              <AdminCollection
                title="Customer accounts"
                count="1,248"
                items={[
                  'Alex Morgan · alex@example.com',
                  'Sofia Laurent · sofia@example.com',
                  'Mateo Garcia · mateo@example.com',
                ]}
              />
            )}{' '}
            {tab === 'content' && (
              <section className="admin-card content-form">
                <h3>Storefront content</h3>
                <label>
                  Homepage headline
                  <input defaultValue="Find a car that feels right." />
                </label>
                <label>
                  Homepage description
                  <textarea defaultValue="Good cars, clear details, zero pressure." />
                </label>
                <label>
                  Announcement
                  <input defaultValue="7-day returns · 150-point inspection · No surprise fees" />
                </label>
                <button>Save storefront changes</button>
              </section>
            )}
          </div>
        </main>
      </section>
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
                Location
                <input name="location" required />
              </label>
            </div>
            <button className="save-listing">Publish listing</button>
          </form>
        </div>
      )}
    </div>
  );
}
function AdminCollection({
  title,
  count,
  items,
}: {
  title: string;
  count: string;
  items: string[];
}) {
  return (
    <section className="admin-card admin-collection">
      <div>
        <h3>{title}</h3>
        <b>{count} total</b>
      </div>
      {items.map((item, i) => (
        <article key={item}>
          <span>{i + 1}</span>
          <b>{item}</b>
          <select>
            <option>Open</option>
            <option>In progress</option>
            <option>Complete</option>
          </select>
          <button>Manage</button>
        </article>
      ))}
    </section>
  );
}
