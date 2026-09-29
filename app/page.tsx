import JFCarsApp from '@/components/jfcars/JFCarsApp';
import { readStorefrontPresentation } from '@/lib/marketplace-store';
import { ensureDatabase } from '@/lib/site-db';
import type { StorefrontContent } from '@/lib/marketplace/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialStorefrontContent: StorefrontContent = {};
  try {
    initialStorefrontContent = await readStorefrontPresentation(
      await ensureDatabase(),
    );
  } catch {
    // The client API remains the resilient fallback for local/offline previews.
  }
  return <JFCarsApp initialStorefrontContent={initialStorefrontContent} />;
}
