export type ServiceType = 'individual' | 'marriage' | 'family'
export type SessionFormat = 'in_person' | 'virtual'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Counselor {
  id: string
  name: string
  title: string
  bio: string | null
  photo_url: string | null
  specialties: string[]
  is_active: boolean
  created_at: string
}

export interface AvailabilitySlot {
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
  service_type: ServiceType
  brief_reason: string | null
  created_at: string
}

export interface Booking {
  id: string
  client_id: string
  counselor_id: string
  scheduled_at: string
  duration_minutes: number
  session_format: SessionFormat
  status: BookingStatus
  meeting_link: string | null
  meeting_id: string | null
  meeting_passcode: string | null
  notes: string | null
  created_at: string
  client?: Client
  counselor?: Counselor
}

export interface Donation {
  id: string
  booking_id: string | null
  client_id: string | null
  amount_cents: number
  stripe_payment_intent_id: string | null
  stripe_status: string
  message: string | null
  is_anonymous: boolean
  created_at: string
}

export interface BookingFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  service_type: ServiceType
  session_format: SessionFormat
  brief_reason: string
  counselor_id: string
  scheduled_at: string
  donation_amount: number | null
  donation_message: string
  is_anonymous: boolean
}

export type BookingStep = 1 | 2 | 3 | 4
