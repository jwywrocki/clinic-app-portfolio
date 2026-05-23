'use client';

import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { AnimatedSection } from '@/components/ui/animated-section';
import { FadeIn } from '@/components/ui/animation-helpers';
import { useEffect, useState } from 'react';
import { fetchContactInfo, type ContactInfoResult } from '@/lib/utils/contact-client';
import { sanitizePhoneNumberHtml, stripHtmlTags } from '@/lib/html-sanitizer';
import Image from 'next/image';

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  order_position: number;
}

interface ContactInfo {
  phone: string | null;
  phoneLabel: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  contactGroups?: Array<{
    id: string;
    label: string;
    in_hero: boolean;
    in_footer: boolean;
    contact_details: Array<{
      id: string;
      type: string;
      value: string;
      order_position: number;
    }>;
  }>;
}

interface ServiceItem {
  id: string;
  title: string;
}

interface FooterProps {
  menuItems?: MenuItem[];
}

export function Footer({ menuItems = [] }: FooterProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfoResult | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Filter main menu items (only top-level items without parent_id)
  const mainMenuItems = menuItems.filter((item: any) => !item.parent_id).slice(0, 6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use our Next.js API instead of direct Supabase access
        const formattedContactInfo = await fetchContactInfo();
        setContactInfo(formattedContactInfo);

        // Fetch services using our API instead of direct Supabase access
        const servicesResponse = await fetch('/api/services', {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServices(servicesData.slice(0, 6));
        } else {
          console.error(
            'Failed to fetch services:',
            servicesResponse.status,
            servicesResponse.statusText
          );
        }
      } catch (error) {
        console.error('Błąd podczas pobierania danych:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array - run only once on mount

  return (
    <FadeIn direction="up" threshold={0.1}>
      <footer
        className="bg-slate-900 border-t border-slate-800 text-white relative overflow-hidden"
        role="contentinfo"
      >
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/40 rounded-full mix-blend-screen filter blur-[100px]"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[100px]"></div>
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={48}
                  height={61}
                  className="w-12 h-auto"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-300">SPZOZ</div>
                  <div className="text-lg font-bold">GOZ Łopuszno</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Profesjonalna opieka zdrowotna dla mieszkańców Łopuszna i okolic od 1998 roku.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Nawigacja</h3>
              <ul className="space-y-2">
                {mainMenuItems.map((item: MenuItem) => (
                  <li key={item.id}>
                    {item.url ? (
                      <Link
                        href={item.url}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="text-gray-500 text-sm">{item.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Nasze usługi</h3>
              <div className="space-y-1">
                {services.length > 0 ? (
                  services.slice(0, 6).map(service => (
                    <p key={service.id} className="text-gray-400 text-sm">
                      {service.title}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">Brak dostępnych usług</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-4 text-white">Kontakt</h3>
              <div className="space-y-3">
                {contactInfo?.contactGroups
                  ?.filter(group => group.in_footer)
                  .map(group => (
                    <div key={group.id} className="space-y-2">
                      <div className="text-sm font-medium text-gray-300">{group.label}</div>
                      {group.contact_details
                        .sort((a, b) => a.order_position - b.order_position)
                        .map(detail => (
                          <div key={detail.id} className="flex items-start gap-2">
                            {detail.type === 'phone' && (
                              <Phone className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            {detail.type === 'email' && (
                              <Mail className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            {detail.type === 'address' && (
                              <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            {detail.type === 'hours' && (
                              <Clock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="text-sm">
                              {detail.type === 'phone' ? (
                                <a
                                  href={`tel:${stripHtmlTags(detail.value)}`}
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizePhoneNumberHtml(detail.value),
                                    }}
                                  />
                                </a>
                              ) : detail.type === 'email' ? (
                                <a
                                  href={`mailto:${detail.value}`}
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  {detail.value}
                                </a>
                              ) : detail.type === 'hours' ? (
                                <div
                                  className="text-gray-400 whitespace-pre-line"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizePhoneNumberHtml(detail.value),
                                  }}
                                />
                              ) : (
                                <div
                                  className="text-gray-400"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizePhoneNumberHtml(detail.value),
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}

                {/* Fallback contact info if no footer groups */}
                {!contactInfo?.contactGroups?.some(g => g.in_footer) && (
                  <div className="space-y-2">
                    {contactInfo?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <a
                          href={`tel:${stripHtmlTags(contactInfo.phone)}`}
                          className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          <span
                            dangerouslySetInnerHTML={{
                              __html: sanitizePhoneNumberHtml(contactInfo.phone),
                            }}
                          />
                        </a>
                      </div>
                    )}
                    {contactInfo?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <a
                          href={`mailto:${contactInfo.email}`}
                          className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          {contactInfo.email}
                        </a>
                      </div>
                    )}
                    {contactInfo?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div
                          className="text-gray-400 text-sm"
                          dangerouslySetInnerHTML={{
                            __html: sanitizePhoneNumberHtml(contactInfo.address),
                          }}
                        />
                      </div>
                    )}
                    {contactInfo?.hours && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div
                          className="text-gray-400 text-sm whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: sanitizePhoneNumberHtml(contactInfo.hours),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 bg-slate-900/50 backdrop-blur-md relative z-10">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} SPZOZ GOZ Łopuszno. Wszelkie prawa zastrzeżone.
                Realizacja:{' '}
                <a
                  href="https://jaqb.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                >
                  jaqb.dev
                </a>
              </p>
              <div className="flex flex-col items-center gap-6">
                <Link
                  href="/polityka-prywatnosci"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Polityka prywatności
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </FadeIn>
  );
}
