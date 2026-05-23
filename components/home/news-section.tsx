'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { sanitizeHtml } from '@/lib/html-sanitizer';

interface NewsArticle {
  id: number | string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: string | null;
}

export function NewsSection() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Fetch failed');
        const allNews = await res.json();
        if (Array.isArray(allNews)) {
          setNews(allNews.slice(0, 3));
        } else {
          setNews([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching news for NewsSection:', err);
        setError('Nie udało się załadować aktualności.');
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

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
    <section className="py-20 relative bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide">
                AKTUALNOŚCI
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
              Najnowsze informacje
            </h2>
          </div>
        </AnimatedSection>

        {isLoading && (
          <div className="text-center py-10">
            <p>Ładowanie aktualności...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 text-red-600">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && news.length > 0 && (
          <div className="space-y-8 mb-12 max-w-7xl mx-auto">
            {news.map((item, index) => (
              <AnimatedSection key={item.id} animation="fadeInUp" delay={index * 150}>
                <Card className="group transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
                  {item.image_url && (
                    <div className="relative overflow-hidden h-48 w-full">
                      <Image
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 line-clamp-2">
                      {item.title}
                    </h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 mb-4"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
                    />
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        )}

        {!isLoading && !error && news.length === 0 && (
          <AnimatedSection animation="fadeInUp">
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-16 w-16 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Brak aktualności</h2>
                <p className="text-gray-600">Obecnie nie ma nowych informacji do wyświetlenia.</p>
              </div>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection animation="fadeInUp" delay={news.length > 0 ? news.length * 150 : 150}>
          <div className="text-center">
            <Button
              asChild
              className="group relative bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <Link href="/aktualnosci">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                <span className="relative z-10 flex items-center">
                  Zobacz wszystkie aktualności
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
