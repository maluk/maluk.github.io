import type { MetadataRoute } from 'next';
import { verifiedStatePages, statePages } from '@/site/states.ts';
import { stateCalculators } from '@/calculator/states/index.ts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://thetax.us/', priority: 1 },
    ...verifiedStatePages.map(page => ({ url: `https://thetax.us/${page.slug}/`, priority: .9 })),
    ...statePages.filter(page => stateCalculators[2025]?.[page.code]?.metadata.status === 'verified').map(page => ({ url: `https://thetax.us/${page.slug}/2025/`, priority: .5 })),
  ];
}
