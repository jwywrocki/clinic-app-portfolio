import type React from 'react';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { SkipLink } from '@/components/ui/skip-link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { sanitizeHtml, sanitizePhoneNumberHtml, stripHtmlTags } from '@/lib/html-sanitizer';
import { ContactForm } from '@/components/contact-form';
import { createContactService, createPagesService, createSettingsService } from '@/services';
import type { Page } from '@/lib/types/pages';

interface DisplayableContactGroup {
  id: string;
  label: string;
  featured: boolean;
  contact_details: Array<{
    id: string;
    type: 'phone' | 'email' | 'address' | 'hours' | 'emergency_contact';
    value: string;
    icon: React.ElementType;
  }>;
}

export default async function ContactPage() {
  const pagesService = createPagesService();
  const contactService = createContactService();
  const settingsService = createSettingsService();

  const pageResult = await pagesService.getPublishedBySlug('kontakt');
  const pageContent: Page | null = pageResult.isFailure() ? null : pageResult.data;

  const groupsResult = await contactService.getAllGroupsWithDetails();
  const allContactGroups: DisplayableContactGroup[] = groupsResult.isFailure()
    ? []
    : groupsResult.data.map(group => {
        const groupDetails = (group.contact_details || []).map(detail => {
          let icon = Mail;
          if (detail.type === 'phone') icon = Phone;
          if (detail.type === 'address') icon = MapPin;
          if (detail.type === 'hours') icon = Clock;
          if (detail.type === 'emergency_contact') icon = AlertTriangle;
          return { ...detail, icon };
        });

        return {
          id: group.id,
          label: group.label,
          featured: group.in_hero,
          contact_details: groupDetails,
        };
      });

  const mapsSetting = await settingsService.getByKey('google_maps_embed_url');
  const googleMapsUrl =
    !mapsSetting.isFailure() && mapsSetting.data ? mapsSetting.data.value || '' : '';

  return (
    <LayoutWrapper>
      <SkipLink href="#main-content">Przejdź do głównej treści</SkipLink>
      <div id="main-content" className="min-h-screen relative overflow-hidden bg-transparent">
        <AnimatedSection animation="fadeInUp">
          <section className="py-20 relative z-10">
            <div className="container mx-auto px-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                  Kontakt
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
                {pageContent?.title || 'Skontaktuj się z Nami'}
              </h1>
              <div
                className="text-xl text-gray-600 max-w-3xl mx-auto prose prose-xl max-w-none text-center"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    pageContent?.content ||
                      'Jesteśmy do Twojej dyspozycji. Poniżej znajdziesz nasze dane kontaktowe oraz formularz, za pomocą którego możesz wysłać do nas wiadomość.'
                  ),
                }}
              />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={200}>
          {/* Contact Info Section */}
          <section className="py-10 relative z-10 bg-transparent">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-sm">
                Dane Kontaktowe
              </h2>
              {allContactGroups.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* eRejestracja */}
                  <Card className="border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-blue-50/50 backdrop-blur-md relative overflow-hidden rounded-2xl group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-blue-50/70">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
                    <div className="p-8 text-center relative z-10">
                      <div className="bg-blue-600 p-3 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-300">
                        <Clock className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">eRejestracja Online</h3>
                      <p className="text-gray-600 mb-6 text-sm">
                        Umów wizytę online w naszym systemie eRejestracji
                      </p>
                      <Button
                        asChild
                        className="w-full group/btn relative bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 overflow-hidden"
                      >
                        <a
                          href="http://83.3.112.24/portal"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center"
                        >
                          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></span>
                          <span className="relative z-10 flex items-center">
                            Przejdź do eRejestracji
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </span>
                        </a>
                      </Button>
                    </div>
                  </Card>
                  {allContactGroups.map(group => (
                    <Card
                      key={group.id}
                      className="border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md relative overflow-hidden rounded-2xl group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.25)] hover:bg-white/80"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                      <div className="p-8 relative z-10">
                        <h3 className="text-xl font-bold text-gray-900 capitalize mb-6 bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                          {group.label}
                        </h3>
                        <div className="space-y-6">
                          {group.contact_details.map(detail => (
                            <div key={detail.id} className="flex items-start space-x-4">
                              <div
                                className={`${
                                  detail.type === 'emergency_contact'
                                    ? 'bg-red-500'
                                    : detail.type === 'email'
                                      ? 'bg-green-500'
                                      : detail.type === 'phone'
                                        ? 'bg-blue-600/80 shadow-md group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300'
                                        : detail.type === 'address'
                                          ? 'bg-purple-500'
                                          : 'bg-orange-500'
                                } p-3 rounded-xl flex-shrink-0`}
                              >
                                <detail.icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="text-sm font-medium text-blue-600/80 mb-1">
                                  {detail.type === 'phone'
                                    ? 'Telefon'
                                    : detail.type === 'email'
                                      ? 'Email'
                                      : detail.type === 'address'
                                        ? 'Adres'
                                        : detail.type === 'hours'
                                          ? 'Godziny otwarcia'
                                          : detail.type === 'emergency_contact'
                                            ? 'Kontakt awaryjny'
                                            : detail.type}
                                </div>
                                {detail.type === 'email' ? (
                                  <a
                                    href={`mailto:${stripHtmlTags(detail.value)}`}
                                    className="text-gray-900 hover:text-blue-600 transition-colors font-bold text-lg inline-block max-w-full break-words break-all group-hover:translate-x-1 duration-300"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizePhoneNumberHtml(detail.value),
                                    }}
                                  />
                                ) : detail.type === 'phone' ||
                                  detail.type === 'emergency_contact' ? (
                                  <a
                                    href={`tel:${stripHtmlTags(detail.value).replace(/\s/g, '')}`}
                                    className="text-gray-900 hover:text-blue-600 transition-colors font-bold text-lg inline-block max-w-full break-words group-hover:translate-x-1 duration-300"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizePhoneNumberHtml(detail.value),
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="text-gray-900 font-semibold text-base break-words"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizePhoneNumberHtml(detail.value),
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
                  <div className="text-center text-gray-600">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>Brak dostępnych informacji kontaktowych.</p>
                  </div>
                </Card>
              )}
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection animation="fadeInUp" delay={300}>
          {/* Contact Form Section */}
          <section className="py-10 relative z-10 bg-transparent">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center drop-shadow-sm">
                Napisz do Nas
              </h2>
              <div className="max-w-4xl mx-auto">
                <ContactForm />
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Google Maps Section */}
        {googleMapsUrl && (
          <AnimatedSection animation="fadeInUp" className="relative z-10 bg-transparent">
            <section className="pt-16">
              <div className="container mx-auto px-4 mb-8">
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4 drop-shadow-sm">
                    Znajdź nas
                  </h2>
                  <p className="text-gray-600">Nasza lokalizacja na mapie</p>
                </div>
              </div>
              <div className="w-screen h-96 md:h-[500px] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                <iframe
                  src={googleMapsUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Lokalizacja kliniki"
                />
              </div>
            </section>
          </AnimatedSection>
        )}
      </div>
    </LayoutWrapper>
  );
}
