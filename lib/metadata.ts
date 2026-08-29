import { unstable_cache } from 'next/cache';
import { createSettingsService } from '@/services';

interface SiteSettings {
  [key: string]: string;
}

const SITE_SETTINGS_KEYS = [
  'site_title',
  'site_description',
  'site_keywords',
  'site_author',
  'meta_viewport',
  'meta_language',
  'meta_charset',
  'canonical_url',
  'favicon_url',
  'robots_txt',
  'sitemap_url',
  'schema_type',
  'schema_name',
  'schema_description',
  'schema_address',
  'schema_phone',
  'schema_email',
  'schema_opening_hours',
  'structured_data_enabled',
  'h1_title',
  'meta_title_template',
  'breadcrumb_enabled',
];

// Cached to avoid hitting the DB on every SSG page during `next build`.
// Revalidated every 60 s at runtime; also invalidated via revalidateTag('site-settings').
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const settingsService = createSettingsService();
      const settingsResult = await settingsService.getAllAsMap();
      if (settingsResult.isFailure()) {
        throw settingsResult.error;
      }

      const settingsObj: SiteSettings = {};
      SITE_SETTINGS_KEYS.forEach(key => {
        settingsObj[key] = settingsResult.data[key] || '';
      });
      return settingsObj;
    } catch (error) {
      console.error('Error in getSiteSettings:', error);
      return {};
    }
  },
  ['site-settings'],
  { revalidate: 60, tags: ['site-settings'] }
);

export function generateSchemaOrgStructuredData(settings: SiteSettings): object | null {
  if (
    settings.structured_data_enabled !== 'true' ||
    !settings.schema_name ||
    !settings.schema_type
  ) {
    return null;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': settings.schema_type,
    name: settings.schema_name,
    description: settings.schema_description || settings.site_description,
    url: settings.canonical_url,
    ...(settings.schema_address && { address: settings.schema_address }),
    ...(settings.schema_phone && { telephone: settings.schema_phone }),
    ...(settings.schema_email && { email: settings.schema_email }),
    ...(settings.schema_opening_hours && {
      openingHours: settings.schema_opening_hours.split(',').map((h: string) => h.trim()),
    }),
  };

  return structuredData;
}
