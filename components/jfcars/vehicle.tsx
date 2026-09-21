'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  ShoppingCart,
  X,
} from 'lucide-react';
import {
  type Lang,
  type Car,
  type UserAccount,
  type SellerInquiry,
  canonicalBrandName,
  money,
  rentalRate,
  localize,
  numberFor,
  carPlace,
  accessibilityCopy,
  formValue,
  ui,
  marketCopy,
  flowCopy,
  compareCopy,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
export function VehicleDetails({
  car,
  inventory,
  user,
  lang,
  mode,
  close,
  selectVehicle,
  add,
  inCart,
  onInquiry,
}: {
  car: Car;
  inventory: Car[];
  user: UserAccount | null;
  lang: Lang;
  mode: 'buy' | 'rent' | 'parts';
  close: () => void;
  selectVehicle: (car: Car) => void;
  add: () => void;
  inCart: boolean;
  onInquiry: (inquiry: SellerInquiry) => Promise<boolean>;
}) {
  const u = ui[lang];
  const m = marketCopy[lang];
  const images = Array.from(
    new Set([car.image, ...(car.images || [])].filter(Boolean)),
  );
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
      vehiclePhotos: 'Vehicle photos',
      similar: 'Similar vehicles in the store',
      similarText: 'More available vehicles that closely match this listing.',
      mightLike: 'You might like',
      mightLikeText:
        'Other available vehicles selected by body, fuel and price.',
      viewVehicle: 'View vehicle',
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
      sections: [
        'Photos',
        'Overview',
        'Equipment',
        'Seller',
        'Similar',
        'For you',
      ],
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
      vehiclePhotos: 'Photos du véhicule',
      similar: 'Véhicules similaires en stock',
      similarText: 'D’autres véhicules disponibles proches de cette annonce.',
      mightLike: 'Vous pourriez aimer',
      mightLikeText:
        'D’autres véhicules disponibles selon la carrosserie, l’énergie et le prix.',
      viewVehicle: 'Voir le véhicule',
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
      sections: [
        'Photos',
        'Aperçu',
        'Équipements',
        'Vendeur',
        'Similaires',
        'Pour vous',
      ],
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
      vehiclePhotos: 'Fotos del vehículo',
      similar: 'Vehículos similares en la tienda',
      similarText: 'Más vehículos disponibles similares a este anuncio.',
      mightLike: 'También te puede gustar',
      mightLikeText:
        'Otros vehículos disponibles según carrocería, combustible y precio.',
      viewVehicle: 'Ver vehículo',
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
      sections: [
        'Fotos',
        'Resumen',
        'Equipamiento',
        'Vendedor',
        'Similares',
        'Para ti',
      ],
    },
  }[lang];
  const recommendations = useMemo(() => {
    const unique = new Map<number, Car>();
    inventory.forEach((candidate) => {
      if (
        candidate.id !== car.id &&
        !candidate.hidden &&
        candidate.available !== false
      )
        unique.set(candidate.id, candidate);
    });
    const pool = Array.from(unique.values());
    const priceOf = (candidate: Car) =>
      mode === 'rent' ? rentalRate(candidate) : candidate.price;
    const currentPrice = Math.max(priceOf(car), 1);
    const priceDistance = (candidate: Car) =>
      Math.abs(priceOf(candidate) - currentPrice) / currentPrice;
    const similarScore = (candidate: Car) =>
      (canonicalBrandName(candidate.make) === canonicalBrandName(car.make)
        ? 8
        : 0) +
      (candidate.body === car.body ? 4 : 0) +
      (candidate.fuel === car.fuel ? 2 : 0) +
      ((candidate.origin || 'local') === (car.origin || 'local') ? 1 : 0) +
      Math.max(0, 2 - priceDistance(candidate) * 4);
    const ranked = [...pool].sort(
      (a, b) =>
        similarScore(b) - similarScore(a) ||
        priceDistance(a) - priceDistance(b),
    );
    const similarCount = Math.min(3, Math.max(1, Math.ceil(pool.length / 2)));
    const similar = ranked.slice(0, similarCount);
    const used = new Set(similar.map((candidate) => candidate.id));
    const mightLikeScore = (candidate: Car) =>
      (candidate.body === car.body ? 4 : 0) +
      (candidate.fuel === car.fuel ? 3 : 0) +
      ((candidate.origin || 'local') === (car.origin || 'local') ? 2 : 0) +
      (candidate.verified ? 1 : 0) +
      Math.max(0, 2 - priceDistance(candidate) * 3);
    const mightLike = ranked
      .filter((candidate) => !used.has(candidate.id))
      .sort(
        (a, b) =>
          mightLikeScore(b) - mightLikeScore(a) ||
          priceDistance(a) - priceDistance(b),
      )
      .slice(0, 3);
    return { similar, mightLike };
  }, [car, inventory, mode]);
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
  const detailSections = [
    [labels.sections[0], 'detail-photos'],
    [labels.sections[1], 'detail-overview'],
    [labels.sections[2], 'detail-equipment'],
    [labels.sections[3], 'detail-seller'],
    ...(recommendations.similar.length
      ? [[labels.sections[4], 'detail-similar']]
      : []),
    ...(recommendations.mightLike.length
      ? [[labels.sections[5], 'detail-for-you']]
      : []),
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
        <div className="detail-gallery" id="detail-photos">
          <div className="detail-gallery-heading">
            <h3>
              <Images />
              {labels.vehiclePhotos}
            </h3>
            <span>
              {images.length} {labels.photos}
            </span>
          </div>
          <div className="detail-gallery-stage">
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
          </div>
          <div className="detail-thumbnails">
            {images.map((image, i) => (
              <button
                key={`${image}-${i}`}
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
                    <input
                      name="customer"
                      defaultValue={user?.name || ''}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    {labels.contactPhone}
                    <input
                      name="phone"
                      defaultValue={user?.phone || ''}
                      autoComplete="tel"
                      required
                      type="tel"
                    />
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
          {detailSections.map(([label, sectionId]) => (
            <button
              key={sectionId}
              onClick={() =>
                document
                  .getElementById(sectionId)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            >
              {label}
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
        {recommendations.similar.length > 0 && (
          <section className="detail-recommendations" id="detail-similar">
            <header>
              <h3>{labels.similar}</h3>
              <span>{labels.similarText}</span>
            </header>
            <div className="detail-recommendation-grid">
              {recommendations.similar.map((candidate) => (
                <VehicleRecommendationCard
                  key={candidate.id}
                  car={candidate}
                  lang={lang}
                  mode={mode}
                  action={labels.viewVehicle}
                  onSelect={() => selectVehicle(candidate)}
                />
              ))}
            </div>
          </section>
        )}
        {recommendations.mightLike.length > 0 && (
          <section
            className="detail-recommendations alternate"
            id="detail-for-you"
          >
            <header>
              <h3>{labels.mightLike}</h3>
              <span>{labels.mightLikeText}</span>
            </header>
            <div className="detail-recommendation-grid">
              {recommendations.mightLike.map((candidate) => (
                <VehicleRecommendationCard
                  key={candidate.id}
                  car={candidate}
                  lang={lang}
                  mode={mode}
                  action={labels.viewVehicle}
                  onSelect={() => selectVehicle(candidate)}
                />
              ))}
            </div>
          </section>
        )}
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
                key={`${image}-${i}`}
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
export function VehicleRecommendationCard({
  car,
  lang,
  mode,
  action,
  onSelect,
}: {
  car: Car;
  lang: Lang;
  mode: 'buy' | 'rent' | 'parts';
  action: string;
  onSelect: () => void;
}) {
  return (
    <article className="detail-recommendation-card">
      <button className="recommendation-photo" onClick={onSelect}>
        <Image
          src={car.image}
          alt={`${car.make} ${car.model}`}
          width={720}
          height={460}
          unoptimized
        />
      </button>
      <div>
        <p>
          {car.year} · {localize(car.fuel, lang)}
        </p>
        <h4>
          {car.make} {car.model}
        </h4>
        <span>
          <MapPin />
          {carPlace(car, lang)}
        </span>
        <strong>
          {mode === 'rent'
            ? `${money(rentalRate(car), lang)}/${flowCopy[lang].day}`
            : money(car.price, lang)}
        </strong>
        <button className="recommendation-action" onClick={onSelect}>
          {action}
          <ArrowRight />
        </button>
      </div>
    </article>
  );
}
export function ComparePanel({
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
