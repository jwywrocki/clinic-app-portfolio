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
    <section className="relative py-12 flex items-center justify-center overflow-hidden min-h-[50vh]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Nowoczesny budynek ośrodka zdrowia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/80 to-blue-900/40"></div>
        {/* Animated Glow Orbs in Hero */}
        <div
          className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/50 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none"
          style={{ animationDuration: '6s' }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-indigo-500/50 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none"
          style={{ animationDuration: '8s', animationDelay: '1s' }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white mt-8">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
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
                <div className="relative inline-flex items-center px-4 py-1.5 bg-blue-600/20 backdrop-blur-md rounded-full border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden group">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
                  <span className="text-blue-100 text-sm font-bold tracking-wide relative z-10">
                    SŁUŻYMY SPOŁECZNOŚCI OD 1998 ROKU
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                  <span className="text-white">Profesjonalna opieka zdrowotna w </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-100 to-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    sercu Łopuszna
                  </span>
                </h1>
                <p className="text-base md:text-lg text-blue-100 leading-relaxed max-w-2xl">
                  Zapewniamy kompleksową opiekę medyczną dla całej rodziny. Nowoczesny sprzęt,
                  doświadczeni lekarze i indywidualne podejście do każdego pacjenta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="group relative bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <Link href="/kontakt">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">
                      Umów wizytę
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="group relative bg-white/10 border border-white/30 backdrop-blur-md text-white hover:bg-white/20 hover:text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <Link href="/uslugi">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">Nasze usługi</span>
                  </Link>
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
                    className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 mb-4 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <h3 className="text-lg font-semibold text-white mb-2 relative z-10 group-hover:text-blue-200 transition-colors">
                      {group.label || 'Informacja'}
                    </h3>
                    {group.contact_details
                      .filter(detail => ['phone', 'hours'].includes(detail.type) && detail.value)
                      .map(detail => {
                        const IconComponent = detail.type === 'hours' ? Clock : Phone;

                        return (
                          <div
                            key={detail.id}
                            className="flex items-center space-x-3 mb-2 ml-1 relative z-10"
                          >
                            <div className="bg-blue-600/80 p-2 rounded-lg flex-shrink-0 mt-1 shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300">
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
