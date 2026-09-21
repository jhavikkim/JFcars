'use client';

import Image from 'next/image';
import { isSafeMediaSource } from '@/lib/storefront-content';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Cog,
  GitCompareArrows,
  Heart,
  Images,
  KeyRound,
  Languages,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  type Lang,
  type Currency,
  type Car,
  type UserAccount,
  type PartRequest,
  type SellerInquiry,
  type SellRequest,
  type StorefrontContent,
  type AuthSession,
  type OrderRecord,
  VEHICLE_SELLING_ENABLED,
  copy,
  galleryCopy,
  defaultHeroVideo,
  normalizeGallery,
  cars,
  brands,
  catalogBrands,
  letters,
  money,
  compactMoney,
  convertFromXaf,
  convertToXaf,
  currencyLabel,
  currencyRateDate,
  isCurrency,
  supportedCurrencies,
  rentalRate,
  localize,
  numberFor,
  carPlace,
  citiesByCountry,
  profileCompletion,
  countryForCity,
  accessibilityCopy,
  ui,
  marketCopy,
  footerCopy,
  flowCopy,
  profileCopy,
} from '@/components/jfcars/config';

function PriceRangeInputs({
  currency,
  minPrice,
  maxPrice,
  minLabel,
  maxLabel,
  step,
  onMinCommit,
  onMaxCommit,
}: {
  currency: Currency;
  minPrice: string;
  maxPrice: string;
  minLabel: string;
  maxLabel: string;
  step: number;
  onMinCommit: (value: string) => void;
  onMaxCommit: (value: string) => void;
}) {
  const displayValue = (value: string) => {
    if (value === 'Any') return '';
    const converted = convertFromXaf(Number(value), currency);
    return currency === 'XAF' || currency === 'AOA'
      ? String(Math.round(converted))
      : converted.toFixed(2);
  };
  const [minDraft, setMinDraft] = useState(() => displayValue(minPrice));
  const [maxDraft, setMaxDraft] = useState(() => displayValue(maxPrice));
  const commit = (value: string, update: (next: string) => void) => {
    const amount = Number(value);
    update(
      value && Number.isFinite(amount) && amount >= 0
        ? String(convertToXaf(amount, currency))
        : 'Any',
    );
  };

  return (
    <div className="custom-price-range">
      <label>
        {minLabel}
        <input
          type="number"
          min="0"
          step={step}
          value={minDraft}
          onChange={(event) => setMinDraft(event.target.value)}
          onBlur={() => commit(minDraft, onMinCommit)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </label>
      <label>
        {maxLabel}
        <input
          type="number"
          min="0"
          step={step}
          value={maxDraft}
          onChange={(event) => setMaxDraft(event.target.value)}
          onBlur={() => commit(maxDraft, onMaxCommit)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
      </label>
    </div>
  );
}

export default function JFCarsApp() {
  const [lang, setLang] = useState<Lang>('en'),
    [currency, setCurrency] = useState<Currency>('XAF'),
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
    [, setGalleryFocus] = useState(false),
    [sitePage, setSitePage] = useState<
      'market' | 'gallery' | 'about' | 'contact'
    >('market'),
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
    [infoTopic, setInfoTopic] = useState<
      'about' | 'contact' | 'help' | 'privacy' | 'terms' | null
    >(null),
    [persistenceReady, setPersistenceReady] = useState(false);
  const filterPanelRef = useRef<HTMLElement>(null);
  const filterCloseRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const t = copy[lang],
    u = ui[lang],
    m = marketCopy[lang],
    f = flowCopy[lang],
    a = accessibilityCopy[lang];
  const galleryItems = normalizeGallery(storefrontContent.gallery);
  const currencyCode = (
    {
      XAF: 'FCFA',
      USD: 'US$',
      EUR: '€',
      AOA: 'Kz',
    } satisfies Record<Currency, string>
  )[currency];
  const currencyRateLabel = new Intl.DateTimeFormat(
    lang === 'pt'
      ? 'pt-AO'
      : lang === 'fr'
        ? 'fr-FR'
        : lang === 'es'
          ? 'es-ES'
          : 'en-GB',
    { dateStyle: 'medium', timeZone: 'UTC' },
  ).format(new Date(`${currencyRateDate}T12:00:00Z`));
  const currencyDisclosure =
    lang === 'fr'
      ? `Conversion indicative · taux de référence du ${currencyRateLabel}. Le vendeur confirme le montant final.`
      : lang === 'es'
        ? `Conversión indicativa · tipos de referencia del ${currencyRateLabel}. El vendedor confirma el importe final.`
        : lang === 'pt'
          ? `Conversão indicativa · taxas de referência de ${currencyRateLabel}. O vendedor confirma o valor final.`
          : `Indicative conversion · reference rates from ${currencyRateLabel}. The seller confirms the final amount.`;
  const priceInputStep =
    currency === 'XAF'
      ? mode === 'rent'
        ? 1000
        : 100000
      : currency === 'AOA'
        ? mode === 'rent'
          ? 1000
          : 100000
        : mode === 'rent'
          ? 5
          : 500;
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
    if (!mobileFilters) return;
    const filterTrigger = filterButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileFilters(false);
    };
    const handleDrawerKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileFilters(false);
        return;
      }
      if (event.key !== 'Tab' || !filterPanelRef.current) return;
      const focusable = Array.from(
        filterPanelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    filterCloseRef.current?.focus();
    window.addEventListener('keydown', handleDrawerKeys);
    desktopQuery.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleDrawerKeys);
      desktopQuery.removeEventListener('change', closeOnDesktop);
      filterTrigger?.focus();
    };
  }, [mobileFilters]);
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
            currency?: Currency;
            cart?: number[];
            rentalCart?: number[];
            saved?: number[];
          };
          if (data.lang && ['en', 'fr', 'es', 'pt'].includes(data.lang))
            setLang(data.lang);
          if (isCurrency(data.currency)) setCurrency(data.currency);
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
      const hasUrlLang =
        urlLang === 'en' ||
        urlLang === 'fr' ||
        urlLang === 'es' ||
        urlLang === 'pt';
      if (hasUrlLang) setLang(urlLang as Lang);
      const urlCurrency = params.get('currency');
      const hasUrlCurrency = isCurrency(urlCurrency);
      if (hasUrlCurrency) setCurrency(urlCurrency);
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
              if (account.user) {
                setUser(account.user);
                if (
                  !hasUrlLang &&
                  account.user.preferredLanguage &&
                  ['en', 'fr', 'es', 'pt'].includes(
                    account.user.preferredLanguage,
                  )
                )
                  setLang(account.user.preferredLanguage);
                if (
                  !hasUrlCurrency &&
                  isCurrency(account.user.preferredCurrency)
                )
                  setCurrency(account.user.preferredCurrency);
              }
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
    document.documentElement.lang = lang === 'pt' ? 'pt-AO' : lang;
    if (!persistenceReady) return;
    window.localStorage.setItem(
      'jfcars-store-v5',
      JSON.stringify({
        lang,
        currency,
        cart,
        rentalCart,
        saved,
      }),
    );
  }, [lang, currency, cart, rentalCart, saved, persistenceReady]);
  useEffect(() => {
    if (!persistenceReady) return;
    const params = new URLSearchParams();
    const add = (key: string, value: string, empty: string) => {
      if (value !== empty) params.set(key, value);
    };
    add('lang', lang, 'en');
    add('currency', currency, 'XAF');
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
    currency,
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
          profile: {
            name: user.name,
            phone: user.phone || '',
            country: user.country || '',
            city: user.city || '',
            preferredContact: user.preferredContact || '',
            preferredLanguage: user.preferredLanguage || '',
          },
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
  const updateFacet = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  const chooseBrand = (name: string) => {
    setBrand(name);
    setModel('All');
    setPage(1);
  };
  const selectMode = (next: 'buy' | 'rent' | 'parts') => {
    setGalleryFocus(false);
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
  const scrollToSection = (id: 'inventory' | 'gallery', showHero = true) => {
    setHeroVisible(showHero);
    setMobileMenu(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (!target) return;
        const header = document.querySelector<HTMLElement>('.topbar');
        const top =
          window.scrollY +
          target.getBoundingClientRect().top -
          (header?.offsetHeight || 0) -
          14;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'auto'
            : 'smooth',
        });
      }),
    );
  };
  const headerNavigate = (next: 'buy' | 'rent' | 'parts') => {
    setSitePage('market');
    selectMode(next);
    scrollToSection('inventory', false);
  };
  const galleryNavigate = () => {
    setSitePage('gallery');
    setGalleryFocus(true);
    scrollToSection('gallery');
  };
  const informationNavigate = (page: 'about' | 'contact') => {
    setSitePage(page);
    setGalleryFocus(false);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    query && [`“${query}”`, () => updateFacet(setQuery, '')],
    brand !== 'All' && [brand, () => chooseBrand('All')],
    model !== 'All' && [model, () => updateFacet(setModel, 'All')],
    body !== 'Any' && [localize(body, lang), () => updateFacet(setBody, 'Any')],
    fuel !== 'Any' && [localize(fuel, lang), () => updateFacet(setFuel, 'Any')],
    minPrice !== 'Any' && [
      `≥ ${money(Number(minPrice), lang, currency)}${mode === 'rent' ? `/${f.day}` : ''}`,
      () => updateFacet(setMinPrice, 'Any'),
    ],
    maxPrice !== 'Any' && [
      `${m.under} ${money(Number(maxPrice), lang, currency)}${mode === 'rent' ? `/${f.day}` : ''}`,
      () => updateFacet(setMaxPrice, 'Any'),
    ],
    minYear !== 'Any' && [`${minYear}+`, () => updateFacet(setMinYear, 'Any')],
    location !== 'Any' && [location, () => updateFacet(setLocation, 'Any')],
    origin !== 'Any' &&
      mode !== 'rent' && [
        origin === 'local' ? m.local : m.abroad,
        () => updateFacet(setOrigin, 'Any'),
      ],
    country !== 'Any' && [
      localize(country, lang),
      () => updateFacet(setCountry, 'Any'),
    ],
    importRegion !== 'Any' && [
      localize(importRegion, lang),
      () => updateFacet(setImportRegion, 'Any'),
    ],
    engineMax !== 'Any' && [
      `≤ ${engineMax} L`,
      () => updateFacet(setEngineMax, 'Any'),
    ],
    sellerType !== 'Any' && [
      localize(sellerType, lang),
      () => updateFacet(setSellerType, 'Any'),
    ],
    verifiedOnly && [
      m.verifiedOnly,
      () => {
        setVerifiedOnly(false);
        setPage(1);
      },
    ],
    availableOnly && [
      m.availableOnly,
      () => {
        setAvailableOnly(false);
        setPage(1);
      },
    ],
    latestOnly && [
      m.latestOnly,
      () => {
        setLatestOnly(false);
        setPage(1);
      },
    ],
    color !== 'Any' && [
      localize(color, lang),
      () => updateFacet(setColor, 'Any'),
    ],
    transmission !== 'Any' && [
      localize(transmission, lang),
      () => updateFacet(setTransmission, 'Any'),
    ],
    drivetrain !== 'Any' && [
      drivetrain,
      () => updateFacet(setDrivetrain, 'Any'),
    ],
    maxKm !== 'Any' && [
      `≤ ${Number(maxKm) / 1000}k km`,
      () => updateFacet(setMaxKm, 'Any'),
    ],
    doors !== 'Any' && [
      `${doors} ${m.doorCount}`,
      () => updateFacet(setDoors, 'Any'),
    ],
    seats !== 'Any' && [
      `${seats} ${m.seatCount}`,
      () => updateFacet(setSeats, 'Any'),
    ],
  ].filter(Boolean) as [string, () => void][];
  const locationFilterCount = [
    mode !== 'rent' ? origin : 'Any',
    country,
    mode !== 'rent' ? importRegion : 'Any',
    location,
  ].filter((value) => value !== 'Any').length;
  const essentialsFilterCount = [
    minPrice,
    maxPrice,
    minYear,
    body,
    fuel,
  ].filter((value) => value !== 'Any').length;
  const specificationsFilterCount = [
    engineMax,
    sellerType,
    maxKm,
    transmission,
    drivetrain,
    color,
    doors,
    seats,
  ].filter((value) => value !== 'Any').length;
  const priceFilterSummary = (() => {
    const suffix = mode === 'rent' ? `/${f.day}` : '';
    if (minPrice !== 'Any' && maxPrice !== 'Any')
      return `${money(Number(minPrice), lang, currency)} – ${money(Number(maxPrice), lang, currency)}${suffix}`;
    if (minPrice !== 'Any')
      return `≥ ${money(Number(minPrice), lang, currency)}${suffix}`;
    if (maxPrice !== 'Any')
      return `≤ ${money(Number(maxPrice), lang, currency)}${suffix}`;
    return '';
  })();
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
            setSitePage('market');
            setHeroVisible(true);
            setGalleryFocus(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span>JF</span>cars<i>.</i>
        </button>
        <nav>
          <button
            className={mode === 'buy' && sitePage === 'market' ? 'active' : ''}
            onClick={() => headerNavigate('buy')}
          >
            {u.buyCar}
          </button>
          <button
            className={mode === 'rent' && sitePage === 'market' ? 'active' : ''}
            onClick={() => headerNavigate('rent')}
          >
            {u.rentCar}
          </button>
          <button
            className={
              mode === 'parts' && sitePage === 'market' ? 'active' : ''
            }
            onClick={() => headerNavigate('parts')}
          >
            {u.parts}
          </button>
          <button
            className={sitePage === 'gallery' ? 'active' : ''}
            onClick={galleryNavigate}
          >
            {galleryCopy[lang].nav}
          </button>
          <button
            className={sitePage === 'about' ? 'active' : ''}
            onClick={() => informationNavigate('about')}
          >
            {footerCopy[lang].about}
          </button>
          <button
            className={sitePage === 'contact' ? 'active' : ''}
            onClick={() => informationNavigate('contact')}
          >
            {footerCopy[lang].contact}
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setHeroVisible(false);
                setGalleryFocus(false);
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
              title={
                lang === 'pt'
                  ? 'Português (Angola)'
                  : lang === 'fr'
                    ? 'Français'
                    : lang === 'es'
                      ? 'Español'
                      : 'English'
              }
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">🇬🇧</option>
              <option value="fr">🇫🇷</option>
              <option value="es">🇪🇸</option>
              <option value="pt">🇦🇴</option>
            </select>
          </div>
          <div className="currency-control">
            <select
              aria-label={
                lang === 'fr'
                  ? 'Devise'
                  : lang === 'es'
                    ? 'Moneda'
                    : lang === 'pt'
                      ? 'Moeda'
                      : 'Currency'
              }
              title={
                lang === 'fr'
                  ? 'Changer la devise affichée'
                  : lang === 'es'
                    ? 'Cambiar la moneda mostrada'
                    : lang === 'pt'
                      ? 'Alterar a moeda apresentada'
                      : 'Change display currency'
              }
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              {supportedCurrencies.map((code) => (
                <option key={code} value={code}>
                  {currencyLabel(code)}
                </option>
              ))}
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
            className={`account${user && profileCompletion(user) < 100 ? ' incomplete' : ''}`}
            aria-label={
              user
                ? `${user.name}${profileCompletion(user) < 100 ? ` · ${profileCopy[lang].completeAction}` : ''}`
                : u.signIn
            }
            onClick={() => setPanel(user ? 'profile' : 'auth')}
          >
            {user ? (
              <i className="account-avatar">{user.name.slice(0, 1)}</i>
            ) : (
              <User size={18} />
            )}
            <span>{user ? user.name.split(' ')[0] : u.signIn}</span>
          </button>
          {VEHICLE_SELLING_ENABLED && (
            <button className="sell" onClick={() => setSellOpen(true)}>
              {t.sell}
              <ArrowRight size={17} />
            </button>
          )}
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
          <button onClick={galleryNavigate}>{galleryCopy[lang].nav}</button>
          <button
            onClick={() => {
              informationNavigate('about');
            }}
          >
            {footerCopy[lang].about}
          </button>
          <button
            onClick={() => {
              informationNavigate('contact');
            }}
          >
            {footerCopy[lang].contact}
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setHeroVisible(false);
                setGalleryFocus(false);
                setPanel('admin');
                setMobileMenu(false);
              }}
            >
              Admin console
            </button>
          )}
        </nav>
      )}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={
            sitePage === 'market' && mode === 'buy' && origin !== 'abroad'
              ? 'active'
              : ''
          }
          onClick={() => {
            setOrigin('Any');
            headerNavigate('buy');
          }}
        >
          <CarFront />
          <span>
            {lang === 'fr'
              ? 'Acheter'
              : lang === 'es'
                ? 'Comprar'
                : lang === 'pt'
                  ? 'Comprar'
                  : 'Buy'}
          </span>
        </button>
        <button
          className={sitePage === 'market' && mode === 'rent' ? 'active' : ''}
          onClick={() => headerNavigate('rent')}
        >
          <KeyRound />
          <span>
            {lang === 'fr'
              ? 'Louer'
              : lang === 'es'
                ? 'Alquilar'
                : lang === 'pt'
                  ? 'Alugar'
                  : 'Rent'}
          </span>
        </button>
        <button
          className={sitePage === 'gallery' ? 'active' : ''}
          onClick={galleryNavigate}
        >
          <Images />
          <span>{galleryCopy[lang].nav}</span>
        </button>
        <button
          className={
            sitePage === 'market' && mode === 'buy' && origin === 'abroad'
              ? 'active'
              : ''
          }
          onClick={() => {
            setSitePage('market');
            selectMode('buy');
            setOrigin('abroad');
            setLocation('Any');
            setCountry('Any');
            setPage(1);
            scrollToSection('inventory');
          }}
        >
          <ShoppingBag />
          <span>E-Buy</span>
        </button>
      </nav>
      {sitePage === 'market' && (
        <>
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
                    onChange={(e) => updateFacet(setQuery, e.target.value)}
                    placeholder={t.search}
                  />
                  {query && (
                    <button
                      type="button"
                      className="clear"
                      onClick={() => updateFacet(setQuery, '')}
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
                      type="button"
                      onClick={() =>
                        index === 0
                          ? updateFacet(setFuel, 'Electric')
                          : index === 1
                            ? updateFacet(setBody, 'SUV')
                            : updateFacet(setMaxPrice, '20000000')
                      }
                    >
                      {index === 2
                        ? `${m.under} ${compactMoney(20000000, lang, currency)}`
                        : label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hero-art">
                <HeroVideo
                  src={
                    isSafeMediaSource(storefrontContent.heroVideo)
                      ? storefrontContent.heroVideo
                      : defaultHeroVideo
                  }
                  poster="/jfcars-central-africa-hero.webp"
                  playLabel={a.playHero}
                  pauseLabel={a.pauseHero}
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
                  onChange={(event) =>
                    updateFacet(setQuery, event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter')
                      document.querySelector('.inventory')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
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
                      (availableBrand) =>
                        availableBrand.name === brandOption.name,
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
                  type="button"
                  className={model === 'All' ? 'active' : ''}
                  onClick={() => updateFacet(setModel, 'All')}
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
                    type="button"
                    key={availableModel}
                    className={model === availableModel ? 'active' : ''}
                    onClick={() => updateFacet(setModel, availableModel)}
                  >
                    {availableModel}
                  </button>
                ))}
              </div>
            )}
            <div className="quick-filters">
              <span>{u.refine}</span>
              <button
                type="button"
                onClick={() =>
                  updateFacet(
                    setMaxPrice,
                    mode === 'rent' ? '60000' : '20000000',
                  )
                }
              >
                {m.under}{' '}
                {compactMoney(
                  mode === 'rent' ? 60000 : 20000000,
                  lang,
                  currency,
                )}
                {mode === 'rent' ? `/${f.day}` : ''}
              </button>
              <button type="button" onClick={() => updateFacet(setBody, 'SUV')}>
                SUV
              </button>
              <button
                type="button"
                onClick={() => updateFacet(setFuel, 'Electric')}
              >
                {f.quick[0]}
              </button>
              <button type="button" onClick={reset}>
                {u.clear}
              </button>
            </div>
            {currency !== 'XAF' && (
              <p className="currency-disclosure" role="note">
                {currencyDisclosure}
              </p>
            )}
            {activeFilters.length > 0 && (
              <div className="selected-filters">
                <b>{u.selected}</b>
                {activeFilters.map(([label, clear]) => (
                  <button type="button" key={label} onClick={clear}>
                    {label}
                    <X />
                  </button>
                ))}
                <button type="button" className="clear-filters" onClick={reset}>
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
              <aside
                ref={filterPanelRef}
                id="market-filters"
                className={mobileFilters ? 'filters open' : 'filters'}
                role={mobileFilters ? 'dialog' : undefined}
                aria-modal={mobileFilters || undefined}
                aria-label={t.filters}
              >
                <div className="filter-head">
                  <h2>{t.filters}</h2>
                  <button
                    type="button"
                    className="filter-reset"
                    onClick={reset}
                  >
                    {t.reset}
                  </button>
                  <button
                    ref={filterCloseRef}
                    type="button"
                    className="filter-close"
                    onClick={() => setMobileFilters(false)}
                    aria-label={a.closeFilters}
                  >
                    <X />
                  </button>
                </div>
                <FilterSection
                  title={m.browse}
                  activeCount={brand === 'All' ? 0 : 1}
                >
                  <div className="directory-title">
                    <span>
                      {modeInventory.filter((c) => !c.hidden).length}{' '}
                      {m.listings}
                    </span>
                  </div>
                  <div className="az-grid">
                    {letters.map((l) => (
                      <button
                        type="button"
                        key={l}
                        disabled={
                          !directoryBrands.some((b) => b.name.startsWith(l))
                        }
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
                      type="button"
                      className={brand === 'All' ? 'active' : ''}
                      onClick={() => chooseBrand('All')}
                      aria-pressed={brand === 'All'}
                    >
                      <span>{m.allBrands}</span>
                      <b>{modeInventory.filter((c) => !c.hidden).length}</b>
                    </button>
                    {directoryBrands.map((b) => (
                      <button
                        type="button"
                        key={b.name}
                        className={brand === b.name ? 'active' : ''}
                        onClick={() => chooseBrand(b.name)}
                        aria-pressed={brand === b.name}
                      >
                        <span>{b.name}</span>
                        <b>{b.count}</b>
                      </button>
                    ))}
                  </div>
                </FilterSection>
                <FilterSection
                  title={m.locationGroup}
                  activeCount={locationFilterCount}
                  defaultOpen
                >
                  {mode !== 'rent' && (
                    <Filter
                      key="source"
                      title={m.source}
                      value={origin}
                      set={(value) => {
                        setOrigin(value);
                        setPage(1);
                        if (value === 'local') setImportRegion('Any');
                        if (value === 'abroad') {
                          setCountry('Any');
                          setLocation('Any');
                        }
                      }}
                      values={['Any', 'local', 'abroad']}
                      labels={[t.any, m.local, m.abroad]}
                      defaultOpen
                    />
                  )}
                  {(mode === 'rent' || origin !== 'abroad') && (
                    <Filter
                      key="country"
                      title={m.country}
                      value={country}
                      set={(value) => {
                        setCountry(value);
                        setPage(1);
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
                      key="import-region"
                      title={m.importRegion}
                      value={importRegion}
                      set={(value) => {
                        setImportRegion(value);
                        setPage(1);
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
                      key="location"
                      title={m.location}
                      value={location}
                      set={(value) => {
                        setLocation(value);
                        setPage(1);
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
                </FilterSection>
                <FilterSection
                  title={m.essentialsGroup}
                  activeCount={essentialsFilterCount}
                  defaultOpen
                >
                  <Filter
                    key={`price-${mode}`}
                    title={mode === 'rent' ? m.dailyPrice : t.price}
                    value={maxPrice}
                    set={(value) => updateFacet(setMaxPrice, value)}
                    values={
                      mode === 'rent'
                        ? ['Any', '30000', '40000', '50000', '60000']
                        : [
                            'Any',
                            '15000000',
                            '20000000',
                            '25000000',
                            '30000000',
                          ]
                    }
                    labels={
                      mode === 'rent'
                        ? [
                            t.any,
                            ...[30000, 40000, 50000, 60000].map(
                              (amount) =>
                                `${compactMoney(amount, lang, currency)}/${f.day}`,
                            ),
                          ]
                        : [
                            t.any,
                            ...[15000000, 20000000, 25000000, 30000000].map(
                              (amount) => compactMoney(amount, lang, currency),
                            ),
                          ]
                    }
                    defaultOpen
                    active={minPrice !== 'Any' || maxPrice !== 'Any'}
                    summary={priceFilterSummary}
                  >
                    <PriceRangeInputs
                      key={`${currency}:${mode}:${minPrice}:${maxPrice}`}
                      currency={currency}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      minLabel={`${m.minPrice.replace('FCFA', currencyCode)}${mode === 'rent' ? ` / ${f.day}` : ''}`}
                      maxLabel={`${m.maxPrice.replace('FCFA', currencyCode)}${mode === 'rent' ? ` / ${f.day}` : ''}`}
                      step={priceInputStep}
                      onMinCommit={(value) => updateFacet(setMinPrice, value)}
                      onMaxCommit={(value) => updateFacet(setMaxPrice, value)}
                    />
                  </Filter>
                  <Filter
                    key="year"
                    title={m.year}
                    value={minYear}
                    set={(value) => updateFacet(setMinYear, value)}
                    values={['Any', '2024', '2023', '2022', '2020']}
                    labels={[t.any, '2024', '2023', '2022', '2020']}
                  />
                  <Filter
                    key="body"
                    title={t.body}
                    value={body}
                    set={(value) => updateFacet(setBody, value)}
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
                    key="fuel"
                    title={t.fuel}
                    value={fuel}
                    set={(value) => updateFacet(setFuel, value)}
                    values={['Any', 'Electric', 'Hybrid', 'Petrol', 'Diesel']}
                    labels={[
                      t.any,
                      ...['Electric', 'Hybrid', 'Petrol', 'Diesel'].map(
                        (value) => localize(value, lang),
                      ),
                    ]}
                  />
                </FilterSection>
                <FilterSection
                  title={m.specificationsGroup}
                  activeCount={specificationsFilterCount}
                >
                  <Filter
                    key="engine"
                    title={m.engine}
                    value={engineMax}
                    set={(value) => updateFacet(setEngineMax, value)}
                    values={['Any', '1.6', '2', '3', '4']}
                    labels={[t.any, '≤ 1.6 L', '≤ 2.0 L', '≤ 3.0 L', '≤ 4.0 L']}
                  />
                  <Filter
                    key="seller"
                    title={m.sellerType}
                    value={sellerType}
                    set={(value) => updateFacet(setSellerType, value)}
                    values={['Any', 'Dealer', 'Private']}
                    labels={[
                      t.any,
                      localize('Dealer', lang),
                      localize('Private', lang),
                    ]}
                  />
                  <Filter
                    key="mileage"
                    title={m.mileage}
                    value={maxKm}
                    set={(value) => updateFacet(setMaxKm, value)}
                    values={['Any', '20000', '40000', '60000']}
                    labels={[t.any, '≤20k', '≤40k', '≤60k']}
                  />
                  <Filter
                    key="transmission"
                    title={m.transmission}
                    value={transmission}
                    set={(value) => updateFacet(setTransmission, value)}
                    values={['Any', 'Automatic', 'Manual']}
                    labels={[
                      t.any,
                      localize('Automatic', lang),
                      localize('Manual', lang),
                    ]}
                  />
                  <Filter
                    key="drivetrain"
                    title={m.drivetrain}
                    value={drivetrain}
                    set={(value) => updateFacet(setDrivetrain, value)}
                    values={['Any', 'FWD', 'RWD', 'AWD']}
                    labels={[t.any, 'FWD', 'RWD', 'AWD']}
                  />
                  <Filter
                    key="color"
                    title={m.color}
                    value={color}
                    set={(value) => updateFacet(setColor, value)}
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
                      ...[
                        'Black',
                        'White',
                        'Silver',
                        'Blue',
                        'Yellow',
                        'Sage',
                      ].map((value) => localize(value, lang)),
                    ]}
                  />
                  <Filter
                    key="doors"
                    title={m.doors}
                    value={doors}
                    set={(value) => updateFacet(setDoors, value)}
                    values={['Any', '2', '4', '5']}
                    labels={[t.any, '2', '4', '5']}
                  />
                  <Filter
                    key="seats"
                    title={m.seats}
                    value={seats}
                    set={(value) => updateFacet(setSeats, value)}
                    values={['Any', '2', '5', '7']}
                    labels={[t.any, '2', '5', '7']}
                  />
                </FilterSection>
                <button
                  type="button"
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
                    <h2 aria-live="polite">
                      {filtered.length} {mode === 'rent' ? m.trip : t.results}
                    </h2>
                  </div>
                  <div>
                    <button
                      ref={filterButtonRef}
                      type="button"
                      className="mobile-filter"
                      onClick={() => setMobileFilters(true)}
                      aria-expanded={mobileFilters}
                      aria-controls="market-filters"
                    >
                      <SlidersHorizontal /> {t.filters}
                      {activeFilters.length > 0 && ` (${activeFilters.length})`}
                    </button>
                    <select
                      value={sort}
                      onChange={(e) => updateFacet(setSort, e.target.value)}
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
                    type="button"
                    className={verifiedOnly ? 'active' : ''}
                    onClick={() => {
                      setVerifiedOnly((value) => !value);
                      setPage(1);
                    }}
                    aria-pressed={verifiedOnly}
                  >
                    <Check /> {m.verifiedOnly}
                  </button>
                  <button
                    type="button"
                    className={availableOnly ? 'active' : ''}
                    onClick={() => {
                      setAvailableOnly((value) => !value);
                      setPage(1);
                    }}
                    aria-pressed={availableOnly}
                  >
                    <CarFront /> {m.availableOnly}
                  </button>
                  <button
                    type="button"
                    className={latestOnly ? 'active' : ''}
                    onClick={() => {
                      setLatestOnly((value) => !value);
                      setPage(1);
                    }}
                    aria-pressed={latestOnly}
                  >
                    <Sparkles /> {m.latestOnly}
                  </button>
                  <button
                    type="button"
                    className={sellerType === 'Private' ? 'active' : ''}
                    onClick={() => {
                      setSellerType((value) =>
                        value === 'Private' ? 'Any' : 'Private',
                      );
                      setPage(1);
                    }}
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
                                  : lang === 'pt'
                                    ? 'Anúncio de demonstração'
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
                                  : lang === 'pt'
                                    ? 'Guardar automóvel'
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
                                ? `${money(rentalRate(car), lang, currency)}/${f.day}`
                                : money(car.price, lang, currency)}
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
                                    car.listedDaysAgo === 1
                                      ? m.dayAgo
                                      : m.daysAgo
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
                    {Array.from(
                      { length: pageCount },
                      (_, index) => index + 1,
                    ).map((number) => (
                      <button
                        key={number}
                        className={currentPage === number ? 'active' : ''}
                        onClick={() => setPage(number)}
                        aria-current={
                          currentPage === number ? 'page' : undefined
                        }
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === pageCount}
                      onClick={() =>
                        setPage(Math.min(pageCount, currentPage + 1))
                      }
                      aria-label={a.nextPage}
                    >
                      <ChevronRight />
                    </button>
                  </nav>
                )}
              </div>
            </section>
          )}
        </>
      )}
      {sitePage === 'gallery' && (
        <MainGallery
          lang={lang}
          items={galleryItems}
          title={
            storefrontContent[lang]?.galleryTitle || galleryCopy[lang].title
          }
          description={
            storefrontContent[lang]?.galleryDescription ||
            galleryCopy[lang].description
          }
        />
      )}
      {(sitePage === 'about' || sitePage === 'contact') && (
        <InformationPage lang={lang} page={sitePage} />
      )}
      {VEHICLE_SELLING_ENABLED && (
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
      )}
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
          currency={currency}
          mode={mode}
        />
      )}
      {selectedCar && (
        <VehicleDetails
          key={`${mode}-${selectedCar.id}`}
          car={selectedCar}
          inventory={modeInventory.filter(
            (candidate) => !candidate.hidden && candidate.available !== false,
          )}
          user={user}
          lang={lang}
          currency={currency}
          mode={mode}
          inCart={(mode === 'rent' ? rentalCart : cart).includes(
            selectedCar.id,
          )}
          close={() => setSelectedCar(null)}
          selectVehicle={(candidate) => setSelectedCar(candidate)}
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
          currency={currency}
          onCurrencyChange={setCurrency}
          onLanguageChange={setLang}
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
      {VEHICLE_SELLING_ENABLED && sellOpen && (
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
      <footer className="site-footer">
        <div className="footer-main">
          <section className="footer-brand">
            <button
              className="logo"
              onClick={() => {
                setGalleryFocus(false);
                setHeroVisible(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="JFcars"
            >
              <span>JF</span>cars<i>.</i>
            </button>
            <p>{footerCopy[lang].summary}</p>
            <div className="footer-markets">
              <MapPin />
              <span>{footerCopy[lang].markets}</span>
            </div>
          </section>
          <nav aria-label={footerCopy[lang].explore}>
            <h2>{footerCopy[lang].explore}</h2>
            <button onClick={() => headerNavigate('buy')}>
              {footerCopy[lang].buy}
            </button>
            <button onClick={() => headerNavigate('rent')}>
              {footerCopy[lang].rent}
            </button>
            <button onClick={() => headerNavigate('parts')}>
              {footerCopy[lang].parts}
            </button>
            <button onClick={galleryNavigate}>
              {footerCopy[lang].gallery}
            </button>
            <button onClick={() => informationNavigate('about')}>
              {footerCopy[lang].about}
            </button>
            <button onClick={() => informationNavigate('contact')}>
              {footerCopy[lang].contact}
            </button>
          </nav>
          <nav aria-label={footerCopy[lang].accountHelp}>
            <h2>{footerCopy[lang].accountHelp}</h2>
            <button onClick={() => setPanel(user ? 'profile' : 'auth')}>
              {footerCopy[lang].account}
            </button>
            <button onClick={() => setPanel('cart')}>
              {footerCopy[lang].cartRequests}
            </button>
            <button onClick={() => setInfoTopic('help')}>
              {footerCopy[lang].help}
            </button>
          </nav>
          <nav aria-label={footerCopy[lang].legal}>
            <h2>{footerCopy[lang].legal}</h2>
            <button onClick={() => setInfoTopic('privacy')}>
              {footerCopy[lang].privacy}
            </button>
            <button onClick={() => setInfoTopic('terms')}>
              {footerCopy[lang].terms}
            </button>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>{footerCopy[lang].notice}</p>
          <span>© 2026 JFcars. {footerCopy[lang].copyright}</span>
        </div>
      </footer>
    </main>
  );
}

import { AccountLayer } from '@/components/jfcars/account';
import { AdminPanel } from '@/components/jfcars/admin';
import {
  HeroVideo,
  InformationPage,
  MainGallery,
} from '@/components/jfcars/media';
import {
  BrandLogo,
  Filter,
  FilterSection,
  InfoPanel,
  PartsPanel,
  SellCarPanel,
} from '@/components/jfcars/marketplace-panels';
import { ComparePanel, VehicleDetails } from '@/components/jfcars/vehicle';
