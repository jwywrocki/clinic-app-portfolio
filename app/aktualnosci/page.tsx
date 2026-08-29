import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { createNewsService } from '@/services';
import Image from 'next/image';
import { sanitizeHtml } from '@/lib/html-sanitizer';

export default async function NewsPage() {
  let news: any[] = [];

  try {
    const newsService = createNewsService();
    const allNews = await newsService.getPublished();
    if (allNews.isFailure()) {
      throw allNews.error;
    }
    news = allNews.data;
  } catch (error) {
    console.error('Error fetching news:', error);
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Data nieznana';
    }
  };

  return (
    <LayoutWrapper>
      <div className="relative z-10 bg-transparent min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <AnimatedSection animation="fadeInUp">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide uppercase">
                  Aktualności
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-sm">
                Bądź na bieżąco
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Najnowsze informacje z naszej placówki medycznej
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-4xl mx-auto">
            {news && news.length > 0 ? (
              <div className="space-y-8">
                {news.map((article, index) => (
                  <AnimatedSection key={article.id} animation="fadeInUp" delay={index * 100}>
                    <Card className="group transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                      <div className="md:flex relative z-10">
                        {article.image_url && (
                          <div className="md:w-1/3">
                            <div className="relative h-48 md:h-full">
                              <Image
                                src={article.image_url || '/placeholder.svg'}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          </div>
                        )}
                        <div className={article.image_url ? 'md:w-2/3' : 'w-full'}>
                          <CardHeader>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(article.created_at)}</span>
                              </div>
                              {article.author && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>{article.author}</span>
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                              {article.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-base leading-relaxed">
                              {article.excerpt}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div
                              className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600 hover:prose-a:text-blue-800"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
                            />
                          </CardContent>
                        </div>
                      </div>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            ) : (
              <AnimatedSection animation="fadeInUp">
                <div className="text-center py-16">
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-12 border border-white/20">
                    <div className="text-blue-400 mb-4">
                      <Calendar className="h-16 w-16 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Brak aktualności</h2>
                    <p className="text-gray-600">
                      Obecnie nie ma opublikowanych aktualności. Sprawdź ponownie wkrótce.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}

export const metadata = {
  title: 'Aktualności | SPZOZ GOZ Łopuszno',
  description: 'Najnowsze informacje i aktualności z Gminnego Ośrodka Zdrowia w Łopusznie',
};
