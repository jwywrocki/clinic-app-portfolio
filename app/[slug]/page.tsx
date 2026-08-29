import { notFound } from 'next/navigation';
import { createPagesService } from '@/services';
import { NotFoundError } from '@/domain';
import { createSurveyService } from '@/services';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { SurveyWidget } from '@/components/survey-widget';
import { DoctorsList } from '@/components/doctors-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { sanitizeHtml } from '@/lib/html-sanitizer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const pagesService = createPagesService();
  const surveyService = createSurveyService();

  const systemRoutes = [
    'login',
    'admin',
    'api',
    '_next',
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
  ];

  if (systemRoutes.includes(slug)) {
    notFound();
  }

  const pageResult = await pagesService.getPublishedBySlug(slug);
  if (pageResult.isFailure()) {
    if (pageResult.error instanceof NotFoundError) {
      notFound();
    }
    throw pageResult.error;
  }

  const page = pageResult.data;

  // Pre-fetch survey data server-side if page has survey
  let surveyData = null;
  if (page.survey_id) {
    try {
      const surveyResult = await surveyService.getPublishedSurveyForPage(page.survey_id);
      if (!surveyResult.isFailure()) {
        surveyData = surveyResult.data;
      }
    } catch (error) {
      console.error('Error pre-fetching survey:', error);
    }
  }

  if ((page.specialization_ids?.length || 0) > 0) {
    return (
      <LayoutWrapper>
        <div className="relative z-10 bg-transparent flex flex-col flex-grow h-full">
          <div className="flex-grow">
            <AnimatedSection animation="fadeInUp">
              <section className="py-20 relative bg-transparent">
                <div className="container mx-auto px-4 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                      Nasz Zespół
                    </span>
                  </div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                    {page.title}
                  </h1>
                  <div
                    className="text-xl text-gray-600 max-w-3xl mx-auto prose prose-xl max-w-none text-center"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        page.content ||
                          'W SPZOZ GOZ Łopuszno pracuje zespół wykwalifikowanych i doświadczonych specjalistów, gotowych nieść pomoc i zapewnić najlepszą opiekę medyczną.'
                      ),
                    }}
                  />
                </div>
              </section>
            </AnimatedSection>

            <AnimatedSection animation="fadeInUp" delay={200}>
              <section className="py-10 relative z-10 bg-transparent">
                <div className="container mx-auto px-4">
                  <DoctorsList specializationIds={page.specialization_ids || []} />
                </div>
              </section>
            </AnimatedSection>

            {page.survey_id && surveyData && (
              <AnimatedSection animation="fadeInUp" delay={300}>
                <section className="py-10 relative z-10 bg-transparent">
                  <div className="container mx-auto px-4">
                    <SurveyWidget surveyId={page.survey_id} />
                  </div>
                </section>
              </AnimatedSection>
            )}
          </div>

          <AnimatedSection animation="fadeInUp" delay={400} className="mt-auto">
            <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  Chcesz umówić wizytę?
                </h2>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Nasi specjaliści są do Twojej dyspozycji. Skontaktuj się z rejestracją, aby
                  ustalić dogodny termin.
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
          </AnimatedSection>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="relative z-10 bg-transparent min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <AnimatedSection animation="fadeInUp">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{page.title}</h1>
                {page.meta_description && (
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">{page.meta_description}</p>
                )}
              </div>

              {page.content && (
                <AnimatedSection animation="fadeInUp" delay={200}>
                  <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_10px_40px_-15px_rgba(59,130,246,0.15)] p-8">
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                    />
                  </div>
                </AnimatedSection>
              )}

              {page.survey_id && (
                <AnimatedSection animation="fadeInUp" delay={400}>
                  <div className="mt-8">
                    <SurveyWidget surveyId={page.survey_id} preloadedSurvey={surveyData} />
                  </div>
                </AnimatedSection>
              )}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </LayoutWrapper>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const pagesService = createPagesService();

  try {
    const pageResult = await pagesService.getPublishedBySlug(slug);
    if (pageResult.isFailure()) {
      if (pageResult.error instanceof NotFoundError) {
        return {
          title: 'Strona nie znaleziona - GOZ Łopuszno',
          description: 'Strona, której szukasz, nie została znaleziona.',
        };
      }
      throw pageResult.error;
    }

    return {
      title: `${pageResult.data.title} - GOZ Łopuszno`,
      description: pageResult.data.meta_description || pageResult.data.title,
    };
  } catch (error) {
    return {
      title: 'Błąd - GOZ Łopuszno',
      description: 'Wystąpił błąd podczas ładowania strony.',
    };
  }
}
