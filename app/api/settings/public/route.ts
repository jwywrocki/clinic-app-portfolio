import { type NextRequest, NextResponse } from 'next/server';
import { createSettingsService } from '@/services';

const PUBLIC_PREFIXES = ['site_', 'meta_', 'schema_', 'og_', 'twitter_', 'google_'];
const PUBLIC_KEYS = new Set([
  'hero_image',
  'favicon_url',
  'canonical_url',
  'robots_txt',
  'sitemap_url',
  'h1_title',
  'meta_title_template',
  'breadcrumb_enabled',
  'structured_data_enabled',
]);

const isPublicKey = (key: string) =>
  PUBLIC_KEYS.has(key) || PUBLIC_PREFIXES.some(prefix => key.startsWith(prefix));

const settingsService = createSettingsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      if (!isPublicKey(key)) {
        return NextResponse.json({ key, value: null }, { status: 404 });
      }

      const settingResult = await settingsService.getByKey(key);
      if (settingResult.isFailure()) {
        throw settingResult.error;
      }
      return NextResponse.json(settingResult.data || { key, value: null });
    }

    const settingsResult = await settingsService.getAll();
    if (settingsResult.isFailure()) {
      throw settingsResult.error;
    }
    const publicSettings = (settingsResult.data || []).filter(setting => isPublicKey(setting.key));
    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: 'Failed to fetch public settings' }, { status: 500 });
  }
}
