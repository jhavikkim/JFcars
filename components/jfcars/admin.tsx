'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
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
  Play,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  defaultStorefrontTheme,
  galleryItemLimit,
  galleryStatuses,
  type GalleryStatus,
  isSafeMediaSource,
  vehicleImageLimit,
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
  defaultHeroImage,
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
import { mailtoHref, normalizeWhatsAppNumber, telHref } from '@/lib/contact';

const galleryUploadConcurrency = 3;
const maximumGalleryFileBytes = 20 * 1024 * 1024;
const maximumHeroFileBytes = 95 * 1024 * 1024;
const adminGalleryPageSize = 24;
const adminInventoryPageSize = 20;

export type AdminPersistenceStatus = 'saved' | 'saving' | 'error';

type UploadProgress = {
  completed: number;
  failed: number;
  percent: number;
  total: number;
};

type UploadedMedia = {
  url: string;
  type: string;
  mediaType: 'image' | 'video';
};

function uploadMedia(
  file: File,
  purpose: 'gallery' | 'hero' | 'hero-image' | 'vehicle',
  onProgress?: (loaded: number, total: number) => void,
) {
  const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';
  const maximumBytes = isVideo ? maximumHeroFileBytes : maximumGalleryFileBytes;
  const allowedTypes =
    purpose === 'hero'
      ? ['video/mp4', 'video/webm']
      : purpose === 'gallery'
        ? [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/avif',
            'video/mp4',
            'video/webm',
          ]
        : ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      purpose === 'hero'
        ? 'Use an MP4 or WebM video up to 95 MB'
        : purpose === 'gallery'
          ? 'Use a JPG, PNG, WebP or AVIF image up to 20 MB, or an MP4 or WebM video up to 95 MB'
          : 'Use a JPG, PNG, WebP or AVIF image up to 20 MB',
    );
  }
  if (!file.size || file.size > maximumBytes) {
    throw new Error(
      purpose === 'hero'
        ? 'Use an MP4 or WebM video up to 95 MB'
        : isVideo
          ? 'Use an MP4 or WebM video up to 95 MB'
          : 'Use a JPG, PNG, WebP or AVIF image up to 20 MB',
    );
  }

  return new Promise<UploadedMedia>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let lastProgressReport = 0;
    request.open('POST', '/api/media');
    request.setRequestHeader('content-type', file.type);
    request.setRequestHeader('x-upload-purpose', purpose);
    request.setRequestHeader('x-upload-name', encodeURIComponent(file.name));
    request.upload.addEventListener('progress', (event) => {
      const now = performance.now();
      if (now - lastProgressReport >= 120 || event.loaded >= file.size) {
        lastProgressReport = now;
        onProgress?.(
          event.loaded,
          event.lengthComputable ? event.total : file.size,
        );
      }
    });
    request.addEventListener('load', () => {
      let result: {
        error?: string;
        mediaType?: 'image' | 'video';
        type?: string;
        url?: string;
      } | null = null;
      try {
        result = JSON.parse(request.responseText) as {
          error?: string;
          mediaType?: 'image' | 'video';
          type?: string;
          url?: string;
        };
      } catch {
        result = null;
      }
      if (request.status >= 200 && request.status < 300 && result?.url) {
        onProgress?.(file.size, file.size);
        resolve({
          url: result.url,
          type: result.type || file.type,
          mediaType:
            result.mediaType ||
            (file.type.startsWith('video/') ? 'video' : 'image'),
        });
      } else {
        reject(new Error(result?.error || 'Media upload failed'));
      }
    });
    request.addEventListener('error', () =>
      reject(new Error('The upload connection was interrupted')),
    );
    request.addEventListener('abort', () =>
      reject(new Error('The upload was cancelled')),
    );
    request.send(file);
  });
}

function VehicleMediaEditor({
  images,
  setImages,
  uploading,
  progress,
  error,
  onFiles,
}: {
  images: string[];
  setImages: (images: string[]) => void;
  uploading: boolean;
  progress: UploadProgress | null;
  error: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <section className="vehicle-media-editor">
      <div>
        <b>Vehicle photo gallery</b>
        <small>
          Upload up to {vehicleImageLimit} JPG, PNG, WebP or AVIF photos (20 MB
          each). WebP at 2560 px or less is recommended. The first photo is used
          as the listing cover.
        </small>
      </div>
      <label className="media-upload-button">
        <Upload />
        {uploading ? 'Uploading vehicle photos…' : 'Upload vehicle photos'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={uploading || images.length >= vehicleImageLimit}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            event.currentTarget.value = '';
            if (files.length) onFiles(files);
          }}
        />
      </label>
      {progress && (
        <output className="media-upload-progress">
          <progress max="100" value={progress.percent} />
          <span>
            {progress.completed} / {progress.total} processed ·{' '}
            {progress.percent}%
            {progress.failed ? ` · ${progress.failed} failed` : ''}
          </span>
        </output>
      )}
      {error && (
        <p className="admin-sync-error" role="alert">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <div className="vehicle-media-previews">
          {images.slice(0, 12).map((image, index) => (
            <figure key={`${image}-${index}`}>
              <Image
                src={image}
                alt=""
                width={180}
                height={120}
                unoptimized={image.startsWith('http')}
                loading="lazy"
                decoding="async"
                sizes="90px"
              />
              <figcaption>{index === 0 ? 'Cover' : index + 1}</figcaption>
              <button
                type="button"
                aria-label={`Remove vehicle photo ${index + 1}`}
                onClick={() =>
                  setImages(
                    images.filter((_, imageIndex) => imageIndex !== index),
                  )
                }
              >
                <X />
              </button>
            </figure>
          ))}
          {images.length > 12 && <span>+{images.length - 12} more</span>}
        </div>
      )}
    </section>
  );
}

function ThemeColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="theme-color-control">
      <span>{label}</span>
      <span>
        <input
          type="color"
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
        />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  );
}

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
  onMarketplaceRevision,
  persistenceStatus,
  persistenceError,
  persistenceConflict,
  reloadMarketplace,
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
  onMarketplaceRevision: (revision: number) => void;
  persistenceStatus: AdminPersistenceStatus;
  persistenceError: boolean;
  persistenceConflict: boolean;
  reloadMarketplace: () => void;
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
      pt: {
        headline: storefrontContent.pt?.headline || copy.pt.hero,
        description: storefrontContent.pt?.description || copy.pt.sub,
        galleryTitle:
          storefrontContent.pt?.galleryTitle || galleryCopy.pt.title,
        galleryDescription:
          storefrontContent.pt?.galleryDescription ||
          galleryCopy.pt.description,
      },
      gallery: normalizeGallery(storefrontContent.gallery),
      heroVideo: isSafeMediaSource(storefrontContent.heroVideo)
        ? storefrontContent.heroVideo
        : defaultHeroVideo,
      heroImage: isSafeMediaSource(storefrontContent.heroImage)
        ? storefrontContent.heroImage
        : defaultHeroImage,
      whatsappNumber: storefrontContent.whatsappNumber || '',
      theme: {
        ...defaultStorefrontTheme,
        ...storefrontContent.theme,
      },
    });
  const [addVehicleImages, setAddVehicleImages] = useState<string[]>([]);
  const [editVehicleImages, setEditVehicleImages] = useState<string[]>([]);
  const [vehicleUploading, setVehicleUploading] = useState(false);
  const [vehicleUploadProgress, setVehicleUploadProgress] =
    useState<UploadProgress | null>(null);
  const [vehicleUploadError, setVehicleUploadError] = useState('');
  const [adminGallerySection, setAdminGallerySection] =
    useState<GallerySection>('all');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] =
    useState<UploadProgress | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState(0);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroImageUploadProgress, setHeroImageUploadProgress] = useState(0);
  const [adminGalleryVisibleCount, setAdminGalleryVisibleCount] =
    useState(adminGalleryPageSize);
  const [mediaUploadError, setMediaUploadError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Car | null>(null);
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [inventorySource, setInventorySource] = useState<
    'all' | 'local' | 'abroad'
  >('all');
  const [inventoryVisibility, setInventoryVisibility] = useState<
    'all' | 'live' | 'hidden'
  >('all');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [adminAddOrigin, setAdminAddOrigin] = useState<'local' | 'abroad'>(
    'local',
  );
  const [adminEditOrigin, setAdminEditOrigin] = useState<'local' | 'abroad'>(
    'local',
  );
  const [adminAddCountry, setAdminAddCountry] = useState(
    'Republic of the Congo',
  );
  const [adminEditCountry, setAdminEditCountry] = useState(
    'Republic of the Congo',
  );
  const filteredInventory = useMemo(() => {
    const normalizedQuery = inventoryQuery.trim().toLowerCase();
    return inventory.filter((car) => {
      const source = car.origin || 'local';
      const location =
        source === 'abroad'
          ? car.importRegion || car.location
          : [car.country, car.city || car.location].filter(Boolean).join(' ');
      return (
        (!normalizedQuery ||
          `${car.make} ${car.model} ${car.year} ${car.body} ${car.fuel} ${location}`
            .toLowerCase()
            .includes(normalizedQuery)) &&
        (inventorySource === 'all' || source === inventorySource) &&
        (inventoryVisibility === 'all' ||
          (inventoryVisibility === 'hidden' ? car.hidden : !car.hidden))
      );
    });
  }, [inventory, inventoryQuery, inventorySource, inventoryVisibility]);
  const inventoryPageCount = Math.max(
    1,
    Math.ceil(filteredInventory.length / adminInventoryPageSize),
  );
  const safeInventoryPage = Math.min(inventoryPage, inventoryPageCount);
  const pagedInventory = filteredInventory.slice(
    (safeInventoryPage - 1) * adminInventoryPageSize,
    safeInventoryPage * adminInventoryPageSize,
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
  const themeDraft = {
    ...defaultStorefrontTheme,
    ...contentDraft.theme,
  };
  const updateThemeColor = (
    key: keyof typeof defaultStorefrontTheme,
    value: string,
  ) => {
    setContentDraft((current) => ({
      ...current,
      theme: {
        ...defaultStorefrontTheme,
        ...current.theme,
        [key]: value,
      },
    }));
    setContentSaved(false);
  };
  const galleryVideoCount = galleryDraft.filter(
    (item) => item.mediaType === 'video',
  ).length;
  const galleryImageCount = galleryDraft.length - galleryVideoCount;
  const adminSection =
    gallerySections.find((entry) => entry.id === adminGallerySection) ||
    gallerySections[0];
  const visibleGalleryDraft = galleryDraft
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => adminSection.statuses.includes(item.status))
    .reverse();
  const renderedGalleryDraft = visibleGalleryDraft.slice(
    0,
    adminGalleryVisibleCount,
  );
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
  const replaceGalleryMedia = async (index: number, file: File) => {
    setGalleryUploading(true);
    setGalleryUploadProgress({ completed: 0, failed: 0, percent: 0, total: 1 });
    setMediaUploadError('');
    try {
      const media = await uploadMedia(file, 'gallery', (loaded, total) =>
        setGalleryUploadProgress({
          completed: loaded >= total ? 1 : 0,
          failed: 0,
          percent: total ? Math.round((loaded / total) * 100) : 0,
          total: 1,
        }),
      );
      updateGalleryDetails(index, {
        image: media.url,
        mediaType: media.mediaType,
      });
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Media upload failed',
      );
    } finally {
      setGalleryUploading(false);
      setGalleryUploadProgress(null);
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
    setGalleryUploadProgress({
      completed: 0,
      failed: 0,
      percent: 0,
      total: selected.length,
    });
    setMediaUploadError('');
    const uploaded: GalleryItem[] = [];
    const errors: string[] = [];
    const progressByFile = new Map<number, number>();
    let completed = 0;
    const batchReference = `JF-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const updateProgress = () => {
      const loadedBytes = Array.from(progressByFile.values()).reduce(
        (total, bytes) => total + bytes,
        0,
      );
      const totalBytes = selected.reduce((total, file) => total + file.size, 0);
      setGalleryUploadProgress({
        completed,
        failed: errors.length,
        percent: totalBytes
          ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
          : 0,
        total: selected.length,
      });
    };
    let nextFile = 0;
    const worker = async () => {
      while (nextFile < selected.length) {
        const index = nextFile++;
        const file = selected[index];
        try {
          const media = await uploadMedia(file, 'gallery', (loaded) => {
            progressByFile.set(index, Math.min(loaded, file.size));
            updateProgress();
          });
          const fileTitle = file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .trim();
          uploaded[index] = {
            id: `gallery-${crypto.randomUUID()}`,
            image: media.url,
            mediaType: media.mediaType,
            captions: {
              en: fileTitle || 'Shipment photo update',
              fr: fileTitle || 'Mise à jour photo de l’expédition',
              es: fileTitle || 'Actualización fotográfica del envío',
              pt: fileTitle || 'Actualização fotográfica do envio',
            },
            comments: {
              en: 'Add an operations note for this update.',
              fr: 'Ajoutez une note opérationnelle pour cette mise à jour.',
              es: 'Añade una nota operativa para esta actualización.',
              pt: 'Adicione uma nota operacional para esta actualização.',
            },
            status,
            date: new Date().toISOString().slice(0, 10),
            location: '',
            reference: batchReference,
          };
        } catch (error) {
          errors.push(
            `${file.name}: ${error instanceof Error ? error.message : 'upload failed'}`,
          );
        } finally {
          progressByFile.set(index, file.size);
          completed += 1;
          updateProgress();
        }
      }
    };
    try {
      await Promise.all(
        Array.from(
          { length: Math.min(galleryUploadConcurrency, selected.length) },
          () => worker(),
        ),
      );
      const successfulUploads = uploaded.filter(Boolean);
      if (successfulUploads.length) {
        setContentDraft((current) => ({
          ...current,
          gallery: [
            ...(Array.isArray(current.gallery) && current.gallery.length
              ? current.gallery
              : defaultGalleryItems),
            ...successfulUploads,
          ].slice(0, galleryItemLimit),
        }));
        setContentSaved(false);
      }
      const skipped = files.length - selected.length;
      if (errors.length || skipped > 0) {
        const failureSummary = errors.slice(0, 3).join(' · ');
        setMediaUploadError(
          [
            errors.length
              ? `${errors.length} of ${selected.length} uploads failed. ${failureSummary}`
              : '',
            skipped > 0
              ? `${skipped} file${skipped === 1 ? ' was' : 's were'} skipped because the gallery is full.`
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        );
      }
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Media upload failed',
      );
    } finally {
      setGalleryUploading(false);
      setGalleryUploadProgress(null);
    }
  };
  const uploadHeroVideo = async (file: File) => {
    setHeroUploading(true);
    setHeroUploadProgress(0);
    setMediaUploadError('');
    try {
      const heroVideo = await uploadMedia(file, 'hero', (loaded, total) =>
        setHeroUploadProgress(
          total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
        ),
      );
      setContentDraft((current) => ({
        ...current,
        heroVideo: heroVideo.url,
      }));
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Video upload failed',
      );
    } finally {
      setHeroUploading(false);
      setHeroUploadProgress(0);
    }
  };
  const uploadHeroImage = async (file: File) => {
    setHeroImageUploading(true);
    setHeroImageUploadProgress(0);
    setMediaUploadError('');
    try {
      const heroImage = await uploadMedia(file, 'hero-image', (loaded, total) =>
        setHeroImageUploadProgress(
          total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
        ),
      );
      setContentDraft((current) => ({
        ...current,
        heroImage: heroImage.url,
      }));
      setContentSaved(false);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : 'Image upload failed',
      );
    } finally {
      setHeroImageUploading(false);
      setHeroImageUploadProgress(0);
    }
  };
  const uploadVehiclePhotos = async (files: File[], target: 'add' | 'edit') => {
    const currentImages =
      target === 'add' ? addVehicleImages : editVehicleImages;
    const selected = files.slice(
      0,
      Math.max(0, vehicleImageLimit - currentImages.length),
    );
    if (!selected.length) return;
    setVehicleUploading(true);
    setVehicleUploadError('');
    setVehicleUploadProgress({
      completed: 0,
      failed: 0,
      percent: 0,
      total: selected.length,
    });
    const uploaded: string[] = [];
    const errors: string[] = [];
    const progressByFile = new Map<number, number>();
    let completed = 0;
    let nextFile = 0;
    const updateProgress = () => {
      const loadedBytes = Array.from(progressByFile.values()).reduce(
        (total, bytes) => total + bytes,
        0,
      );
      const totalBytes = selected.reduce((total, file) => total + file.size, 0);
      setVehicleUploadProgress({
        completed,
        failed: errors.length,
        percent: totalBytes
          ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
          : 0,
        total: selected.length,
      });
    };
    const worker = async () => {
      while (nextFile < selected.length) {
        const index = nextFile++;
        const file = selected[index];
        try {
          uploaded[index] = (
            await uploadMedia(file, 'vehicle', (loaded) => {
              progressByFile.set(index, Math.min(loaded, file.size));
              updateProgress();
            })
          ).url;
        } catch (error) {
          errors.push(
            `${file.name}: ${error instanceof Error ? error.message : 'upload failed'}`,
          );
        } finally {
          progressByFile.set(index, file.size);
          completed += 1;
          updateProgress();
        }
      }
    };
    try {
      await Promise.all(
        Array.from(
          { length: Math.min(galleryUploadConcurrency, selected.length) },
          () => worker(),
        ),
      );
      const successfulUploads = uploaded.filter(Boolean);
      if (successfulUploads.length) {
        const update = (current: string[]) =>
          Array.from(new Set([...current, ...successfulUploads])).slice(
            0,
            vehicleImageLimit,
          );
        if (target === 'add') setAddVehicleImages(update);
        else setEditVehicleImages(update);
      }
      const skipped = files.length - selected.length;
      if (errors.length || skipped > 0) {
        setVehicleUploadError(
          [
            errors.length
              ? `${errors.length} of ${selected.length} uploads failed. ${errors.slice(0, 3).join(' · ')}`
              : '',
            skipped > 0
              ? `${skipped} file${skipped === 1 ? ' was' : 's were'} skipped (maximum ${vehicleImageLimit} photos).`
              : '',
          ]
            .filter(Boolean)
            .join(' '),
        );
      }
    } finally {
      setVehicleUploading(false);
      setVehicleUploadProgress(null);
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
          mediaType: 'image',
          captions: {
            en: 'New gallery photo',
            fr: 'Nouvelle photo de la galerie',
            es: 'Nueva foto de la galería',
            pt: 'Nova fotografia da galeria',
          },
          comments: {
            en: 'Add an operations note for this update.',
            fr: 'Ajoutez une note opérationnelle pour cette mise à jour.',
            es: 'Añade una nota operativa para esta actualización.',
            pt: 'Adicione uma nota operacional para esta actualização.',
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
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'order-status', id, status }),
      });
      if (!response.ok) throw new Error('Order status update failed');
      setOrders(
        orders.map((order) => (order.id === id ? { ...order, status } : order)),
      );
      setActionError('');
    } catch {
      setActionError(
        'The order status could not be saved. Check the connection and try again.',
      );
    }
  };
  const updatePartStatus = async (
    id: string,
    status: PartRequest['status'],
  ) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'part-status', id, status }),
      });
      if (!response.ok) throw new Error('Part request status update failed');
      setPartRequests(
        partRequests.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );
      setActionError('');
    } catch {
      setActionError(
        'The part request could not be saved. Check the connection and try again.',
      );
    }
  };
  const archivePart = async (id: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'part-archive', id }),
      });
      if (!response.ok) throw new Error('Part request archive failed');
      setPartRequests(partRequests.filter((item) => item.id !== id));
      setActionError('');
    } catch {
      setActionError(
        'The part request could not be archived. Check the connection and try again.',
      );
    }
  };
  const archiveInquiry = async (id: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'inquiry-archive', id }),
      });
      if (!response.ok) throw new Error('Inquiry archive failed');
      setSellerInquiries(sellerInquiries.filter((item) => item.id !== id));
      setActionError('');
    } catch {
      setActionError(
        'The enquiry could not be archived. Check the connection and try again.',
      );
    }
  };
  const reviewSellRequest = async (
    request: SellRequest,
    action: 'sell-accept' | 'sell-reject',
  ) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, id: request.id }),
      });
      if (!response.ok) {
        setReviewError(
          response.status === 409
            ? 'Marketplace data changed while this request was being reviewed. Reload the latest data before trying again.'
            : 'This seller request could not be updated. Reload the latest data and try again.',
        );
        return;
      }
      if (action === 'sell-accept') {
        const result = (await response.json()) as {
          car: Car;
          revision: number;
        };
        if (Number.isInteger(result.revision))
          onMarketplaceRevision(result.revision);
        setInventory([
          result.car,
          ...inventory.filter((car) => car.id !== result.car.id),
        ]);
      }
      setReviewError('');
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
    } catch {
      setReviewError(
        'This seller request could not be updated. Check the connection and try again.',
      );
    }
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
        badge: formValue(d, 'badge', 'New listing'),
      },
    ]);
    setAddVehicleImages([]);
    setVehicleUploadError('');
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
    ['customers', 'Customer enquiries', User],
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
            <output
              className={`admin-persistence-status ${persistenceStatus}`}
              aria-live="polite"
            >
              {persistenceStatus === 'saving' ? (
                <>Saving to database…</>
              ) : persistenceStatus === 'error' ? (
                <>Save failed</>
              ) : (
                <>
                  <Check /> Saved to database
                </>
              )}
            </output>
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
                <span>
                  {persistenceConflict
                    ? 'Another administrator updated the marketplace. Reload the latest data before editing again.'
                    : 'This change was not saved. Check the listing location, rental rate and connection, then try again.'}
                </span>
                {persistenceConflict && (
                  <button type="button" onClick={reloadMarketplace}>
                    Reload latest data
                  </button>
                )}
              </div>
            )}
            {reviewError && (
              <div className="admin-sync-error" role="alert">
                <span>{reviewError}</span>
                <button type="button" onClick={reloadMarketplace}>
                  Reload latest data
                </button>
              </div>
            )}
            {actionError && (
              <div className="admin-sync-error" role="alert">
                <span>{actionError}</span>
                <button type="button" onClick={() => setActionError('')}>
                  Dismiss
                </button>
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
                    <p>
                      Edit canonical XAF pricing, availability and listing
                      details.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddVehicleImages([]);
                      setVehicleUploadError('');
                      setAdminAddOrigin('local');
                      setAdding(true);
                    }}
                  >
                    <Plus />
                    Add vehicle
                  </button>
                </div>
                <div className="admin-inventory-filters">
                  <label>
                    <span>Search inventory</span>
                    <input
                      type="search"
                      value={inventoryQuery}
                      placeholder="Make, model, location, fuel…"
                      onChange={(event) => {
                        setInventoryQuery(event.target.value);
                        setInventoryPage(1);
                      }}
                    />
                  </label>
                  <label>
                    <span>Stock source</span>
                    <select
                      value={inventorySource}
                      onChange={(event) => {
                        setInventorySource(
                          event.target.value as 'all' | 'local' | 'abroad',
                        );
                        setInventoryPage(1);
                      }}
                    >
                      <option value="all">All sources</option>
                      <option value="local">Local stock</option>
                      <option value="abroad">Abroad stock</option>
                    </select>
                  </label>
                  <label>
                    <span>Storefront status</span>
                    <select
                      value={inventoryVisibility}
                      onChange={(event) => {
                        setInventoryVisibility(
                          event.target.value as 'all' | 'live' | 'hidden',
                        );
                        setInventoryPage(1);
                      }}
                    >
                      <option value="all">All statuses</option>
                      <option value="live">Live</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>
                  <b>
                    {filteredInventory.length} of {inventory.length} vehicles
                  </b>
                </div>
                <div className="admin-table">
                  <div className="admin-row head">
                    <span>Vehicle</span>
                    <span>Category</span>
                    <span>Price (XAF)</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {pagedInventory.map((c) => (
                    <div className="admin-row" key={c.id}>
                      <span className="vehicle-cell">
                        <Image
                          src={c.image}
                          alt=""
                          width={160}
                          height={100}
                          unoptimized={c.image.startsWith('http')}
                          loading="lazy"
                          decoding="async"
                          sizes="80px"
                        />
                        <b>
                          {c.make} {c.model}
                        </b>
                        <small>#{String(c.id).slice(-4)}</small>
                      </span>
                      <span>
                        <b>
                          {c.body} · {c.fuel}
                        </b>
                        <small className="admin-stock-location">
                          {(c.origin || 'local') === 'abroad'
                            ? `Abroad · ${c.importRegion || c.location}`
                            : `Local · ${[c.city || c.location, c.country]
                                .filter(Boolean)
                                .join(', ')}`}
                        </small>
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
                        <small className="admin-stock-location">
                          {c.available === false ? 'Unavailable' : 'In stock'}
                          {c.rentable ? ' · Rental' : ''}
                        </small>
                      </span>
                      <span className="row-actions">
                        <button
                          title="Edit listing"
                          onClick={() => {
                            setAdminEditCountry(
                              c.country || 'Republic of the Congo',
                            );
                            setEditVehicleImages(
                              Array.from(
                                new Set(
                                  [c.image, ...(c.images || [])].filter(
                                    Boolean,
                                  ),
                                ),
                              ),
                            );
                            setVehicleUploadError('');
                            setAdminEditOrigin(c.origin || 'local');
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
                          onClick={() => setPendingDelete(c)}
                        >
                          <Trash2 />
                        </button>
                      </span>
                    </div>
                  ))}
                  {!pagedInventory.length && (
                    <p className="admin-empty-state">
                      No vehicles match these inventory filters.
                    </p>
                  )}
                </div>
                {inventoryPageCount > 1 && (
                  <nav
                    className="admin-pagination"
                    aria-label="Inventory pages"
                  >
                    <button
                      type="button"
                      disabled={safeInventoryPage === 1}
                      onClick={() => setInventoryPage(safeInventoryPage - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {safeInventoryPage} of {inventoryPageCount}
                    </span>
                    <button
                      type="button"
                      disabled={safeInventoryPage === inventoryPageCount}
                      onClick={() => setInventoryPage(safeInventoryPage + 1)}
                    >
                      Next
                    </button>
                  </nav>
                )}
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
                      <div className="part-request-summary">
                        <b>
                          {request.vehicle} · {request.part} ·{' '}
                          {request.delivery}
                        </b>
                        <small>
                          {request.contactName || 'Customer'}
                          {request.contactEmail && (
                            <a href={mailtoHref(request.contactEmail)}>
                              {request.contactEmail}
                            </a>
                          )}
                          {request.contactPhone && (
                            <a href={telHref(request.contactPhone)}>
                              {request.contactPhone}
                            </a>
                          )}
                        </small>
                        {request.details && <small>{request.details}</small>}
                      </div>
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
                        unoptimized={request.car.image.startsWith('http')}
                        loading="lazy"
                        decoding="async"
                        sizes="80px"
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
                <label>
                  Business WhatsApp number
                  <input
                    type="tel"
                    value={contentDraft.whatsappNumber || ''}
                    placeholder="+244 912 345 678"
                    autoComplete="tel"
                    onChange={(event) => {
                      setContentSaved(false);
                      setContentDraft({
                        ...contentDraft,
                        whatsappNumber: event.target.value,
                      });
                    }}
                  />
                  <small>
                    Use the international country code. Leave this blank to hide
                    WhatsApp buttons from the public site.
                  </small>
                  {Boolean(contentDraft.whatsappNumber) &&
                    !normalizeWhatsAppNumber(
                      contentDraft.whatsappNumber || '',
                    ) && (
                      <span className="form-notice error">
                        Enter a valid international phone number.
                      </span>
                    )}
                </label>
                <div
                  className="content-language-tabs"
                  aria-label="Content language"
                >
                  {(['en', 'fr', 'es', 'pt'] as Lang[]).map((locale) => (
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
                    <h4>Theme &amp; appearance</h4>
                    <p>
                      These colors and hero media are applied to every visitor
                      after you save. Use the preview to check contrast before
                      publishing a change.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="theme-reset-button"
                    onClick={() => {
                      setContentDraft((current) => ({
                        ...current,
                        theme: { ...defaultStorefrontTheme },
                      }));
                      setContentSaved(false);
                    }}
                  >
                    Reset colors
                  </button>
                </div>
                <section
                  className="theme-live-preview"
                  aria-label="Theme preview"
                >
                  <header style={{ background: themeDraft.headerBackground }}>
                    <b style={{ color: themeDraft.primaryColor }}>
                      <i style={{ color: themeDraft.accentColor }}>JF</i>cars.
                    </b>
                    <span style={{ color: themeDraft.textColor }}>
                      Buy · Rent · Parts
                    </span>
                  </header>
                  <div style={{ background: themeDraft.heroBackground }}>
                    <span>
                      <small style={{ color: themeDraft.accentColor }}>
                        CENTRAL AFRICA’S CAR MARKET
                      </small>
                      <strong style={{ color: themeDraft.primaryColor }}>
                        {contentDraft[contentLocale]?.headline ||
                          copy[contentLocale].hero}
                      </strong>
                      <button
                        type="button"
                        tabIndex={-1}
                        style={{ background: themeDraft.buttonColor }}
                      >
                        Search cars
                      </button>
                    </span>
                    <Image
                      src={
                        isSafeMediaSource(contentDraft.heroImage)
                          ? contentDraft.heroImage
                          : defaultHeroImage
                      }
                      alt="Hero poster preview"
                      width={360}
                      height={220}
                      unoptimized={Boolean(
                        contentDraft.heroImage?.startsWith('http'),
                      )}
                      sizes="240px"
                    />
                  </div>
                  <footer
                    style={{ background: themeDraft.brandSearchBackground }}
                  >
                    <b style={{ color: themeDraft.textColor }}>Browse makes</b>
                    <span style={{ color: themeDraft.primaryColor }}>
                      Toyota · BMW · Mercedes · Audi
                    </span>
                  </footer>
                </section>
                <div className="theme-color-grid">
                  <ThemeColorControl
                    label="Hero background"
                    value={themeDraft.heroBackground}
                    onChange={(value) =>
                      updateThemeColor('heroBackground', value)
                    }
                  />
                  <ThemeColorControl
                    label="Brand-search background"
                    value={themeDraft.brandSearchBackground}
                    onChange={(value) =>
                      updateThemeColor('brandSearchBackground', value)
                    }
                  />
                  <ThemeColorControl
                    label="Primary brand color"
                    value={themeDraft.primaryColor}
                    onChange={(value) =>
                      updateThemeColor('primaryColor', value)
                    }
                  />
                  <ThemeColorControl
                    label="Accent color"
                    value={themeDraft.accentColor}
                    onChange={(value) => updateThemeColor('accentColor', value)}
                  />
                  <ThemeColorControl
                    label="Header background"
                    value={themeDraft.headerBackground}
                    onChange={(value) =>
                      updateThemeColor('headerBackground', value)
                    }
                  />
                  <ThemeColorControl
                    label="Buttons and active tabs"
                    value={themeDraft.buttonColor}
                    onChange={(value) => updateThemeColor('buttonColor', value)}
                  />
                  <ThemeColorControl
                    label="Main text color"
                    value={themeDraft.textColor}
                    onChange={(value) => updateThemeColor('textColor', value)}
                  />
                </div>
                <div className="content-section-title">
                  <div>
                    <h4>Homepage hero poster</h4>
                    <p>
                      This image appears while the video loads and whenever a
                      visitor pauses it. Upload a landscape JPG, PNG, WebP or
                      AVIF image.
                    </p>
                  </div>
                  <span>{heroImageUploading ? 'Uploading…' : 'Image'}</span>
                </div>
                <div className="admin-hero-media admin-hero-image">
                  <Image
                    src={
                      isSafeMediaSource(contentDraft.heroImage)
                        ? contentDraft.heroImage
                        : defaultHeroImage
                    }
                    alt="Current homepage hero poster"
                    width={640}
                    height={420}
                    unoptimized={Boolean(
                      contentDraft.heroImage?.startsWith('http'),
                    )}
                    sizes="320px"
                  />
                  <div>
                    <label className="media-upload-button">
                      <Upload />
                      {heroImageUploading
                        ? `Uploading image… ${heroImageUploadProgress}%`
                        : 'Upload hero image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={heroImageUploading}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          if (file) void uploadHeroImage(file);
                        }}
                      />
                    </label>
                    <label>
                      Or use a hosted image URL
                      <input
                        value={contentDraft.heroImage || ''}
                        placeholder="https://…/hero.webp"
                        onChange={(event) => {
                          setContentDraft({
                            ...contentDraft,
                            heroImage: event.target.value,
                          });
                          setContentSaved(false);
                        }}
                      />
                    </label>
                    <small>Maximum 20 MB. WebP is recommended.</small>
                  </div>
                </div>
                {heroImageUploading && (
                  <output className="media-upload-progress">
                    <progress max="100" value={heroImageUploadProgress} />
                    <span>{heroImageUploadProgress}%</span>
                  </output>
                )}
                <div className="content-section-title">
                  <div>
                    <h4>Homepage hero video</h4>
                    <p>
                      Upload an MP4 or WebM clip. It plays silently and keeps
                      the current African-market image as its loading fallback.
                      A web-ready 1080p export is recommended.
                    </p>
                  </div>
                  <span>{heroUploading ? 'Uploading…' : 'Video'}</span>
                </div>
                <div className="admin-hero-media">
                  <video
                    src={contentDraft.heroVideo || defaultHeroVideo}
                    poster={contentDraft.heroImage || defaultHeroImage}
                    muted
                    loop
                    playsInline
                    controls
                    preload="none"
                  />
                  <div>
                    <label className="media-upload-button">
                      <Upload />
                      {heroUploading
                        ? `Uploading video… ${heroUploadProgress}%`
                        : 'Upload hero video'}
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
                      Maximum 95 MB. Audio is muted on the homepage.
                    </small>
                  </div>
                </div>
                {heroUploading && (
                  <output className="media-upload-progress">
                    <progress max="100" value={heroUploadProgress} />
                    <span>{heroUploadProgress}%</span>
                  </output>
                )}
                <div className="content-section-title">
                  <div>
                    <h4>Shipment journal</h4>
                    <p>
                      Upload real loading, departure, transit, arrival and local
                      stock photos or short videos. For the fastest pages, use
                      WebP photos at 2560 px or less and web-ready MP4 or WebM
                      clips. Do not include customer information.
                    </p>
                  </div>
                  <span>
                    {galleryImageCount} photos · {galleryVideoCount} videos ·{' '}
                    {galleryDraft.length} / {galleryItemLimit} entries
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
                        onClick={() => {
                          setAdminGallerySection(section.id);
                          setAdminGalleryVisibleCount(adminGalleryPageSize);
                        }}
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
                      ? 'Uploading media…'
                      : `Upload photos or videos to ${galleryCopy[contentLocale].sections[adminGallerySection]}`}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
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
                {galleryUploadProgress && (
                  <output className="media-upload-progress">
                    <progress max="100" value={galleryUploadProgress.percent} />
                    <span>
                      {galleryUploadProgress.completed} /{' '}
                      {galleryUploadProgress.total} processed ·{' '}
                      {galleryUploadProgress.percent}%
                      {galleryUploadProgress.failed
                        ? ` · ${galleryUploadProgress.failed} failed`
                        : ''}
                    </span>
                  </output>
                )}
                <div className="gallery-admin-list">
                  {renderedGalleryDraft.map(({ item, index }) => {
                    const mediaReady = isSafeMediaSource(item.image);
                    const mediaType = item.mediaType || 'image';
                    return (
                      <article key={item.id}>
                        {mediaReady && mediaType === 'image' ? (
                          <Image
                            src={item.image}
                            alt=""
                            width={300}
                            height={200}
                            unoptimized={item.image.startsWith('http')}
                            loading="lazy"
                            decoding="async"
                            sizes="130px"
                          />
                        ) : mediaReady ? (
                          <span className="gallery-admin-video-tile">
                            <Play /> Video
                          </span>
                        ) : (
                          <span>Media URL required</span>
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
                              Media type
                              <select
                                value={mediaType}
                                onChange={(event) =>
                                  updateGalleryDetails(index, {
                                    mediaType: event.target.value as
                                      | 'image'
                                      | 'video',
                                  })
                                }
                              >
                                <option value="image">Photo</option>
                                <option value="video">Video</option>
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
                            Photo/video URL or existing media path
                            <input
                              value={item.image}
                              onChange={(event) =>
                                updateGalleryImage(index, event.target.value)
                              }
                            />
                          </label>
                          <label className="gallery-replace-upload">
                            <Upload /> Replace with uploaded media
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                              disabled={galleryUploading}
                              onChange={(event) => {
                                const file = event.currentTarget.files?.[0];
                                event.currentTarget.value = '';
                                if (file) void replaceGalleryMedia(index, file);
                              }}
                            />
                          </label>
                          <label>
                            {contentLocale.toUpperCase()} media title
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
                          aria-label={`Remove media ${index + 1}`}
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
                      <p>No media in this category yet.</p>
                    </div>
                  )}
                </div>
                {visibleGalleryDraft.length > adminGalleryVisibleCount && (
                  <button
                    type="button"
                    className="gallery-admin-load-more"
                    onClick={() =>
                      setAdminGalleryVisibleCount(
                        (count) => count + adminGalleryPageSize,
                      )
                    }
                  >
                    Load{' '}
                    {Math.min(
                      adminGalleryPageSize,
                      visibleGalleryDraft.length - adminGalleryVisibleCount,
                    )}{' '}
                    more
                  </button>
                )}
                <button
                  disabled={
                    galleryUploading ||
                    heroUploading ||
                    heroImageUploading ||
                    !isSafeMediaSource(contentDraft.heroVideo) ||
                    (Boolean(contentDraft.heroImage) &&
                      !isSafeMediaSource(contentDraft.heroImage)) ||
                    (Boolean(contentDraft.whatsappNumber) &&
                      !normalizeWhatsAppNumber(
                        contentDraft.whatsappNumber || '',
                      )) ||
                    galleryDraft.some((item) => !isSafeMediaSource(item.image))
                  }
                  onClick={() => {
                    setStorefrontContent(contentDraft);
                    setContentSaved(true);
                  }}
                >
                  Save storefront changes
                </button>
                {contentSaved && (
                  <p
                    className={`form-notice ${persistenceStatus === 'error' ? 'error' : ''}`}
                  >
                    {persistenceStatus === 'saved' ? <Check /> : null}
                    {persistenceStatus === 'saving'
                      ? 'Saving storefront changes to the database…'
                      : persistenceStatus === 'error'
                        ? 'Storefront changes were not saved. Review the error above and try again.'
                        : 'Storefront changes are saved to the shared database.'}
                  </p>
                )}
              </section>
            )}
          </div>
        </main>
      </dialog>
      {pendingDelete && (
        <div className="admin-modal admin-confirm-modal" role="presentation">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <Trash2 />
            <h3 id="delete-title">Delete this vehicle?</h3>
            <p>
              {pendingDelete.make} {pendingDelete.model} will be removed from
              the storefront and the shared database. This cannot be undone.
            </p>
            <span>
              <button type="button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setInventory(
                    inventory.filter((car) => car.id !== pendingDelete.id),
                  );
                  setPendingDelete(null);
                }}
              >
                Delete vehicle
              </button>
            </span>
          </div>
        </div>
      )}
      {adding && (
        <div className="admin-modal">
          <form onSubmit={addCar}>
            <button
              type="button"
              disabled={vehicleUploading}
              onClick={() => {
                setAdding(false);
                setVehicleUploadError('');
              }}
            >
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
                Canonical price (FCFA / XAF)
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
                  <option>Coupe</option>
                  <option>Pickup</option>
                  <option>Van</option>
                </select>
              </label>
              <label>
                Stock source
                <select
                  name="origin"
                  value={adminAddOrigin}
                  onChange={(event) =>
                    setAdminAddOrigin(event.target.value as 'local' | 'abroad')
                  }
                >
                  <option value="local">Local</option>
                  <option value="abroad">Abroad</option>
                </select>
              </label>
              {adminAddOrigin === 'local' ? (
                <>
                  <label>
                    Local country
                    <select
                      name="country"
                      value={adminAddCountry}
                      onChange={(event) =>
                        setAdminAddCountry(event.target.value)
                      }
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
                </>
              ) : (
                <label>
                  Abroad region
                  <select name="importRegion">
                    <option>Europe</option>
                    <option>Asia</option>
                    <option>America</option>
                  </select>
                </label>
              )}
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
              <label>
                Storefront badge
                <input name="badge" defaultValue="New listing" required />
              </label>
              <label className="admin-checkbox">
                <input name="verified" type="checkbox" /> Verified listing
              </label>
              <label className="admin-checkbox">
                <input name="available" type="checkbox" defaultChecked /> In
                stock
              </label>
              {adminAddOrigin === 'local' && (
                <>
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
                    />
                  </label>
                </>
              )}
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
              <VehicleMediaEditor
                images={addVehicleImages}
                setImages={setAddVehicleImages}
                uploading={vehicleUploading}
                progress={vehicleUploadProgress}
                error={vehicleUploadError}
                onFiles={(files) => void uploadVehiclePhotos(files, 'add')}
              />
              <label>
                Main photo URL
                <input
                  name="image"
                  value={addVehicleImages[0] || ''}
                  placeholder="Upload a photo or paste an HTTPS URL"
                  onChange={(event) => {
                    const value = event.target.value;
                    setAddVehicleImages((current) =>
                      value ? [value, ...current.slice(1)] : current.slice(1),
                    );
                  }}
                  required
                />
              </label>
              <label>
                Additional photo URLs
                <textarea
                  name="images"
                  value={addVehicleImages.slice(1).join('\n')}
                  placeholder="One URL per line"
                  onChange={(event) =>
                    setAddVehicleImages((current) => [
                      current[0] || '',
                      ...event.target.value
                        .split('\n')
                        .map((value) => value.trim())
                        .filter(Boolean),
                    ])
                  }
                />
              </label>
            </div>
            <button className="save-listing" disabled={vehicleUploading}>
              {vehicleUploading ? 'Uploading photos…' : 'Publish listing'}
            </button>
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
                        badge: formValue(data, 'badge', car.badge),
                        doors: Number(
                          formValue(data, 'doors', String(car.doors || 5)),
                        ),
                        seats: Number(
                          formValue(data, 'seats', String(car.seats || 5)),
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
              setEditVehicleImages([]);
              setVehicleUploadError('');
              setEditingPhotos(null);
            }}
          >
            <button
              type="button"
              disabled={vehicleUploading}
              onClick={() => {
                setEditingPhotos(null);
                setEditVehicleImages([]);
                setVehicleUploadError('');
              }}
            >
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
                Canonical price (FCFA / XAF)
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
                Storefront badge
                <input
                  name="badge"
                  defaultValue={editingPhotos.badge || 'New listing'}
                  required
                />
              </label>
              <label>
                Doors
                <input
                  name="doors"
                  type="number"
                  min="2"
                  max="6"
                  defaultValue={editingPhotos.doors || 5}
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
                  defaultValue={editingPhotos.seats || 5}
                  required
                />
              </label>
              <label>
                Stock source
                <select
                  name="origin"
                  value={adminEditOrigin}
                  onChange={(event) =>
                    setAdminEditOrigin(event.target.value as 'local' | 'abroad')
                  }
                >
                  <option value="local">Local</option>
                  <option value="abroad">Abroad</option>
                </select>
              </label>
              {adminEditOrigin === 'local' ? (
                <>
                  <label>
                    Local country
                    <select
                      name="country"
                      value={adminEditCountry}
                      onChange={(event) =>
                        setAdminEditCountry(event.target.value)
                      }
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
                </>
              ) : (
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
              )}
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
              {adminEditOrigin === 'local' && (
                <>
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
                    />
                  </label>
                </>
              )}
              <VehicleMediaEditor
                images={editVehicleImages}
                setImages={setEditVehicleImages}
                uploading={vehicleUploading}
                progress={vehicleUploadProgress}
                error={vehicleUploadError}
                onFiles={(files) => void uploadVehiclePhotos(files, 'edit')}
              />
              <label>
                Main photo URL
                <input
                  name="image"
                  value={editVehicleImages[0] || ''}
                  placeholder="Upload a photo or paste an HTTPS URL"
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditVehicleImages((current) =>
                      value ? [value, ...current.slice(1)] : current.slice(1),
                    );
                  }}
                  required
                />
              </label>
              <label>
                Additional photo URLs
                <textarea
                  name="images"
                  value={editVehicleImages.slice(1).join('\n')}
                  placeholder="One URL per line"
                  onChange={(event) =>
                    setEditVehicleImages((current) => [
                      current[0] || '',
                      ...event.target.value
                        .split('\n')
                        .map((value) => value.trim())
                        .filter(Boolean),
                    ])
                  }
                />
              </label>
            </div>
            <button className="save-listing" disabled={vehicleUploading}>
              {vehicleUploading ? 'Uploading photos…' : 'Save listing'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
