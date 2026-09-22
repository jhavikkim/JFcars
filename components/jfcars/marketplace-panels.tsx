'use client';

import Image from 'next/image';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Cog,
  X,
} from 'lucide-react';
import {
  type Lang,
  type Car,
  type PartRequest,
  type UserAccount,
  copy,
  cars,
  localize,
  citiesByCountry,
  formValue,
  formImages,
  ui,
  flowCopy,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
export function InfoPanel({
  lang,
  topic,
  close,
}: {
  lang: Lang;
  topic: 'about' | 'contact' | 'help' | 'privacy' | 'terms';
  close: () => void;
}) {
  const f = flowCopy[lang];
  const content = {
    about: [f.aboutTitle, f.aboutText],
    contact: [f.contactTitle, f.contactText],
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

export function SellCarPanel({
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
    pt: {
      make: 'Marca',
      model: 'Modelo',
      year: 'Ano',
      price: 'Preço (FCFA)',
      mileage: 'Quilometragem',
      source: 'Onde está o automóvel agora?',
      local: 'Stock local',
      abroad: 'Stock no estrangeiro',
      country: 'País',
      city: 'Cidade',
      region: 'Região de importação',
      engine: 'Cilindrada (litros; 0 para elétrico)',
      fuel: 'Combustível',
      body: 'Carroçaria',
      color: 'Cor',
      photo: 'URL da fotografia principal',
      photos: 'Mais URLs de fotografias',
      onePerLine: 'Um URL por linha',
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
                      : lang === 'pt'
                        ? 'A enviar…'
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
                      : lang === 'pt'
                        ? 'Não foi possível enviar o anúncio. Tente novamente.'
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

export function FilterSection({
  title,
  activeCount,
  defaultOpen = false,
  children,
}: {
  title: string;
  activeCount: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <section className={`filter-section${open ? ' open' : ''}`}>
      <button
        type="button"
        className="filter-section-title"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span>{title}</span>
        <span>
          {activeCount > 0 && <b>{activeCount}</b>}
          <ChevronDown className={open ? 'open' : ''} />
        </span>
      </button>
      <div className="filter-section-content" id={contentId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
export function Filter({
  title,
  value,
  set,
  values,
  labels,
  defaultOpen = false,
  active,
  summary,
  children,
}: {
  title: string;
  value: string;
  set: (v: string) => void;
  values: string[];
  labels: string[];
  defaultOpen?: boolean;
  active?: boolean;
  summary?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const optionsId = useId();
  const selectedIndex = values.indexOf(value);
  const selectedLabel = selectedIndex >= 0 ? labels[selectedIndex] : value;
  const hasActiveValue = active ?? value !== 'Any';
  return (
    <div className={`filter-group${hasActiveValue ? ' active' : ''}`}>
      <button
        type="button"
        className="filter-title"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={optionsId}
      >
        <span className="filter-title-copy">
          <span>{title}</span>
          {!open && hasActiveValue && <small>{summary || selectedLabel}</small>}
        </span>
        <ChevronDown className={open ? 'open' : ''} />
      </button>
      <div className="filter-options" id={optionsId} hidden={!open}>
        <div className="pills">
          {values.map((v, i) => (
            <button
              type="button"
              key={v}
              className={value === v ? 'active' : ''}
              onClick={() => set(v)}
              aria-pressed={value === v}
            >
              {labels[i]}
            </button>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
export function BrandLogo({ name, slug }: { name: string; slug: string }) {
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
    contactName: 'Your name',
    contactEmail: 'Email',
    contactPhone: 'Phone or WhatsApp',
    contactRequired:
      'Add your name and an email address or phone number so we can reply.',
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
    contactName: 'Votre nom',
    contactEmail: 'E-mail',
    contactPhone: 'Téléphone ou WhatsApp',
    contactRequired:
      'Ajoutez votre nom et une adresse e-mail ou un numéro de téléphone pour être recontacté.',
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
    contactName: 'Tu nombre',
    contactEmail: 'Correo electrónico',
    contactPhone: 'Teléfono o WhatsApp',
    contactRequired:
      'Añade tu nombre y un correo electrónico o teléfono para que podamos responder.',
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
  pt: {
    k: 'PEÇAS POR ENCOMENDA',
    h: 'Diga-nos de que peça precisa. Encontramos a certa.',
    p: 'Nova, usada, original ou compatível — vendedores verificados respondem diretamente.',
    s: [
      'Descreva a peça',
      'Receba propostas verificadas',
      'Escolha a melhor opção',
    ],
    received: 'Pedido recebido.',
    receivedP:
      'Vamos encontrar a sua peça junto de vendedores verificados e avisá-lo quando chegarem propostas.',
    again: 'Enviar outro pedido',
    vehicle: 'Marca e modelo do veículo',
    part: 'Peça necessária',
    condition: 'Estado da peça',
    delivery: 'País de entrega',
    details: 'Detalhes',
    contactName: 'O seu nome',
    contactEmail: 'E-mail',
    contactPhone: 'Telefone ou WhatsApp',
    contactRequired:
      'Adicione o seu nome e um e-mail ou telefone para podermos responder.',
    send: 'Enviar o meu pedido',
    fast: 'Normalmente encontrada em até 24 horas',
    cats: ['Iluminação', 'Travões', 'Baterias', 'Peças de manutenção'],
    conditions: ['Qualquer estado', 'Nova', 'Usada', 'Recondicionada'],
    countries: [
      'República do Congo',
      'Angola — Cabinda',
      'Camarões',
      'Gabão',
      'RD Congo',
    ],
  },
} as const;
export function PartsPanel({
  lang,
  user,
  onRequest,
}: {
  lang: Lang;
  user: UserAccount | null;
  onRequest: (request: PartRequest) => Promise<PartRequest | null>;
}) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [selectedPart, setSelectedPart] = useState(0);
  const [partName, setPartName] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const contactTouched = useRef({ name: false, email: false, phone: false });
  useEffect(() => {
    if (!contactTouched.current.name) setContactName(user?.name || '');
    if (!contactTouched.current.email) setContactEmail(user?.email || '');
    if (!contactTouched.current.phone) setContactPhone(user?.phone || '');
  }, [user?.email, user?.name, user?.phone]);
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
    pt: [
      'Faróis, lâmpadas e iluminação da carroçaria',
      'Pastilhas, discos e componentes hidráulicos',
      'Baterias de arranque e para veículos elétricos',
      'Filtros, correias e kits de manutenção',
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
                : lang === 'pt'
                  ? 'Faróis, travões, bateria e peças de manutenção'
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
            const submittedName = contactName.trim();
            const submittedEmail = contactEmail.trim();
            const submittedPhone = contactPhone.trim();
            if (!submittedName || (!submittedEmail && !submittedPhone)) {
              setContactError(true);
              setSubmitError(false);
              return;
            }
            setSubmitting(true);
            setSubmitError(false);
            setContactError(false);
            const saved = await onRequest({
              id: crypto.randomUUID(),
              vehicle: formValue(data, 'vehicle'),
              part: formValue(data, 'part'),
              condition: formValue(data, 'condition', p.conditions[0]),
              delivery: formValue(data, 'delivery', p.countries[0]),
              details: formValue(data, 'details'),
              contactName: submittedName,
              contactEmail: submittedEmail,
              contactPhone: submittedPhone,
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
                    : lang === 'pt'
                      ? 'ex.: Audi A4 de 2020'
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
                    : lang === 'pt'
                      ? 'ex.: farol LED esquerdo'
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
                    : lang === 'pt'
                      ? 'Adicione a referência da peça, VIN, cor ou qualquer informação útil…'
                      : 'Add a part number, VIN, color or anything helpful…'
              }
            />
          </label>
          <div className="parts-contact-fields">
            <label>
              {p.contactName}
              <input
                name="contactName"
                autoComplete="name"
                value={contactName}
                onChange={(event) => {
                  contactTouched.current.name = true;
                  setContactName(event.target.value);
                  setContactError(false);
                }}
                required
              />
            </label>
            <label>
              {p.contactEmail}
              <input
                name="contactEmail"
                type="email"
                autoComplete="email"
                value={contactEmail}
                onChange={(event) => {
                  contactTouched.current.email = true;
                  setContactEmail(event.target.value);
                  setContactError(false);
                }}
              />
            </label>
            <label>
              {p.contactPhone}
              <input
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                value={contactPhone}
                onChange={(event) => {
                  contactTouched.current.phone = true;
                  setContactPhone(event.target.value);
                  setContactError(false);
                }}
              />
            </label>
          </div>
          {contactError && (
            <p className="form-notice error" role="alert">
              {p.contactRequired}
            </p>
          )}
          <button disabled={submitting}>
            {submitting
              ? lang === 'fr'
                ? 'Envoi…'
                : lang === 'es'
                  ? 'Enviando…'
                  : lang === 'pt'
                    ? 'A enviar…'
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
                  : lang === 'pt'
                    ? 'Não foi possível enviar o pedido. Tente novamente.'
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
