import { PagesService } from '@/lib/services/pages';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { DoctorsList } from '@/components/doctors-list';

export default async function DoctorsPage() {
  const pageContent = await PagesService.getPublishedBySlug('lekarze');

  return (
    <LayoutWrapper>
      <div
        id="main-content"
        className="relative z-10 bg-transparent flex flex-col flex-grow h-full"
      >
        <div className="flex-grow">
          <AnimatedSection animation="fadeInUp">
            <section className="py-20 relative bg-transparent">
              <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                    Nasz Zespół
                  </span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
                  {pageContent?.title || 'Poznaj Naszych Lekarzy'}
                </h1>
                <div
                  className="text-xl text-gray-600 max-w-3xl mx-auto prose prose-xl max-w-none text-center"
                  dangerouslySetInnerHTML={{
                    __html:
                      pageContent?.content ||
                      'W SPZOZ GOZ Łopuszno pracuje zespół wykwalifikowanych i doświadczonych lekarzy różnych specjalizacji, gotowych nieść pomoc i zapewnić najlepszą opiekę medyczną.',
                  }}
                />
              </div>
            </section>
          </AnimatedSection>

          <AnimatedSection animation="fadeInUp" delay={200}>
            <section className="py-10 relative z-10 bg-transparent">
              <div className="container mx-auto px-4">
                <DoctorsList specializationIds={pageContent?.specialization_ids || []} />
              </div>
            </section>
          </AnimatedSection>
        </div>

        <section className="py-20 mt-auto bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Chcesz umówić wizytę?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Nasi specjaliści są do Twojej dyspozycji. Skontaktuj się z rejestracją, aby ustalić
              dogodny termin.
            </p>
            <Button
              className="group relative bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              asChild
            >
              <Link href="/kontakt#formularz">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-200/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                <span className="relative z-10 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Umów się na wizytę
                </span>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </LayoutWrapper>
  );
}
