'use client';

import type React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function ContactForm() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus(null);

    // Client-side validation
    if (!formState.name || !formState.email || !formState.subject || !formState.message) {
      setFormStatus({ type: 'error', message: 'Wszystkie pola są wymagane.' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formState.email)) {
      setFormStatus({ type: 'error', message: 'Proszę podać prawidłowy adres email.' });
      return;
    }

    try {
      setFormStatus({ type: 'success', message: 'Wysyłanie wiadomości...' });

      const response = await fetch('/api/contact/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({
          type: 'success',
          message: data.message || 'Wiadomość wysłana pomyślnie! Skontaktujemy się wkrótce.',
        });
        setFormState({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus({
          type: 'error',
          message: data.error || 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie.',
        });
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setFormStatus({
        type: 'error',
        message:
          'Wystąpił błąd podczas wysyłania wiadomości. Sprawdź połączenie internetowe i spróbuj ponownie.',
      });
    }
  };

  return (
    <Card className="border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md relative overflow-hidden rounded-2xl group/form">
      {/* Decorative inner gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover/form:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-gray-800 font-bold mb-2 block">
              Imię i Nazwisko
            </Label>
            <Input
              type="text"
              name="name"
              id="name"
              value={formState.name}
              onChange={handleInputChange}
              required
              className="border-gray-200 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 py-6"
              placeholder="Wprowadź swoje imię i nazwisko"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-800 font-bold mb-2 block">
              Adres Email
            </Label>
            <Input
              type="email"
              name="email"
              id="email"
              value={formState.email}
              onChange={handleInputChange}
              required
              className="border-gray-200 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 py-6"
              placeholder="twoj@email.com"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="subject" className="text-gray-800 font-bold mb-2 block">
            Temat
          </Label>
          <Input
            type="text"
            name="subject"
            id="subject"
            value={formState.subject}
            onChange={handleInputChange}
            required
            className="border-gray-200 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 py-6"
            placeholder="Krótko opisz temat wiadomości"
          />
        </div>
        <div>
          <Label htmlFor="message" className="text-gray-800 font-bold mb-2 block">
            Wiadomość
          </Label>
          <Textarea
            name="message"
            id="message"
            rows={5}
            value={formState.message}
            onChange={handleInputChange}
            required
            className="border-gray-200 bg-white/60 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-300 p-4 resize-none"
            placeholder="Opisz szczegółowo swoją sprawę..."
          />
        </div>
        {formStatus && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium ${
              formStatus.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center">
              {formStatus.type === 'success' ? (
                <Send className="h-4 w-4 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              {formStatus.message}
            </div>
          </div>
        )}
        <div>
          <Button
            type="submit"
            className="w-full group relative bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
            <span className="relative z-10 flex items-center">
              <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Wyślij Wiadomość
            </span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
