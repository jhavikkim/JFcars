'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ArrowRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Images,
  Mail,
  MapPin,
  MessageCircle,
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
  localeFor,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
import { JFCARS_EMAILS } from '@/lib/brand';
import { mailtoHref, whatsappHref } from '@/lib/contact';

function GalleryMediaTile({
  item,
  alt,
  videoLabel,
}: {
  item: GalleryItem;
  alt: string;
  videoLabel: string;
}) {
  if (item.mediaType === 'video')
    return (
      <span className="gallery-video-tile" aria-hidden="true">
        <Play />
        <b>{videoLabel}</b>
      </span>
    );
  return (
    <Image
      src={item.image}
      alt={alt}
      width={900}
      height={650}
      unoptimized
      loading="lazy"
      decoding="async"
      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 34vw"
    />
  );
}

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

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
  const heroIsVisible = useMediaQuery('(min-width: 701px)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const videoIsAvailable = heroIsVisible && !reduceMotion;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!videoIsAvailable) return;

    const video = videoRef.current;
    if (!video) return;
    let intersects = false;
    const syncPlayback = () => {
      if (intersects && !document.hidden)
        void video.play().catch(() => setPlaying(false));
      else video.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersects = entry.isIntersecting;
        syncPlayback();
      },
      { rootMargin: '160px 0px', threshold: 0.05 },
    );
    observer.observe(video);
    document.addEventListener('visibilitychange', syncPlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      video.pause();
    };
  }, [src, videoIsAvailable]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video || !videoIsAvailable) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };

  if (!heroIsVisible) return null;

  if (reduceMotion) {
    return (
      <Image
        src={poster}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 701px) 46vw, 0px"
        priority
        aria-hidden="true"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        key={src}
        muted
        loop
        playsInline
        poster={poster}
        preload="none"
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
  whatsappNumber,
}: {
  lang: Lang;
  page: 'about' | 'contact';
  whatsappNumber?: string;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const words = {
    en: {
      aboutKicker: 'A family legacy built over 25+ years',
      aboutTitle: 'Local roots. Global reach. One family vision.',
      aboutIntro:
        'JFcars grew from more than 25 years of hands-on experience in Central Africa’s automotive market. What began with our fathers is now carried forward by the next generation—with the same practical knowledge, trusted relationships and commitment to serving our communities.',
      storyTitle: 'From our fathers’ business to a wider world',
      story:
        'For decades, our family worked directly with drivers, mechanics and businesses in the local market. We saw the same challenge again and again: dependable parts for many vehicle brands were difficult to find, and motorcycle parts were even harder to source.',
      storySecond:
        'JFcars was created to close that gap. We connect customers in Central Africa with vehicles and mechanical parts sourced from markets around the world. From the first request to sourcing, shipping and arrival, our team keeps every order clear, personal and within the agreed timeframe.',
      values: [
        [
          '25+ years, locally rooted',
          'Experience passed from one generation to the next, grounded in the realities of our local markets.',
        ],
        [
          'Worldwide sourcing',
          'Vehicles, car parts and motorcycle parts sourced across international markets to answer local needs.',
        ],
        [
          'Delivery you can follow',
          'Clear expectations, agreed timeframes and visible updates from preparation through arrival.',
        ],
      ],
      markets: 'years of local market experience',
      marketList:
        'Serving the Republic of the Congo · Cameroon · Gabon · Cabinda · DR Congo',
      parentBrand: 'JFcars is a Justandfun project.',
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
      whatsapp: 'Chat with JFcars on WhatsApp',
      whatsappMessage:
        'Hello JFcars, I would like help with a vehicle, part or shipment.',
      regional: 'Regional support',
      regionalText:
        'Tell us your country and city so the right team can respond.',
      vehicle: 'Vehicle questions',
      vehicleText: 'Include the make, model or listing name when possible.',
      shipment: 'Shipment updates',
      shipmentText: 'Include your shipment or batch reference if you have one.',
      supportEmail: 'Customer support',
      supportEmailText: 'Questions, help and follow-up',
      salesEmail: 'Sales & orders',
      salesEmailText: 'Vehicles, rentals, parts and quotations',
    },
    fr: {
      aboutKicker: 'Un héritage familial de plus de 25 ans',
      aboutTitle:
        'Des racines locales. Une ouverture mondiale. Une vision familiale.',
      aboutIntro:
        'JFcars est née de plus de 25 ans d’expérience concrète sur le marché automobile d’Afrique centrale. L’activité fondée par nos pères est aujourd’hui portée par la nouvelle génération, avec le même savoir-faire, les mêmes relations de confiance et le même engagement envers nos communautés.',
      storyTitle: 'De l’activité de nos pères à un réseau ouvert sur le monde',
      story:
        'Pendant des décennies, notre famille a travaillé directement avec les conducteurs, les mécaniciens et les entreprises du marché local. Un problème revenait sans cesse : les pièces fiables pour de nombreuses marques étaient difficiles à trouver, et les pièces de moto l’étaient davantage encore.',
      storySecond:
        'JFcars a été créée pour combler ce manque. Nous mettons les clients d’Afrique centrale en relation avec des véhicules et des pièces mécaniques provenant de marchés du monde entier. De la demande initiale à la recherche, l’expédition et l’arrivée, notre équipe assure un suivi clair, humain et conforme au délai convenu.',
      values: [
        [
          'Plus de 25 ans d’ancrage local',
          'Une expérience transmise d’une génération à l’autre et fondée sur les réalités de nos marchés.',
        ],
        [
          'Un approvisionnement mondial',
          'Des véhicules, des pièces automobiles et des pièces de moto recherchés sur les marchés internationaux selon les besoins locaux.',
        ],
        [
          'Une livraison que vous pouvez suivre',
          'Des délais convenus, des informations claires et un suivi visible de la préparation jusqu’à l’arrivée.',
        ],
      ],
      markets: 'ans d’expérience sur le marché local',
      marketList:
        'Au service de la République du Congo · Cameroun · Gabon · Cabinda · RD Congo',
      parentBrand: 'JFcars est un projet de Justandfun.',
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
      whatsapp: 'Discuter avec JFcars sur WhatsApp',
      whatsappMessage:
        'Bonjour JFcars, je souhaite obtenir de l’aide pour un véhicule, une pièce ou une expédition.',
      regional: 'Assistance régionale',
      regionalText:
        'Indiquez votre pays et votre ville pour être orienté vers la bonne équipe.',
      vehicle: 'Questions sur un véhicule',
      vehicleText:
        'Ajoutez si possible la marque, le modèle ou le nom de l’annonce.',
      shipment: 'Suivi d’expédition',
      shipmentText:
        'Ajoutez votre référence d’expédition ou de lot si vous en avez une.',
      supportEmail: 'Service client',
      supportEmailText: 'Questions, assistance et suivi',
      salesEmail: 'Ventes et commandes',
      salesEmailText: 'Véhicules, locations, pièces et devis',
    },
    es: {
      aboutKicker: 'Un legado familiar de más de 25 años',
      aboutTitle: 'Raíces locales. Alcance mundial. Una visión familiar.',
      aboutIntro:
        'JFcars nació de más de 25 años de experiencia práctica en el mercado automotor de África Central. El negocio iniciado por nuestros padres continúa hoy en manos de la nueva generación, con el mismo conocimiento, las mismas relaciones de confianza y el mismo compromiso con nuestras comunidades.',
      storyTitle: 'Del negocio de nuestros padres a una red mundial',
      story:
        'Durante décadas, nuestra familia trabajó directamente con conductores, mecánicos y empresas del mercado local. Encontramos siempre el mismo problema: era difícil conseguir repuestos fiables para muchas marcas de vehículos, y las piezas de motocicleta eran aún más escasas.',
      storySecond:
        'JFcars se creó para cerrar esa brecha. Conectamos a los clientes de África Central con vehículos y piezas mecánicas procedentes de mercados de todo el mundo. Desde la primera solicitud hasta la búsqueda, el envío y la llegada, nuestro equipo mantiene cada pedido claro, cercano y dentro del plazo acordado.',
      values: [
        [
          'Más de 25 años de raíces locales',
          'Experiencia transmitida de una generación a otra y basada en la realidad de nuestros mercados.',
        ],
        [
          'Abastecimiento mundial',
          'Vehículos y repuestos para automóviles y motocicletas procedentes de mercados internacionales para responder a las necesidades locales.',
        ],
        [
          'Una entrega que puedes seguir',
          'Expectativas claras, plazos acordados y actualizaciones visibles desde la preparación hasta la llegada.',
        ],
      ],
      markets: 'años de experiencia en el mercado local',
      marketList:
        'Al servicio de República del Congo · Camerún · Gabón · Cabinda · RD del Congo',
      parentBrand: 'JFcars es un proyecto de Justandfun.',
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
      whatsapp: 'Hablar con JFcars por WhatsApp',
      whatsappMessage:
        'Hola JFcars, necesito ayuda con un vehículo, un repuesto o un envío.',
      regional: 'Asistencia regional',
      regionalText:
        'Indica tu país y ciudad para que responda el equipo adecuado.',
      vehicle: 'Preguntas sobre vehículos',
      vehicleText:
        'Incluye la marca, el modelo o el nombre del anuncio si es posible.',
      shipment: 'Seguimiento de envíos',
      shipmentText: 'Incluye la referencia del envío o lote si la tienes.',
      supportEmail: 'Atención al cliente',
      supportEmailText: 'Preguntas, ayuda y seguimiento',
      salesEmail: 'Ventas y pedidos',
      salesEmailText: 'Vehículos, alquileres, repuestos y presupuestos',
    },
    pt: {
      aboutKicker: 'Um legado familiar com mais de 25 anos',
      aboutTitle: 'Raízes locais. Alcance mundial. Uma visão familiar.',
      aboutIntro:
        'A JFcars nasceu de mais de 25 anos de experiência prática no mercado automóvel da África Central. O negócio iniciado pelos nossos pais é hoje continuado pela nova geração, com o mesmo conhecimento, as mesmas relações de confiança e o mesmo compromisso com as nossas comunidades.',
      storyTitle: 'Do negócio dos nossos pais para uma rede mundial',
      story:
        'Durante décadas, a nossa família trabalhou diretamente com condutores, mecânicos e empresas do mercado local. Encontrámos repetidamente o mesmo desafio: era difícil obter peças fiáveis para muitas marcas de veículos, e as peças para motociclos eram ainda mais escassas.',
      storySecond:
        'A JFcars foi criada para preencher essa lacuna. Ligamos clientes da África Central a veículos e peças mecânicas provenientes de mercados de todo o mundo. Desde o primeiro pedido até à procura, expedição e chegada, a nossa equipa mantém cada encomenda clara, próxima e dentro do prazo acordado.',
      values: [
        [
          'Mais de 25 anos de raízes locais',
          'Experiência transmitida de uma geração para a seguinte e baseada na realidade dos nossos mercados.',
        ],
        [
          'Fornecimento mundial',
          'Veículos e peças para automóveis e motociclos provenientes de mercados internacionais para responder às necessidades locais.',
        ],
        [
          'Uma entrega que pode acompanhar',
          'Expectativas claras, prazos acordados e atualizações visíveis desde a preparação até à chegada.',
        ],
      ],
      markets: 'anos de experiência no mercado local',
      marketList:
        'Ao serviço de República do Congo · Camarões · Gabão · Cabinda · RD Congo',
      parentBrand: 'A JFcars é um projeto Justandfun.',
      contactKicker: 'Fale com uma pessoa real',
      contactTitle: 'Como podemos ajudar?',
      contactIntro:
        'Tem dúvidas sobre um veículo, uma peça ou uma expedição? Envie uma mensagem à equipa com o máximo de detalhes possível.',
      name: 'O seu nome',
      contact: 'Telefone, WhatsApp ou e-mail',
      message: 'A sua mensagem',
      send: 'Enviar para a JFcars',
      sending: 'A enviar…',
      success: 'Obrigado. A equipa da JFcars recebeu a sua mensagem.',
      error: 'Não foi possível enviar a sua mensagem. Tente novamente.',
      response: 'Normalmente respondemos no prazo de um dia útil.',
      whatsapp: 'Falar com a JFcars no WhatsApp',
      whatsappMessage:
        'Olá JFcars, preciso de ajuda com um veículo, uma peça ou uma expedição.',
      regional: 'Apoio regional',
      regionalText:
        'Indique o seu país e cidade para que a equipa certa possa responder.',
      vehicle: 'Questões sobre veículos',
      vehicleText:
        'Inclua a marca, o modelo ou o nome do anúncio, se possível.',
      shipment: 'Atualizações de expedição',
      shipmentText:
        'Inclua a referência da expedição ou do lote, se tiver uma.',
      supportEmail: 'Apoio ao cliente',
      supportEmailText: 'Dúvidas, assistência e acompanhamento',
      salesEmail: 'Vendas e encomendas',
      salesEmailText: 'Veículos, alugueres, peças e orçamentos',
    },
  }[lang];
  const whatsappLink = whatsappHref(
    whatsappNumber || '',
    words.whatsappMessage,
  );

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
            unoptimized
            sizes="(max-width: 820px) 100vw, 48vw"
            priority
            decoding="async"
            alt={
              lang === 'fr'
                ? 'L’équipe JFcars avec un véhicule'
                : lang === 'es'
                  ? 'El equipo de JFcars junto a un vehículo'
                  : lang === 'pt'
                    ? 'Equipa da JFcars junto a um veículo'
                    : 'JFcars team with a vehicle'
            }
          />
        </div>
        <div className="about-story">
          <div>
            <small>{words.parentBrand}</small>
            <h2>{words.storyTitle}</h2>
            <p>{words.story}</p>
            <p>{words.storySecond}</p>
          </div>
          <aside>
            <b>25+</b>
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
        {whatsappLink && (
          <a
            className="contact-whatsapp"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            {words.whatsapp}
          </a>
        )}
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
          <article className="contact-email-card">
            <span>
              <Mail />
            </span>
            <div>
              <h2>{words.supportEmail}</h2>
              <p>{words.supportEmailText}</p>
              <a href={mailtoHref(JFCARS_EMAILS.contact)}>
                {JFCARS_EMAILS.contact}
              </a>
            </div>
          </article>
          <article className="contact-email-card">
            <span>
              <Mail />
            </span>
            <div>
              <h2>{words.salesEmail}</h2>
              <p>{words.salesEmailText}</p>
              <a href={mailtoHref(JFCARS_EMAILS.sales)}>
                {JFCARS_EMAILS.sales}
              </a>
            </div>
          </article>
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
  const section = useMemo(
    () =>
      gallerySections.find((entry) => entry.id === activeSection) ||
      gallerySections[0],
    [activeSection],
  );
  const visibleItems = useMemo(
    () => items.filter((item) => section.statuses.includes(item.status)),
    [items, section],
  );
  const albums = useMemo(
    () =>
      Array.from(
        visibleItems.reduce((groups, item) => {
          const key = item.reference.trim() || item.id;
          const group = groups.get(key) || [];
          group.push(item);
          groups.set(key, group);
          return groups;
        }, new Map<string, GalleryItem[]>()),
      ).map(([reference, photos]) => ({
        reference,
        photos,
        cover: photos[0],
      })),
    [visibleItems],
  );
  const displayedAlbums = albums.slice(0, visibleCount);
  const resultCount =
    activeSection === 'all' ? visibleItems.length : albums.length;
  // Keep the animated cover set bounded. The viewer still exposes every item,
  // but a 500-photo journal should not gradually download all originals while
  // it sits unattended on the page.
  const mosaicRotationItems = visibleItems.slice(0, 24);
  const mosaicItems = Array.from(
    { length: Math.min(5, mosaicRotationItems.length) },
    (_, offset) => {
      const index = (mosaicStart + offset) % mosaicRotationItems.length;
      return { item: mosaicRotationItems[index], index };
    },
  );
  useEffect(() => {
    if (
      activeSection !== 'all' ||
      mosaicRotationItems.length <= 5 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setMosaicStart((start) => (start + 1) % mosaicRotationItems.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [activeSection, mosaicRotationItems.length]);
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
                <GalleryMediaTile
                  item={item}
                  alt={caption(item)}
                  videoLabel={labels.video}
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
                <GalleryMediaTile
                  item={album.cover}
                  alt={caption(album.cover)}
                  videoLabel={labels.video}
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
    ? new Intl.DateTimeFormat(localeFor(lang), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(`${item.date}T12:00:00Z`))
    : '';
  const formatLogisticsDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat(localeFor(lang), {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }).format(new Date(`${value}T12:00:00Z`))
      : '';
  const move = (direction: number) =>
    setActive((active + direction + items.length) % items.length);
  const thumbnailStart = Math.min(
    Math.max(active - 3, 0),
    Math.max(items.length - 7, 0),
  );
  const thumbnailItems = items
    .slice(thumbnailStart, thumbnailStart + 7)
    .map((entry, offset) => ({ entry, index: thumbnailStart + offset }));
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
          {item.mediaType === 'video' ? (
            <video
              key={item.id}
              src={item.image}
              aria-label={caption(item)}
              controls
              muted
              playsInline
              preload="none"
            />
          ) : (
            <Image
              src={item.image}
              alt={caption(item)}
              width={1536}
              height={1024}
              unoptimized
              loading="eager"
              decoding="async"
              sizes="(max-width: 760px) 100vw, 82vw"
            />
          )}
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
          {thumbnailItems.map(({ entry, index }) => (
            <button
              key={entry.id}
              className={active === index ? 'active' : ''}
              onClick={() => setActive(index)}
              aria-label={caption(entry)}
            >
              {entry.mediaType === 'video' ? (
                <span className="gallery-video-thumbnail" aria-hidden="true">
                  <Play />
                </span>
              ) : (
                <Image
                  src={entry.image}
                  alt=""
                  width={240}
                  height={150}
                  unoptimized
                  loading="lazy"
                  decoding="async"
                  sizes="120px"
                />
              )}
            </button>
          ))}
        </div>
      </dialog>
    </div>
  );
}
