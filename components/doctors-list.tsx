'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope } from 'lucide-react';
import { sanitizeHtml } from '@/lib/html-sanitizer';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  specialization_ids?: string[];
  specialization_name?: string;
  specialization_names?: string[];
  bio?: string;
  schedule?: string;
  is_active: boolean;
  order_position?: number;
}

interface DoctorsListProps {
  specializationIds?: string[];
  className?: string;
}

export function DoctorsList({ specializationIds, className = '' }: DoctorsListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/doctors');
        if (response.ok) {
          const json = await response.json();
          const doctorsData = json.data ?? json;

          let filteredDoctors = Array.isArray(doctorsData)
            ? doctorsData.filter((d: any) => d.is_active !== false)
            : [];

          if ((specializationIds?.length || 0) > 0) {
            filteredDoctors = filteredDoctors.filter(
              (doctor: any) =>
                Array.isArray(doctor.specialization_ids) &&
                doctor.specialization_ids.some((id: string) => specializationIds!.includes(id))
            );
          }

          setDoctors(filteredDoctors);
        } else {
          console.error('Error fetching doctors list:', response.statusText);
        }
      } catch (error) {
        console.error('Error in fetchDoctors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specializationIds]);

  if (loading) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Ładowanie informacji o lekarzach...</p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-xl text-gray-500">
          {(specializationIds?.length || 0) > 0
            ? 'Brak lekarzy dla wybranych specjalizacji.'
            : 'Obecnie nie ma dostępnych informacji o lekarzach.'}{' '}
          Prosimy spróbować później.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {doctors.map(doctor => (
        <Card
          key={doctor.id}
          className="group transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-white/40 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.2)] bg-white/70 backdrop-blur-md rounded-2xl hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] hover:bg-white/80"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center">
              {doctor.first_name} {doctor.last_name}
              <Badge
                variant="secondary"
                className="m-2 mt-2 bg-blue-100/50 backdrop-blur-sm text-blue-700 text-center border border-blue-200/50"
              >
                {doctor.specialization_names?.join(', ') ||
                  doctor.specialization_name ||
                  doctor.specialization}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-gray-600 line-clamp-3">
              {doctor.bio || 'Doświadczony specjalista w swojej dziedzinie.'}
            </p>
            {doctor.schedule && (
              <div
                className="text-sm text-gray-500 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(doctor.schedule) }}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
