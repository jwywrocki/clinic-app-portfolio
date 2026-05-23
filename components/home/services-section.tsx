'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/ui/animated-section';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { sanitizeHtml } from '@/lib/html-sanitizer';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

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

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const servicesData = await response.json();
          // Take first 6 published services for home page
          setServices((servicesData || []).slice(0, 6));
        } else {
          console.error('Error fetching services:', response.statusText);
        }
      } catch (error) {
        console.error('Error in fetchServices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie usług...</p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-20 relative bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl -z-10"></div>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 shadow-sm rounded-full mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold tracking-wide">
                NASZE SPECJALIZACJE
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 drop-shadow-sm">
              Kompleksowa opieka medyczna
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Oferujemy szeroki zakres usług medycznych w nowoczesnych warunkach. Nasz zespół
              doświadczonych specjalistów zapewnia najwyższą jakość opieki zdrowotnej.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => {
            const iconEmoji = getIconEmoji(service.icon);

            return (
              <AnimatedSection key={service.id} animation="fadeInUp" delay={index * 100}>
                <Card className="group transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80 h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
                  <CardContent className="p-8 h-full flex flex-col relative z-10">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-md group-hover:shadow-blue-500/40 group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <span className="text-3xl relative z-10 drop-shadow-md">{iconEmoji}</span>
                      </div>
                      <h3 className="text-xl font-bold bg-clip-text text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 flex-1">
                        {service.title}
                      </h3>
                    </div>
                    <div
                      className="text-gray-600 leading-relaxed prose prose-sm max-w-none flex-1"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(service.description) }}
                    />
                  </CardContent>
                </Card>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection animation="fadeInUp" delay={600}>
          <div className="text-center">
            <Button
              asChild
              className="group relative bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto text-base font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <Link href="/uslugi">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                <span className="relative z-10 flex items-center">
                  Zobacz wszystkie usługi
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
