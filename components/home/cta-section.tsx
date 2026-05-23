'use client';

import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Phone, MapPin, ArrowRight, Clock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchContactInfo, type ContactInfoResult } from '@/lib/utils/contact-client';
import { stripHtmlTags, sanitizePhoneNumberHtml } from '@/lib/html-sanitizer';

type ContactInfoType = ContactInfoResult | null;

export function CtaSection() {
  const [contactInfo, setContactInfo] = useState<ContactInfoResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchContactInfo();
        setContactInfo(data);
      } catch (error) {
        console.error('Error fetching contact info for CTA section:', error);
      }
    };
    fetchData();
  }, []);

  const displayContacts =
    contactInfo?.contactGroups
      ?.filter(g => g.in_hero)
      .flatMap(g => g.contact_details.map(d => ({ ...d, groupLabel: g.label }))) || [];

  const primaryPhone = displayContacts.find(c => c.type === 'phone');
  const primaryAddress = displayContacts.find(c => c.type === 'address');
  const primaryHours = displayContacts.find(c => c.type === 'hours');

  const phoneValue = primaryPhone?.value || contactInfo?.phone;
  const phoneLabel = primaryPhone?.groupLabel || contactInfo?.phoneLabel || 'Kontakt';
  const addressValue = primaryAddress?.value || contactInfo?.address;
  const hoursValue = primaryHours?.value || contactInfo?.hours;

  return (
    <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Dynamic Background Orbs */}
      <div
        className="absolute top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse hidden md:block"
        style={{ animationDuration: '4s' }}
      ></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse hidden md:block"
        style={{ animationDuration: '5s' }}
      ></div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <AnimatedSection animation="fadeInLeft">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="relative inline-flex items-center px-4 py-2 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden group">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
                  <span className="text-blue-100 text-sm font-bold tracking-wide relative z-10">
                    UMÓW SIĘ JUŻ DZIŚ
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 drop-shadow-sm leading-tight break-words">
                  Zadbaj o swoje zdrowie już dziś
                </h2>
                <p className="text-lg sm:text-xl text-blue-100 leading-relaxed">
                  Nie czekaj z wizytą u lekarza. Umów się na konsultację i zadbaj o swoje zdrowie
                  oraz zdrowie swoich bliskich. Nasz zespół specjalistów jest gotowy Ci pomóc.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  className="group relative bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <Link href="/kontakt">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-200/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">
                      <Phone className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Umów wizytę
                    </span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="group relative bg-blue-800/50 backdrop-blur-md border-blue-400/50 text-white hover:bg-blue-700 hover:text-white px-5 py-3 h-auto text-base font-bold rounded-xl shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                >
                  <Link href="/kontakt">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">
                      <MapPin className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Jak dojechać
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {/* Right Column */}
          <AnimatedSection animation="fadeInRight" delay={200}>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">Informacje kontaktowe</h3>
              {contactInfo ? (
                <div className="space-y-6">
                  {displayContacts.length > 0 ? (
                    contactInfo?.contactGroups
                      ?.filter(g => g.in_hero)
                      .map(group => (
                        <div key={group.id} className="mb-4">
                          {' '}
                          <p className="text-blue-200 text-sm font-semibold mb-1">{group.label}</p>
                          {group.contact_details
                            .filter(contact => ['phone', 'address', 'hours'].includes(contact.type))
                            .map(contact => {
                              let IconComponent = Phone;
                              if (contact.type === 'email') IconComponent = Mail;
                              else if (contact.type === 'address') IconComponent = MapPin;
                              else if (contact.type === 'hours') IconComponent = Clock;

                              return (
                                <div
                                  key={contact.id}
                                  className="flex items-center space-x-4 mb-3 ml-2 group cursor-default"
                                >
                                  <div className="bg-blue-600/80 p-3 rounded-xl flex-shrink-0 shadow-lg group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <IconComponent className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    {contact.type === 'phone' ? (
                                      <a
                                        href={`tel:${stripHtmlTags(contact.value)}`}
                                        className="text-lg font-semibold text-white hover:text-blue-100 transition-colors break-words"
                                      >
                                        <span
                                          dangerouslySetInnerHTML={{
                                            __html: sanitizePhoneNumberHtml(contact.value),
                                          }}
                                        />
                                      </a>
                                    ) : contact.type === 'address' ? (
                                      <address
                                        className="not-italic text-lg font-semibold text-white break-words"
                                        dangerouslySetInnerHTML={{
                                          __html: sanitizePhoneNumberHtml(contact.value),
                                        }}
                                      />
                                    ) : contact.type === 'hours' ? (
                                      <div
                                        className="text-lg font-semibold text-white whitespace-pre-line break-words"
                                        dangerouslySetInnerHTML={{
                                          __html: sanitizePhoneNumberHtml(contact.value),
                                        }}
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ))
                  ) : (
                    <>
                      {phoneValue && (
                        <div className="flex items-start space-x-4 group cursor-default">
                          <div className="bg-blue-600/80 p-3 rounded-xl flex-shrink-0 shadow-lg group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-blue-200 text-sm font-medium">{phoneLabel}</p>
                            <a
                              href={`tel:${stripHtmlTags(phoneValue)}`}
                              className="text-xl font-bold text-white hover:text-blue-200 transition-colors inline-block group-hover:translate-x-1 duration-300"
                            >
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: sanitizePhoneNumberHtml(phoneValue),
                                }}
                              />
                            </a>
                          </div>
                        </div>
                      )}
                      {addressValue && (
                        <div className="flex items-start space-x-4 mt-6 group cursor-default">
                          <div className="bg-blue-600/80 p-3 rounded-xl flex-shrink-0 shadow-lg group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-blue-200 text-sm font-medium">Adres</p>
                            <address
                              className="not-italic text-lg font-semibold text-white group-hover:text-blue-50 transition-colors break-words"
                              dangerouslySetInnerHTML={{
                                __html: sanitizePhoneNumberHtml(addressValue),
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {hoursValue && (
                        <div className="flex items-start space-x-4 mt-6 group cursor-default">
                          <div className="bg-blue-600/80 p-3 rounded-xl flex-shrink-0 shadow-lg group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-blue-200 text-sm font-medium">Godziny otwarcia</p>
                            <div
                              className="text-lg font-semibold text-white whitespace-pre-line group-hover:text-blue-50 transition-colors break-words"
                              dangerouslySetInnerHTML={{
                                __html: sanitizePhoneNumberHtml(hoursValue),
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t border-white/20 mt-8">
                    <Button
                      asChild
                      className="w-full group/btn relative bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-4 py-3 h-auto text-[15px] sm:text-base font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                    >
                      <Link href="/kontakt">
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></span>
                        <span className="relative z-10 flex flex-wrap items-center justify-center text-center">
                          Zobacz pełne informacje kontaktowe
                          <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-400 p-3 rounded-xl flex-shrink-0 animate-pulse h-12 w-12"></div>
                    <div className="w-full space-y-2">
                      <div className="h-4 bg-blue-300 rounded w-1/4 animate-pulse"></div>
                      <div className="h-5 bg-blue-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-5 bg-blue-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-400 p-3 rounded-xl flex-shrink-0 animate-pulse h-12 w-12"></div>
                    <div className="w-full space-y-2">
                      <div className="h-4 bg-blue-300 rounded w-1/4 animate-pulse"></div>
                      <div className="h-5 bg-blue-200 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-400 p-3 rounded-xl flex-shrink-0 animate-pulse h-12 w-12"></div>
                    <div className="w-full space-y-2">
                      <div className="h-4 bg-blue-300 rounded w-1/4 animate-pulse"></div>
                      <div className="h-5 bg-blue-200 rounded w-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
