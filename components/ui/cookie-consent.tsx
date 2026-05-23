'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X, Settings, Check } from 'lucide-react';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="border border-white/40 shadow-[0_-10px_40px_-15px_rgba(59,130,246,0.3)] bg-white/80 backdrop-blur-xl rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent pointer-events-none z-0"></div>
        <CardContent className="p-6 relative z-10">
          {!showSettings ? (
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Używamy plików cookie</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ta strona używa plików cookie, aby zapewnić najlepsze doświadczenia użytkownika.
                    Niektóre są niezbędne do funkcjonowania strony, inne pomagają nam analizować
                    ruch i personalizować treści.{' '}
                    <Link
                      href="/polityka-prywatnosci"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Dowiedz się więcej
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-blue-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ustawienia
                </Button>
                <Button
                  variant="outline"
                  onClick={rejectAll}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-blue-300"
                >
                  Odrzuć wszystkie
                </Button>
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-4 focus:ring-blue-300"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Akceptuj wszystkie
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Ustawienia plików cookie</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Niezbędne</h4>
                    <p className="text-sm text-gray-600">
                      Te pliki cookie są niezbędne do funkcjonowania strony internetowej
                    </p>
                  </div>
                  <div className="text-green-600 font-semibold">Zawsze aktywne</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Analityczne</h4>
                    <p className="text-sm text-gray-600">
                      Pomagają nam zrozumieć, jak odwiedzający korzystają z naszej strony
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={e =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-gray-900">Marketingowe</h4>
                    <p className="text-sm text-gray-600">
                      Używane do wyświetlania spersonalizowanych reklam i treści
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={e =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={rejectAll}
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-4 focus:ring-blue-300"
                >
                  Odrzuć wszystkie
                </Button>
                <Button
                  onClick={acceptSelected}
                  className="bg-blue-600 hover:bg-blue-700 text-white focus:ring-4 focus:ring-blue-300"
                >
                  Zapisz ustawienia
                </Button>
                <Button
                  onClick={acceptAll}
                  className="bg-green-600 hover:bg-green-700 text-white focus:ring-4 focus:ring-green-300"
                >
                  Akceptuj wszystkie
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
