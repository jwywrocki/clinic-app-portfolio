import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Phone } from 'lucide-react';
import Link from 'next/link';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { SkipLink } from '@/components/ui/skip-link';
import { sanitizeHtml } from '@/lib/html-sanitizer';
import { createClinicServicesService, createPagesService } from '@/services';
import type { Page } from '@/lib/types/pages';
import type { Service } from '@/lib/types/services';

const iconEmojiMap: { [key: string]: string } = {
  heart: '❤️',
  stethoscope: '🩺',
  pill: '💊',
  syringe: '💉',
  bandage: '🩹',
  tooth: '🦷',
  eye: '👁️',
  brain: '🧠',
  lungs: '🫁',
  bone: '🦴',
  microscope: '🔬',
  'x-ray': '🩻',
  thermometer: '🌡️',
  baby: '👶',
  'pregnant-woman': '🤰',
  elderly: '👴',
  wheelchair: '♿',
  ambulance: '🚑',
  hospital: '🏥',
  'first-aid': '🆘',
};

const getIconEmoji = (iconName: string | undefined): string => {
  if (!iconName) {
    return '🏥'; // Default hospital icon
  }

  return iconEmojiMap[iconName] || '🏥';
};

export default async function ServicesPage() {
  const pagesService = createPagesService();
  const clinicServicesService = createClinicServicesService();

  const pageResult = await pagesService.getPublishedBySlug('uslugi');
  const pageContent: Page | null = pageResult.isFailure() ? null : pageResult.data;

  const servicesResult = await clinicServicesService.getPublishedByCreatedAt();
  const services: Service[] = servicesResult.isFailure() ? [] : servicesResult.data;

  if (!pageContent) {
    return (
      <LayoutWrapper>
        <div className="min-h-[calc(100vh-10rem)] relative z-10 bg-transparent flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Nie znaleziono strony.</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SkipLink href="#main-content">Przejdź do głównej treści</SkipLink>
      <div
        id="main-content"
        className="flex flex-col flex-grow h-full relative z-10 bg-transparent"
      >
        <div className="flex-grow">
          {/* Hero Section */}
          <AnimatedSection animation="fadeInUp">
            <section className="py-20 relative bg-transparent">
              <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                    Nasze Usługi
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
                  {pageContent?.title || 'Kompleksowe Usługi Medyczne'}
                </h1>
                <div
                  className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 prose prose-xl max-w-none text-center"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      pageContent?.content ||
                        'W SPZOZ GOZ Łopuszno oferujemy szeroki wachlarz usług medycznych, aby sprostać potrzebom zdrowotnym naszych pacjentów. Nasz doświadczony personel i nowoczesny sprzęt gwarantują najwyższą jakość opieki.'
                    ),
                  }}
                />
              </div>
            </section>
          </AnimatedSection>

          {/* Services Grid */}
          <AnimatedSection animation="fadeInUp" delay={200}>
            <section className="py-20 relative z-10 bg-transparent">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {services.map((service, index) => {
                    const iconEmoji = getIconEmoji(service.icon);
                    return (
                      <Card
                        key={service.id || index}
                        className="group transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80 h-full relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                        <CardHeader className="text-center pb-4 relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 shadow-md transition-all duration-300">
                            <span className="text-3xl">{iconEmoji}</span>
                          </div>
                          <CardTitle className="text-xl font-bold bg-clip-text text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                            {service.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                          <div
                            className="text-gray-600 text-center leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.description) }}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          </AnimatedSection>
        </div>

        {/* CTA Section */}
        <AnimatedSection animation="fadeInUp" delay={300} className="mt-auto">
          <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Gotowy zadbać o swoje zdrowie?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Skontaktuj się z nami już dziś, aby umówić wizytę lub dowiedzieć się więcej o
                naszych usługach. Jesteśmy tu, aby Ci pomóc.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="group relative bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  asChild
                >
                  <Link href="/kontakt">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-200/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">
                      <Phone className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Umów się na wizytę
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </div>
    </LayoutWrapper>
  );
}
