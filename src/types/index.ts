export type BookingType = 'IN_PERSON' | 'VIRTUAL'
export type BookingStatus =
  | 'requested'
  | 'call_pending'
  | 'call_complete'
  | 'confirmed'
  | 'in_session'
  | 'completed'
  | 'cancelled'

export type RecurrencePattern = 'weekly' | 'biweekly' | 'monthly'

export const ACTIVE_STATUSES: BookingStatus[] = [
  'requested',
  'call_pending',
  'call_complete',
  'confirmed',
  'in_session',
]

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested:     ['call_pending', 'cancelled'],
  call_pending:  ['call_complete', 'cancelled'],
  call_complete: ['confirmed', 'cancelled'],
  confirmed:     ['in_session', 'cancelled'],
  in_session:    ['completed', 'cancelled'],
  completed:     [],
  cancelled:     [],
}

export interface Counselor {
  id: string
  name: string
  title: string
  bio: string | null
  photo_url: string | null
  email: string | null
  phone: string | null
  zoom_link: string | null
  zoom_meeting_id: string | null
  zoom_passcode: string | null
  specialties: string[]
  is_active: boolean
  supabase_user_id: string | null
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
  assigned_counselor_id: string | null
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
  pre_call_notes: string | null
  session_notes: string | null
  call_completed_at: string | null
  call_completed_by: string | null
  is_recurring: boolean
  recurrence_pattern: RecurrencePattern | null
  recurrence_end_date: string | null
  parent_booking_id: string | null
  series_index: number
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
  counselorPhotoUrl?: string | null
}

export interface CounselorBlockedDate {
  id: string
  counselor_id: string
  blocked_date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
  created_at: string
}

// ── Events ──

export interface Event {
  id: string
  title: string
  description: string | null
  event_date: string
  end_date: string | null
  location: string | null
  registration_fee_cents: number
  fee_label: string
  max_capacity: number | null
  is_active: boolean
  is_published: boolean
  slug: string | null
  image_url: string | null
  custom_fields: EventCustomField[]
  registration_opens_at: string | null
  registration_closes_at: string | null
  min_capacity: number | null
  cancellation_deadline: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  min_check_sent_at: string | null
  created_at: string
  registration_count?: number
}

export interface EventCustomField {
  name: string
  label: string
  type: 'text' | 'select' | 'checkbox'
  required?: boolean
  options?: string[]
}

export type EventRegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'

export interface EventRegistration {
  id: string
  event_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  custom_data: Record<string, string | boolean>
  amount_paid_cents: number
  stripe_payment_id: string | null
  status: EventRegistrationStatus
  refunded_at: string | null
  refund_amount_cents: number | null
  stripe_refund_id: string | null
  created_at: string
  event?: Event
}

// ── Donations & fund tracking ──

export type Fund = 'COUNSELING' | 'OPERATIONS' | 'EVENTS' | 'GENERAL'

export interface Donation {
  id: string
  booking_id: string | null
  client_id: string | null
  event_id: string | null
  amount_cents: number
  stripe_payment_intent_id: string | null
  stripe_status: string
  fund: Fund
  donor_name: string | null
  donor_email: string | null
  message: string | null
  is_anonymous: boolean
  created_at: string
}

export const FUND_LABELS: Record<Fund, string> = {
  COUNSELING: 'Counseling Services',
  OPERATIONS: 'Ministry Operations',
  EVENTS: 'Events',
  GENERAL: 'General Fund',
}

export const FUND_COLORS: Record<Fund, { bg: string; text: string }> = {
  COUNSELING: { bg: '#D1FAE5', text: '#065F46' },
  OPERATIONS: { bg: '#DBEAFE', text: '#1E40AF' },
  EVENTS: { bg: '#FEF3C7', text: '#92400E' },
  GENERAL: { bg: '#F3E8FF', text: '#6B21A8' },
}
