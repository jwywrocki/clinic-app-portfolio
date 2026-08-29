export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  // Primary specialization ID kept for backward compatibility.
  specialization: string;
  // Full list of specialization IDs assigned to the doctor.
  specialization_ids?: string[];
  // Optional denormalized label used by views.
  specialization_name?: string;
  specialization_names?: string[];
  bio?: string;
  image_url?: string;
  schedule: string;
  is_active: boolean;
  order_position: number;
  page_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorSpecializationLink {
  id: string;
  doctor_id: string;
  specialization_id: string;
}
