'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  MapPin,
  Package,
  Pause,
  Play,
  X,
} from 'lucide-react';
import {
  type Lang,
  type GalleryItem,
  galleryCopy,
  type GallerySection,
  gallerySections,
  formValue,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
export function HeroVideo({
  src,
  poster,
  playLabel,
  pauseLabel,
}: {
  src: string;
  poster: string;
  playLabel: string;
  pauseLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      return;
    }
    void video.play().catch(() => setPlaying(false));
  }, [src]);
  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };
  return (
    <>
      <video
        ref={videoRef}
        key={src}
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={src} />
      </video>
      <button
        type="button"
        className="hero-video-toggle"
        onClick={toggle}
        aria-label={playing ? pauseLabel : playLabel}
      >
        {playing ? <Pause /> : <Play />}
      </button>
    </>
  );
}

export function InformationPage({
  lang,
  page,
}: {
  lang: Lang;
  page: 'about' | 'contact';
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const words = {
    en: {
      aboutKicker: 'Built for Central African roads',
      aboutTitle: 'Buying a car should feel personal.',
      aboutIntro:
        'JFcars brings vehicles, parts and real shipment updates into one trusted place—with people on the ground to help at every step.',
      storyTitle: 'A marketplace with a human connection',
      story:
        'We created JFcars to make distance feel smaller. Buyers can see clear vehicle details, follow real shipping photos and speak directly with people who understand their market.',
      values: [
        [
          'Clear from the start',
          'Honest details, visible availability and no hidden online payment step.',
        ],
        [
          'Local understanding',
          'Support shaped around the roads, cities and needs of each market.',
        ],
        [
          'Updates you can see',
          'Real photos from preparation, loading, transit and arrival.',
        ],
      ],
      markets: 'Serving five regional markets',
      marketList:
        'Republic of the Congo · Cameroon · Gabon · Cabinda · DR Congo',
      contactKicker: 'Talk to a real person',
      contactTitle: 'How can we help?',
      contactIntro:
        'Questions about a vehicle, a part or a shipment? Send the team a message and include as much detail as you can.',
      name: 'Your name',
      contact: 'Phone, WhatsApp or email',
      message: 'Your message',
      send: 'Send to JFcars',
      sending: 'Sending…',
      success: 'Thank you. The JFcars team has received your message.',
      error: 'We could not send your message. Please try again.',
      response: 'We usually respond within one business day.',
      regional: 'Regional support',
      regionalText:
        'Tell us your country and city so the right team can respond.',
      vehicle: 'Vehicle questions',
      vehicleText: 'Include the make, model or listing name when possible.',
      shipment: 'Shipment updates',
      shipmentText: 'Include your shipment or batch reference if you have one.',
    },
    fr: {
      aboutKicker: 'Pensé pour les routes d’Afrique centrale',
      aboutTitle: 'Acheter une voiture doit rester humain.',
      aboutIntro:
        'JFcars réunit véhicules, pièces et suivi réel des expéditions dans un espace fiable, avec une équipe locale présente à chaque étape.',
      storyTitle: 'Une place de marché avec un vrai contact humain',
      story:
        'Nous avons créé JFcars pour réduire les distances. Les acheteurs consultent des informations claires, suivent les expéditions en photos et échangent avec des personnes qui connaissent leur marché.',
      values: [
        [
          'Clair dès le départ',
          'Des informations honnêtes, une disponibilité visible et aucun paiement caché en ligne.',
        ],
        [
          'Une connaissance locale',
          'Un accompagnement adapté aux routes, aux villes et aux besoins de chaque marché.',
        ],
        [
          'Des nouvelles en images',
          'De vraies photos de la préparation, du chargement, du transit et de l’arrivée.',
        ],
      ],
      markets: 'Présents sur cinq marchés régionaux',
      marketList: 'République du Congo · Cameroun · Gabon · Cabinda · RD Congo',
      contactKicker: 'Parlez à une vraie personne',
      contactTitle: 'Comment pouvons-nous vous aider ?',
      contactIntro:
        'Une question sur un véhicule, une pièce ou une expédition ? Envoyez un message à notre équipe avec le plus de détails possible.',
      name: 'Votre nom',
      contact: 'Téléphone, WhatsApp ou e-mail',
      message: 'Votre message',
      send: 'Envoyer à JFcars',
      sending: 'Envoi…',
      success: 'Merci. L’équipe JFcars a bien reçu votre message.',
      error: 'Votre message n’a pas pu être envoyé. Réessayez.',
      response: 'Nous répondons généralement sous un jour ouvré.',
      regional: 'Assistance régionale',
      regionalText:
        'Indiquez votre pays et votre ville pour être orienté vers la bonne équipe.',
      vehicle: 'Questions sur un véhicule',
      vehicleText:
        'Ajoutez si possible la marque, le modèle ou le nom de l’annonce.',
      shipment: 'Suivi d’expédition',
      shipmentText:
        'Ajoutez votre référence d’expédition ou de lot si vous en avez une.',
    },
    es: {
      aboutKicker: 'Creado para las carreteras de África Central',
      aboutTitle: 'Comprar un coche debe sentirse personal.',
      aboutIntro:
        'JFcars reúne vehículos, repuestos y seguimiento real de envíos en un lugar de confianza, con personas locales que ayudan en cada paso.',
      storyTitle: 'Un mercado con conexión humana',
      story:
        'Creamos JFcars para acortar distancias. Los compradores ven información clara, siguen los envíos con fotos reales y hablan con personas que conocen su mercado.',
      values: [
        [
          'Claridad desde el principio',
          'Datos honestos, disponibilidad visible y ningún pago oculto en línea.',
        ],
        [
          'Conocimiento local',
          'Ayuda adaptada a las carreteras, ciudades y necesidades de cada mercado.',
        ],
        [
          'Novedades que puedes ver',
          'Fotos reales de preparación, carga, tránsito y llegada.',
        ],
      ],
      markets: 'Presentes en cinco mercados regionales',
      marketList:
        'República del Congo · Camerún · Gabón · Cabinda · RD del Congo',
      contactKicker: 'Habla con una persona real',
      contactTitle: '¿Cómo podemos ayudarte?',
      contactIntro:
        '¿Tienes preguntas sobre un vehículo, un repuesto o un envío? Escribe al equipo con todos los detalles posibles.',
      name: 'Tu nombre',
      contact: 'Teléfono, WhatsApp o correo',
      message: 'Tu mensaje',
      send: 'Enviar a JFcars',
      sending: 'Enviando…',
      success: 'Gracias. El equipo de JFcars ha recibido tu mensaje.',
      error: 'No pudimos enviar tu mensaje. Inténtalo de nuevo.',
      response: 'Normalmente respondemos en un día laborable.',
      regional: 'Asistencia regional',
      regionalText:
        'Indica tu país y ciudad para que responda el equipo adecuado.',
      vehicle: 'Preguntas sobre vehículos',
      vehicleText:
        'Incluye la marca, el modelo o el nombre del anuncio si es posible.',
      shipment: 'Seguimiento de envíos',
      shipmentText: 'Incluye la referencia del envío o lote si la tienes.',
    },
  }[lang];

  if (page === 'about')
    return (
      <section className="information-page about-page">
        <div className="information-hero">
          <div>
            <small>{words.aboutKicker}</small>
            <h1>{words.aboutTitle}</h1>
            <p>{words.aboutIntro}</p>
          </div>
          <Image
            src="/jfcars-central-africa-hero.webp"
            width={1200}
            height={800}
            alt="JFcars team with a vehicle"
          />
        </div>
        <div className="about-story">
          <div>
            <small>JFCARS</small>
            <h2>{words.storyTitle}</h2>
            <p>{words.story}</p>
          </div>
          <aside>
            <b>5</b>
            <span>{words.markets}</span>
            <p>{words.marketList}</p>
          </aside>
        </div>
        <div className="about-values">
          {words.values.map(([title, text], index) => (
            <article key={title}>
              <span>{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    );

  return (
    <section className="information-page contact-page">
      <header>
        <small>{words.contactKicker}</small>
        <h1>{words.contactTitle}</h1>
        <p>{words.contactIntro}</p>
      </header>
      <div className="contact-page-grid">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(false);
            const data = new FormData(event.currentTarget);
            try {
              const response = await fetch('/api/marketplace', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  action: 'seller-inquiry',
                  payload: {
                    carId: 0,
                    customer: formValue(data, 'name'),
                    phone: formValue(data, 'contact'),
                    message: formValue(data, 'message'),
                  },
                }),
              });
              if (!response.ok) throw new Error('send failed');
              setSent(true);
              event.currentTarget.reset();
            } catch {
              setError(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {sent ? (
            <div className="contact-page-success">
              <Check />
              <h2>{words.success}</h2>
              <p>{words.response}</p>
              <button type="button" onClick={() => setSent(false)}>
                {words.send}
              </button>
            </div>
          ) : (
            <>
              <label>
                {words.name}
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                {words.contact}
                <input name="contact" required autoComplete="tel" />
              </label>
              <label>
                {words.message}
                <textarea name="message" required rows={7} />
              </label>
              <button type="submit" disabled={busy}>
                {busy ? words.sending : words.send}
                <ArrowRight />
              </button>
              {error && <p className="contact-page-error">{words.error}</p>}
              <small>{words.response}</small>
            </>
          )}
        </form>
        <aside>
          {[
            [words.regional, words.regionalText],
            [words.vehicle, words.vehicleText],
            [words.shipment, words.shipmentText],
          ].map(([title, text], index) => (
            <article key={title}>
              <span>
                {index === 0 ? (
                  <MapPin />
                ) : index === 1 ? (
                  <CarFront />
                ) : (
                  <Package />
                )}
              </span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}

export function MainGallery({
  lang,
  items,
  title,
  description,
}: {
  lang: Lang;
  items: GalleryItem[];
  title: string;
  description: string;
}) {
  const labels = galleryCopy[lang];
  const [activeSection, setActiveSection] = useState<GallerySection>('all');
  const [active, setActive] = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const [mosaicStart, setMosaicStart] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<GalleryItem[]>([]);
  const closeViewer = useCallback(() => setViewerOpen(false), []);
  const section =
    gallerySections.find((entry) => entry.id === activeSection) ||
    gallerySections[0];
  const visibleItems = items.filter((item) =>
    section.statuses.includes(item.status),
  );
  const albums = Array.from(
    visibleItems.reduce((groups, item) => {
      const key = item.reference.trim() || item.id;
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
      return groups;
    }, new Map<string, GalleryItem[]>()),
  ).map(([reference, photos]) => ({ reference, photos, cover: photos[0] }));
  const displayedAlbums = albums.slice(0, visibleCount);
  const resultCount =
    activeSection === 'all' ? visibleItems.length : albums.length;
  const mosaicItems = Array.from(
    { length: Math.min(5, visibleItems.length) },
    (_, offset) => {
      const index = (mosaicStart + offset) % visibleItems.length;
      return { item: visibleItems[index], index };
    },
  );
  useEffect(() => {
    if (
      activeSection !== 'all' ||
      visibleItems.length <= 5 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setMosaicStart((start) => (start + 1) % visibleItems.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [activeSection, visibleItems.length]);
  const caption = (item: GalleryItem) =>
    item.captions[lang] || item.captions.en || labels.untitled;
  const selectSection = (next: GallerySection) => {
    setActiveSection(next);
    setActive(0);
    setVisibleCount(12);
    setMosaicStart(0);
    setViewerOpen(false);
  };
  return (
    <section
      className="main-gallery"
      id="gallery"
      aria-labelledby="gallery-title"
    >
      <header className="main-gallery-header">
        <div>
          <p>
            <Images /> {labels.eyebrow}
          </p>
          <h2 id="gallery-title">{title}</h2>
          <span>{description}</span>
        </div>
        <b className="gallery-photo-count" aria-live="polite">
          {resultCount} {labels.photos}
        </b>
      </header>
      <nav className="gallery-stage-key" aria-label={labels.process}>
        {gallerySections.map((entry) => {
          const sectionItems = items.filter((item) =>
            entry.statuses.includes(item.status),
          );
          const count =
            entry.id === 'all'
              ? sectionItems.length
              : new Set(
                  sectionItems.map((item) => item.reference.trim() || item.id),
                ).size;
          return (
            <button
              type="button"
              key={entry.id}
              aria-pressed={activeSection === entry.id}
              className={activeSection === entry.id ? 'active' : ''}
              onClick={() => selectSection(entry.id)}
            >
              <span>{count}</span>
              <b>{labels.sections[entry.id]}</b>
            </button>
          );
        })}
      </nav>
      {visibleItems.length ? (
        activeSection === 'all' ? (
          <div className="gallery-mosaic">
            {mosaicItems.map(({ item, index }) => (
              <button
                key={item.id}
                onClick={() => {
                  setViewerItems(visibleItems);
                  setActive(index);
                  setViewerOpen(true);
                }}
                aria-label={`${labels.open}: ${caption(item)}`}
              >
                <Image
                  src={item.image}
                  alt={caption(item)}
                  width={900}
                  height={650}
                  unoptimized
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="shipment-cover-grid">
            {displayedAlbums.map((album) => (
              <button
                key={album.reference}
                className="shipment-cover"
                onClick={() => {
                  setViewerItems(album.photos);
                  setActive(0);
                  setViewerOpen(true);
                }}
                aria-label={`${labels.open}: ${caption(album.cover)}`}
              >
                <Image
                  src={album.cover.image}
                  alt={caption(album.cover)}
                  width={900}
                  height={650}
                  unoptimized
                />
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="gallery-empty-stage" aria-live="polite">
          <Package />
          <h3>{labels.sections[activeSection]}</h3>
          <p>{labels.empty}</p>
        </div>
      )}
      {activeSection !== 'all' && resultCount > visibleCount && (
        <button
          type="button"
          className="gallery-load-more"
          onClick={() => setVisibleCount((count) => count + 12)}
        >
          {labels.loadMore}
          <span>{Math.min(12, resultCount - visibleCount)}</span>
        </button>
      )}
      {viewerOpen && viewerItems.length > 0 && (
        <GalleryViewer
          lang={lang}
          items={viewerItems}
          active={active < viewerItems.length ? active : 0}
          setActive={setActive}
          close={closeViewer}
        />
      )}
    </section>
  );
}

export function GalleryViewer({
  lang,
  items,
  active,
  setActive,
  close,
}: {
  lang: Lang;
  items: GalleryItem[];
  active: number;
  setActive: (index: number) => void;
  close: () => void;
}) {
  const labels = galleryCopy[lang];
  const item = items[active] || items[0];
  const caption = (entry: GalleryItem) =>
    entry.captions[lang] || entry.captions.en || labels.untitled;
  const comment = (entry: GalleryItem) =>
    entry.comments[lang] || entry.comments.en || caption(entry);
  const formattedDate = item.date
    ? new Intl.DateTimeFormat(
        lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB',
        { dateStyle: 'medium', timeZone: 'UTC' },
      ).format(new Date(`${item.date}T12:00:00Z`))
    : '';
  const formatLogisticsDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(
          lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB',
          { dateStyle: 'medium', timeZone: 'UTC' },
        ).format(new Date(`${value}T12:00:00Z`))
      : '';
  const move = (direction: number) =>
    setActive((active + direction + items.length) % items.length);
  useDialog(close);
  return (
    <div
      className="layer gallery-viewer-layer"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <dialog
        open
        className="photo-viewer site-photo-viewer"
        aria-label={labels.nav}
      >
        <button
          className="viewer-close"
          onClick={close}
          aria-label={labels.close}
        >
          <X />
        </button>
        <button
          className="viewer-arrow prev"
          onClick={() => move(-1)}
          aria-label={labels.previous}
          disabled={items.length < 2}
        >
          <ChevronLeft />
        </button>
        <figure aria-live="polite">
          <Image
            src={item.image}
            alt={caption(item)}
            width={1536}
            height={1024}
            unoptimized
          />
          <figcaption>
            <span className="viewer-copy">
              <small className={`gallery-status status-${item.status}`}>
                {labels.statuses[item.status]}
              </small>
              <strong>{caption(item)}</strong>
              <span>{comment(item)}</span>
              <em className="viewer-logistics">
                {item.reference && (
                  <span>
                    <b>{labels.reference}</b>
                    {item.reference}
                  </span>
                )}
                {item.location && (
                  <span>
                    <b>{labels.location}</b>
                    {item.location}
                  </span>
                )}
                {item.departureDate && (
                  <span>
                    <b>{labels.departure}</b>
                    {formatLogisticsDate(item.departureDate)}
                  </span>
                )}
                {item.eta && (
                  <span>
                    <b>{labels.eta}</b>
                    {formatLogisticsDate(item.eta)}
                  </span>
                )}
                {formattedDate && (
                  <span>
                    <b>{labels.date}</b>
                    {formattedDate}
                  </span>
                )}
              </em>
            </span>
            <b>
              {active + 1} / {items.length}
            </b>
          </figcaption>
        </figure>
        <button
          className="viewer-arrow next"
          onClick={() => move(1)}
          aria-label={labels.next}
          disabled={items.length < 2}
        >
          <ChevronRight />
        </button>
        <div>
          {items.map((entry, index) => (
            <button
              key={entry.id}
              className={active === index ? 'active' : ''}
              onClick={() => setActive(index)}
              aria-label={caption(entry)}
            >
              <Image
                src={entry.image}
                alt=""
                width={240}
                height={150}
                unoptimized
              />
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
}
