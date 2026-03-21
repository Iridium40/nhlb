export type BookingType = 'IN_PERSON' | 'VIRTUAL'
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface Counselor {
  id: string
  name: string
  title: string
  bio: string | null
  photo_url: string | null
  email: string | null
  phone: string | null
  zoom_link: string | null
  specialties: string[]
  is_active: boolean
  created_at: string
}

export interface CounselorAvailability {
  id: string
  counselor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  service_type: string
  brief_reason: string | null
  supabase_user_id: string | null
  stripe_customer_id: string | null
  created_at: string
}

export interface Booking {
  id: string
  client_id: string
  counselor_id: string
  scheduled_at: string
  duration_minutes: number
  type: BookingType
  status: BookingStatus
  donation_amount_cents: number
  stripe_payment_id: string | null
  notes: string | null
  created_at: string
  client?: Client
  counselor?: Counselor
}

export interface SessionNote {
  id: string
  booking_id: string
  counselor_id: string
  content: string
  private_notes: string
  created_at: string
  updated_at: string
  booking?: Booking
  counselor?: Counselor
}

export interface HipaaIntake {
  id: string
  client_id: string
  token: string
  completed_at: string | null
  form_data: HipaaFormData
  created_at: string
}

export interface HipaaFormData {
  health_history?: string
  current_medications?: string
  allergies?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  consent_given?: boolean
}

export interface TimeSlot {
  start: string
  counselorId: string
  counselorName: string
}
