'use client';

import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { FadeIn, SlideIn } from '@/components/ui/animation-helpers';
import { ArrowRight, Phone, MapPin, Clock, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { fetchContactInfo, type ContactInfoResult } from '@/lib/utils/contact-client';
import { stripHtmlTags, sanitizePhoneNumberHtml } from '@/lib/html-sanitizer';

interface ContactInfo {
  phone: string | null;
  phoneLabel: string | null;
  email: string | null;
  address: string | null;
  hours: string | null;
  featuredContacts?: Array<{
    label: string;
    type: string;
    value: string;
  }>;
}

export function HeroSection() {
  const [contactInfo, setContactInfo] = useState<ContactInfoResult | null>(null);
  const [heroImage, setHeroImage] = useState('/images/baner.webp');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch contact info
        const data = await fetchContactInfo();
        setContactInfo(data);

        // Fetch hero image setting
        try {
          const settingsResponse = await fetch('/api/settings/public?key=hero_image');
          if (settingsResponse.ok) {
            const setting = await settingsResponse.json();
            if (setting && setting.value) {
              setHeroImage(setting.value);
            }
          }
        } catch (error) {
          console.error('Error fetching hero image setting:', error);
          // Keep default image if settings fetch fails
        }
      } catch (error) {
        console.error('Error fetching contact info for Hero section:', error);
        setContactInfo(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDisplayHours = () => {
    if (!contactInfo || !contactInfo.hours) return [];

    return contactInfo.hours
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
  };

  return (
    <section className="relative py-16 flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Nowoczesny budynek ośrodka zdrowia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Main Content */}
          <FadeIn direction="left" delay={0}>
            <Image
              src="/images/nfz_logo.png"
              alt="Logo NFZ"
              width={64}
              height={25}
              className="w-auto h-auto max-w-[64px] max-h-[25px]"
            />
            <div className="space-y-6 mt-4">
              <div className="space-y-3">
                <div className="inline-flex items-center px-3 py-1 bg-blue-600/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                  <span className="text-blue-200 text-sm font-medium">
                    SŁUŻYMY SPOŁECZNOŚCI OD 1998 ROKU
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                  Profesjonalna opieka zdrowotna w sercu Łopuszna
                </h1>
                <p className="text-lg text-blue-100 leading-relaxed max-w-2xl">
                  Zapewniamy kompleksową opiekę medyczną dla całej rodziny. Nowoczesny sprzęt,
                  doświadczeni lekarze i indywidualne podejście do każdego pacjenta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/kontakt">
                    Umów wizytę
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/uslugi">Nasze usługi</Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Right Column - Contact Cards */}
          <FadeIn direction="right" delay={200}>
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 md:gap-2 lg:space-y-4">
              {contactInfo?.contactGroups
                ?.filter(group => group.in_hero)
                .filter(group =>
                  group.contact_details.some(
                    detail => ['phone', 'hours'].includes(detail.type) && detail.value
                  )
                )
                .map(group => (
                  <div
                    key={group.id}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-shadow duration-300 mb-4"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {group.label || 'Informacja'}
                    </h3>
                    {group.contact_details
                      .filter(detail => ['phone', 'hours'].includes(detail.type) && detail.value)
                      .map(detail => {
                        const IconComponent = detail.type === 'hours' ? Clock : Phone;

                        return (
                          <div key={detail.id} className="flex items-center space-x-3 mb-2 ml-1">
                            <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0 mt-1">
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              {detail.type === 'phone' && (
                                <a
                                  href={`tel:${stripHtmlTags(detail.value)}`}
                                  className="text-blue-200 hover:text-white transition-colors text-base"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizePhoneNumberHtml(detail.value),
                                  }}
                                />
                              )}
                              {detail.type === 'hours' && (
                                <div
                                  className="text-blue-200 text-base whitespace-pre-line"
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizePhoneNumberHtml(detail.value),
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              {loading && !contactInfo && (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <div className="flex items-start space-x-4 animate-pulse">
                    <div className="bg-blue-500/50 p-3 rounded-xl flex-shrink-0 h-12 w-12"></div>
                    <div>
                      <div className="h-5 bg-blue-300/50 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-blue-200/50 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
