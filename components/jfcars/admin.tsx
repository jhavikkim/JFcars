'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CarFront,
  Check,
  Cog,
  Eye,
  EyeOff,
  KeyRound,
  Package,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  galleryItemLimit,
  galleryStatuses,
  type GalleryStatus,
  isSafeImageSource,
  isSafeMediaSource,
} from '@/lib/storefront-content';
import {
  type Lang,
  type Car,
  type PartRequest,
  type SellerInquiry,
  type SellRequest,
  type GalleryItem,
  type StorefrontContent,
  type OrderRecord,
  VEHICLE_SELLING_ENABLED,
  copy,
  galleryCopy,
  type GallerySection,
  gallerySections,
  defaultHeroVideo,
  defaultGalleryItems,
  normalizeGallery,
  cars,
  catalogBrands,
  money,
  carPlace,
  citiesByCountry,
  formValue,
  formImages,
} from '@/components/jfcars/config';
import { useDialog } from '@/components/jfcars/useDialog';
import { BrandLogo } from '@/components/jfcars/marketplace-panels';
export function AdminPanel({
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
      en: {
        headline: storefrontContent.en?.headline || copy.en.hero,
        description: storefrontContent.en?.description || copy.en.sub,
        galleryTitle:
          storefrontContent.en?.galleryTitle || galleryCopy.en.title,
        galleryDescription:
          storefrontContent.en?.galleryDescription ||
          galleryCopy.en.description,
      },
      fr: {
        headline: storefrontContent.fr?.headline || copy.fr.hero,
        description: storefrontContent.fr?.description || copy.fr.sub,
        galleryTitle:
          storefrontContent.fr?.galleryTitle || galleryCopy.fr.title,
        galleryDescription:
          storefrontContent.fr?.galleryDescription ||
          galleryCopy.fr.description,
      },
      es: {
        headline: storefrontContent.es?.headline || copy.es.hero,
        description: storefrontContent.es?.description || copy.es.sub,
        galleryTitle:
          storefrontContent.es?.galleryTitle || galleryCopy.es.title,
        galleryDescription:
          storefrontContent.es?.galleryDescription ||
          galleryCopy.es.description,
      },
      gallery: normalizeGallery(storefrontContent.gallery),
      heroVideo: isSafeMediaSource(storefrontContent.heroVideo)
        ? storefrontContent.heroVideo
        : defaultHeroVideo,
    });
  const [adminGallerySection, setAdminGallerySection] =
    useState<GallerySection>('all');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState('');
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
  const galleryDraft =
    Array.isArray(contentDraft.gallery) && contentDraft.gallery.length
      ? contentDraft.gallery
      : defaultGalleryItems;
  const adminSection =
    gallerySections.find((entry) => entry.id === adminGallerySection) ||
    gallerySections[0];
  const visibleGalleryDraft = galleryDraft
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => adminSection.statuses.includes(item.status));
  const updateGalleryDetails = (index: number, details: Partial<GalleryItem>) =>
    setContentDraft((current) => ({
      ...current,
      gallery: (Array.isArray(current.gallery) && current.gallery.length
        ? current.gallery
        : defaultGalleryItems
      ).map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...details } : item,
      ),
    }));
  const updateGalleryImage = (index: number, image: string) =>
    updateGalleryDetails(index, { image });
  const updateGalleryCaption = (index: number, caption: string) =>
    setContentDraft((current) => ({
      ...current,
      gallery: (Array.isArray(current.gallery) && current.gallery.length
        ? current.gallery
        : defaultGalleryItems
      ).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              captions: { ...item.captions, [contentLocale]: caption },
            }
          : item,
      ),
    }));
  const updateGalleryComment = (index: number, comment: string) =>
    setContentDraft((current) => ({
      ...current,
      gallery: (Array.isArray(current.gallery) && current.gallery.length
        ? current.gallery
        : defaultGalleryItems
      ).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              comments: { ...item.comments, [contentLocale]: comment },
            }
          : item,
      ),
    }));
  const uploadMedia = async (file: File, purpose: 'gallery' | 'hero') => {
    const data = new FormData();
    data.set('file', file);
    data.set('purpose', purpose);
    const response = await fetch('/api/media', { method: 'POST', body: data });
    const result = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !result.url)
      throw new Error(result.error || 'Media upload failed');
    return result.url;
  };
  const replaceGalleryPhoto = async (index: number, file: File) => {
    setGalleryUploading(true);
    setMediaUploadError('');
    try {
      updateGalleryImage(index, await uploadMedia(file, 'gallery'));
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Photo upload failed',
      );
    } finally {
      setGalleryUploading(false);
    }
  };
  const uploadGalleryPhotos = async (files: File[]) => {
    const available = galleryItemLimit - galleryDraft.length;
    const selected = files.slice(0, Math.max(0, available));
    if (!selected.length) return;
    const status =
      adminGallerySection === 'all'
        ? 'ready_to_load'
        : adminSection.statuses[0];
    setGalleryUploading(true);
    setMediaUploadError('');
    try {
      const uploaded: GalleryItem[] = [];
      const batchReference = `JF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      for (const file of selected) {
        const image = await uploadMedia(file, 'gallery');
        const fileTitle = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]+/g, ' ')
          .trim();
        uploaded.push({
          id: `gallery-${crypto.randomUUID()}`,
          image,
          captions: {
            en: fileTitle || 'Shipment photo update',
            fr: fileTitle || 'Mise à jour photo de l’expédition',
            es: fileTitle || 'Actualización fotográfica del envío',
          },
          comments: {
            en: 'Add an operations note for this update.',
            fr: 'Ajoutez une note opérationnelle pour cette mise à jour.',
            es: 'Añade una nota operativa para esta actualización.',
          },
          status,
          date: new Date().toISOString().slice(0, 10),
          location: '',
          reference: batchReference,
        });
      }
      setContentDraft((current) => ({
        ...current,
        gallery: [
          ...(Array.isArray(current.gallery) && current.gallery.length
            ? current.gallery
            : defaultGalleryItems),
          ...uploaded,
        ].slice(0, galleryItemLimit),
      }));
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Photo upload failed',
      );
    } finally {
      setGalleryUploading(false);
    }
  };
  const uploadHeroVideo = async (file: File) => {
    setHeroUploading(true);
    setMediaUploadError('');
    try {
      const heroVideo = await uploadMedia(file, 'hero');
      setContentDraft((current) => ({ ...current, heroVideo }));
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Video upload failed',
      );
    } finally {
      setHeroUploading(false);
    }
  };
  const addGalleryPhoto = () => {
    if (galleryDraft.length >= galleryItemLimit) return;
    const status =
      adminGallerySection === 'all'
        ? 'ready_to_load'
        : adminSection.statuses[0];
    setContentDraft((current) => ({
      ...current,
      gallery: [
        ...(Array.isArray(current.gallery) && current.gallery.length
          ? current.gallery
          : defaultGalleryItems),
        {
          id: `gallery-${Date.now()}`,
          image: '/jfcars-gallery-loading.webp',
          captions: {
            en: 'New gallery photo',
            fr: 'Nouvelle photo de la galerie',
            es: 'Nueva foto de la galería',
          },
          comments: {
            en: 'Add an operations note for this update.',
            fr: 'Ajoutez une note opérationnelle pour cette mise à jour.',
            es: 'Añade una nota operativa para esta actualización.',
          },
          status,
          date: new Date().toISOString().slice(0, 10),
          location: '',
          reference: '',
        },
      ],
    }));
  };
  const removeGalleryPhoto = (index: number) => {
    if (galleryDraft.length <= 1) return;
    setContentDraft((current) => ({
      ...current,
      gallery: (Array.isArray(current.gallery) && current.gallery.length
        ? current.gallery
        : defaultGalleryItems
      ).filter((_, itemIndex) => itemIndex !== index),
    }));
  };
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
            {menu
              .filter(
                ([id]) => VEHICLE_SELLING_ENABLED || id !== 'seller-listings',
              )
              .map(([id, label, Icon]) => (
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
                  ]
                    .filter(
                      ([, target]) =>
                        VEHICLE_SELLING_ENABLED || target !== 'seller-listings',
                    )
                    .map(([x, target], i) => (
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
            {VEHICLE_SELLING_ENABLED && tab === 'seller-listings' && (
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
                          ...contentDraft[contentLocale],
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
                          ...contentDraft[contentLocale],
                          headline:
                            contentDraft[contentLocale]?.headline ||
                            copy[contentLocale].hero,
                          description: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <div className="content-section-title">
                  <div>
                    <h4>Homepage hero video</h4>
                    <p>
                      Upload an MP4 or WebM clip. It plays silently and keeps
                      the current African-market image as its loading fallback.
                    </p>
                  </div>
                  <span>{heroUploading ? 'Uploading…' : 'Video'}</span>
                </div>
                <div className="admin-hero-media">
                  <video
                    src={contentDraft.heroVideo || defaultHeroVideo}
                    poster="/jfcars-central-africa-hero.webp"
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                  />
                  <div>
                    <label className="media-upload-button">
                      <Upload />
                      {heroUploading ? 'Uploading video…' : 'Upload hero video'}
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        disabled={heroUploading}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          if (file) void uploadHeroVideo(file);
                        }}
                      />
                    </label>
                    <label>
                      Or use a hosted video URL
                      <input
                        value={contentDraft.heroVideo || ''}
                        placeholder="https://…/hero.mp4"
                        onChange={(event) => {
                          setContentDraft({
                            ...contentDraft,
                            heroVideo: event.target.value,
                          });
                          setContentSaved(false);
                        }}
                      />
                    </label>
                    <small>
                      Maximum 50 MB. Audio is muted on the homepage.
                    </small>
                  </div>
                </div>
                <div className="content-section-title">
                  <div>
                    <h4>Shipment journal</h4>
                    <p>
                      Upload real loading, departure, transit, arrival and local
                      stock photos. Do not include customer information.
                    </p>
                  </div>
                  <span>
                    {galleryDraft.length} / {galleryItemLimit} photos
                  </span>
                </div>
                <label>
                  Gallery heading
                  <input
                    value={
                      contentDraft[contentLocale]?.galleryTitle ||
                      galleryCopy[contentLocale].title
                    }
                    onChange={(event) =>
                      setContentDraft({
                        ...contentDraft,
                        [contentLocale]: {
                          ...contentDraft[contentLocale],
                          headline:
                            contentDraft[contentLocale]?.headline ||
                            copy[contentLocale].hero,
                          description:
                            contentDraft[contentLocale]?.description ||
                            copy[contentLocale].sub,
                          galleryTitle: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Gallery description
                  <textarea
                    value={
                      contentDraft[contentLocale]?.galleryDescription ||
                      galleryCopy[contentLocale].description
                    }
                    onChange={(event) =>
                      setContentDraft({
                        ...contentDraft,
                        [contentLocale]: {
                          ...contentDraft[contentLocale],
                          headline:
                            contentDraft[contentLocale]?.headline ||
                            copy[contentLocale].hero,
                          description:
                            contentDraft[contentLocale]?.description ||
                            copy[contentLocale].sub,
                          galleryDescription: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <nav
                  className="admin-gallery-tabs"
                  aria-label="Shipment journal category"
                >
                  {gallerySections.map((section) => {
                    const count = galleryDraft.filter((item) =>
                      section.statuses.includes(item.status),
                    ).length;
                    return (
                      <button
                        type="button"
                        key={section.id}
                        aria-pressed={adminGallerySection === section.id}
                        className={
                          adminGallerySection === section.id ? 'active' : ''
                        }
                        onClick={() => setAdminGallerySection(section.id)}
                      >
                        {galleryCopy[contentLocale].sections[section.id]}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </nav>
                <div className="gallery-admin-actions">
                  <label className="media-upload-button">
                    <Upload />
                    {galleryUploading
                      ? 'Uploading photos…'
                      : `Upload photos to ${galleryCopy[contentLocale].sections[adminGallerySection]}`}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      disabled={
                        galleryUploading ||
                        galleryDraft.length >= galleryItemLimit
                      }
                      onChange={(event) => {
                        const files = Array.from(
                          event.currentTarget.files || [],
                        );
                        event.currentTarget.value = '';
                        if (files.length) void uploadGalleryPhotos(files);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="gallery-admin-add"
                    disabled={galleryDraft.length >= galleryItemLimit}
                    onClick={addGalleryPhoto}
                  >
                    <Plus /> Add entry by URL
                  </button>
                </div>
                {mediaUploadError && (
                  <p className="admin-sync-error" role="alert">
                    {mediaUploadError}
                  </p>
                )}
                <div className="gallery-admin-list">
                  {visibleGalleryDraft.map(({ item, index }) => {
                    const imageReady = isSafeImageSource(item.image);
                    return (
                      <article key={item.id}>
                        {imageReady ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={300}
                            height={200}
                            unoptimized
                          />
                        ) : (
                          <span>Photo URL required</span>
                        )}
                        <div>
                          <b>Update {index + 1}</b>
                          <div className="gallery-admin-meta">
                            <label>
                              Shipment stage
                              <select
                                value={item.status}
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    status: event.target.value as GalleryStatus,
                                  })
                                }
                              >
                                {galleryStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {
                                      galleryCopy[contentLocale].statuses[
                                        status
                                      ]
                                    }
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Update date
                              <input
                                type="date"
                                value={item.date}
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    date: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Departure date
                              <input
                                type="date"
                                value={item.departureDate || ''}
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    departureDate: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Estimated arrival (ETA)
                              <input
                                type="date"
                                value={item.eta || ''}
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    eta: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Location
                              <input
                                value={item.location}
                                maxLength={100}
                                placeholder="e.g. Port of Pointe-Noire"
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    location: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label>
                              Shipment / batch reference
                              <input
                                value={item.reference}
                                maxLength={100}
                                placeholder="e.g. JF-SEP-01"
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    reference: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                          <label>
                            Image URL or existing media path
                            <input
                              value={item.image}
                              onChange={(event) =>
                                updateGalleryImage(index, event.target.value)
                              }
                            />
                          </label>
                          <label className="gallery-replace-upload">
                            <Upload /> Replace with an uploaded photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              disabled={galleryUploading}
                              onChange={(event) => {
                                const file = event.currentTarget.files?.[0];
                                event.currentTarget.value = '';
                                if (file) void replaceGalleryPhoto(index, file);
                              }}
                            />
                          </label>
                          <label>
                            {contentLocale.toUpperCase()} photo title
                            <input
                              value={item.captions[contentLocale] || ''}
                              maxLength={140}
                              onChange={(event) =>
                                updateGalleryCaption(index, event.target.value)
                              }
                            />
                          </label>
                          <label>
                            {contentLocale.toUpperCase()} team comment
                            <textarea
                              value={item.comments[contentLocale] || ''}
                              maxLength={600}
                              rows={3}
                              onChange={(event) =>
                                updateGalleryComment(index, event.target.value)
                              }
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove photo ${index + 1}`}
                          disabled={galleryDraft.length <= 1}
                          onClick={() => removeGalleryPhoto(index)}
                        >
                          <Trash2 />
                        </button>
                      </article>
                    );
                  })}
                  {!visibleGalleryDraft.length && (
                    <div className="gallery-admin-empty">
                      <Package />
                      <p>No photos in this category yet.</p>
                    </div>
                  )}
                </div>
                <label>
                  Announcement
                  <input
                    value="Five regional markets · Clear listing details · Direct seller contact"
                    readOnly
                  />
                </label>
                <button
                  disabled={
                    galleryUploading ||
                    heroUploading ||
                    !isSafeMediaSource(contentDraft.heroVideo) ||
                    galleryDraft.some((item) => !isSafeImageSource(item.image))
                  }
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
