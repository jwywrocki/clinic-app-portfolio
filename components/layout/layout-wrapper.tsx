'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Header } from './header';
import { Footer } from './footer';
import { AccessibilityToolbar } from '@/components/ui/accessibility-toolbar';
import { CookieConsent } from '@/components/ui/cookie-consent';
import { DynamicMetadata } from '@/components/dynamic-metadata';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  order_position: number;
  parent_id?: string | null;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  hours: string;
  emergency_contact?: string;
}

interface LayoutWrapperProps {
  children: React.ReactNode;
  showAccessibilityToolbar?: boolean;
  showCookieConsent?: boolean;
}

let menuCache: MenuItem[] | null = null;
let contactCache: ContactInfo | null = null;
let cacheTimestamp = 0;

// Clear cache on module reload
menuCache = null;
contactCache = null;
cacheTimestamp = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function LayoutWrapper({
  children,
  showAccessibilityToolbar = true,
  showCookieConsent = true,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const fetchLayoutData = async () => {
      try {
        setLoading(true);

        const now = Date.now();
        if (menuCache && contactCache && now - cacheTimestamp < CACHE_DURATION) {
          setMenuItems(menuCache);
          setContactInfo(contactCache);
          setLoading(false);
          return;
        }

        // Use our APIs instead of direct Supabase access for consistency
        const [menuResponse, contactResponse] = await Promise.allSettled([
          fetch('/api/menu_items', { cache: 'no-store' }),
          fetch('/api/contact_groups', { cache: 'no-store' }),
        ]);

        let fetchedMenu: MenuItem[] = [];
        let fetchedContact: ContactInfo | null = null;

        if (menuResponse.status === 'fulfilled' && menuResponse.value.ok) {
          const menuData = await menuResponse.value.json();
          fetchedMenu = menuData.sort((a: any, b: any) => a.order_position - b.order_position);
        } else {
          console.warn('Failed to load menu items:', menuResponse);
        }

        if (contactResponse.status === 'fulfilled' && contactResponse.value.ok) {
          const contactData = await contactResponse.value.json();
          fetchedContact = contactData[0] || null; // Get first contact group
        }

        // Fetch site settings for SEO
        try {
          const settingsResponse = await fetch('/api/settings/public');
          if (settingsResponse.ok) {
            const allSettings = await settingsResponse.json();
            const settings: Record<string, string> = {};

            allSettings.forEach((setting: any) => {
              if (
                setting.key.startsWith('site_') ||
                setting.key.startsWith('meta_') ||
                setting.key.startsWith('schema_') ||
                setting.key.startsWith('og_') ||
                setting.key.startsWith('twitter_') ||
                setting.key.startsWith('google_') ||
                [
                  'favicon_url',
                  'canonical_url',
                  'robots_txt',
                  'sitemap_url',
                  'h1_title',
                  'meta_title_template',
                  'breadcrumb_enabled',
                  'structured_data_enabled',
                ].includes(setting.key)
              ) {
                settings[setting.key] = setting.value || '';
              }
            });

            setSiteSettings(settings);
          }
        } catch (error) {
          console.error('Error fetching site settings:', error);
        }

        menuCache = fetchedMenu;
        contactCache = fetchedContact;
        cacheTimestamp = now;

        setMenuItems(fetchedMenu);
        setContactInfo(fetchedContact);
      } catch (error) {
        console.error('Błąd podczas ładowania danych layoutu:', error);

        if (menuCache && contactCache) {
          setMenuItems(menuCache);
          setContactInfo(contactCache);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutData();
  }, []); // Empty dependency array since supabase is created inside useEffect

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic SEO Metadata */}
      <DynamicMetadata settings={siteSettings} />

      {/* Accessibility Controls - only show for non-admin routes */}
      {showAccessibilityToolbar && !isAdminRoute && <AccessibilityToolbar />}

      {/* Cookie Consent - only show for non-admin routes */}
      {showCookieConsent && !isAdminRoute && <CookieConsent />}

      {/* Header */}
      <Header menuItems={menuItems} />

      {/* Main Content */}
      <main className="pt-20">{children}</main>

      {/* Footer */}
      <Footer menuItems={menuItems} />
    </div>
  );
}
