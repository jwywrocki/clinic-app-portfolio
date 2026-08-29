import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Users, Award, Shield, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { FadeIn, SlideIn } from '@/components/ui/animation-helpers';
import { SkipLink } from '@/components/ui/skip-link';
import { sanitizeHtml } from '@/lib/html-sanitizer';
import { createDoctorService, createPagesService } from '@/services';
import type { Page } from '@/lib/types/pages';
import type { Doctor } from '@/lib/types/doctors';

export default async function AboutPage() {
  const pagesService = createPagesService();
  const doctorService = createDoctorService();

  const pageResult = await pagesService.getPublishedBySlug('o-nas');
  const pageContent: Page | null = pageResult.isFailure() ? null : pageResult.data;

  const doctorsResult = await doctorService.getActiveDoctors();
  const teamMembers: Doctor[] = doctorsResult.isFailure() ? [] : doctorsResult.data.slice(0, 3);

  const values = [
    {
      icon: Heart,
      title: 'Troska o Pacjenta',
      description: 'Każdego pacjenta traktujemy z empatią, szacunkiem i zrozumieniem.',
    },
    {
      icon: Shield,
      title: 'Bezpieczeństwo',
      description: 'Bezpieczeństwo pacjentów jest naszym najwyższym priorytetem.',
    },
    {
      icon: Award,
      title: 'Profesjonalizm',
      description: 'Dążymy do najwyższych standardów w opiece medycznej i obsłudze.',
    },
    {
      icon: Users,
      title: 'Społeczność',
      description: 'Jesteśmy zaangażowani w służbę i poprawę zdrowia lokalnej społeczności.',
    },
  ];

  if (!pageContent) {
    return (
      <LayoutWrapper>
        <div className="min-h-[calc(100vh-10rem)] bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
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
      <div id="main-content" className="relative z-10 bg-transparent min-h-screen">
        {/* Hero Section */}
        <section className="py-20 relative bg-transparent">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <FadeIn direction="left" delay={0}>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                    O Nas
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
                  {pageContent?.title || 'Poznaj SPZOZ GOZ Łopuszno'}
                </h1>
                <div
                  className="text-xl text-gray-600 leading-relaxed mb-8 prose prose-xl max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      pageContent?.content ||
                        'Jesteśmy Samodzielnym Publicznym Zakładem Opieki Zdrowotnej, Gminnym Ośrodkiem Zdrowia w Łopusznie. Naszą misją jest zapewnienie kompleksowej i profesjonalnej opieki medycznej dla mieszkańców gminy Łopuszno i okolic.'
                    ),
                  }}
                />
                <Button
                  className="group relative bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  asChild
                >
                  <Link href="/kontakt">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <span className="relative z-10 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      Skontaktuj się z nami
                    </span>
                  </Link>
                </Button>
              </FadeIn>
              <FadeIn direction="right" delay={200}>
                <div className="relative">
                  <img
                    src="/images/baner.webp?height=500&width=600"
                    alt="Budynek ośrodka zdrowia w Łopusznie"
                    className="rounded-2xl shadow-2xl"
                  />
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <FadeIn direction="up" delay={0} threshold={0.2}>
          <section className="py-20 relative z-10 bg-transparent">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">
                  Nasza Historia
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Założony w 1998 roku, SPZOZ GOZ w Łopusznie służy lokalnej społeczności z oddaniem
                  i profesjonalizmem od ponad ćwierćwiecza. Zaczynaliśmy jako niewielka przychodnia,
                  a dziś jesteśmy nowoczesnym ośrodkiem zdrowia, oferującym szeroki zakres usług
                  medycznych. Nasze podstawowe wartości pozostały niezmienne: zapewnienie
                  współczującej, wysokiej jakości opieki medycznej każdemu pacjentowi.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Nasz zespół certyfikowanych lekarzy i pracowników służby zdrowia jest zaangażowany
                  w ciągłe podnoszenie kwalifikacji i stosowanie najnowszych osiągnięć medycyny,
                  jednocześnie zachowując osobiste podejście, które czyni opiekę zdrowotną naprawdę
                  skuteczną.
                </p>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Our Values */}
        <section className="py-20 relative z-10 bg-transparent">
          <div className="container mx-auto px-4">
            <FadeIn direction="up" delay={0} threshold={0.2}>
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Nasze Wartości
                </h2>
                <p className="text-xl text-gray-600">
                  Zasady, którymi kierujemy się w codziennej pracy
                </p>
              </div>
            </FadeIn>
            <AnimatedGroup
              animation="scaleIn"
              staggerDelay={150}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {values.map((value, index) => (
                <Card
                  key={index}
                  className="text-center overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                  <CardHeader className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                      <value.icon className="h-8 w-8 text-white relative z-10" />
                    </div>
                    <CardTitle className="text-xl font-bold bg-clip-text text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">
                      {value.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </AnimatedGroup>
          </div>
        </section>

        {/* CTA Section */}
        <FadeIn direction="up" delay={0} threshold={0.3}>
          <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Doświadcz Różnicy w SPZOZ GOZ Łopuszno
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Dołącz do tysięcy zadowolonych pacjentów, którzy zaufali nam w kwestii opieki
                zdrowotnej.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
                asChild
              >
                <Link href="/kontakt">
                  <Calendar className="h-5 w-5 mr-2" />
                  Umów wizytę już dziś
                </Link>
              </Button>
            </div>
          </section>
        </FadeIn>
      </div>
    </LayoutWrapper>
  );
}
