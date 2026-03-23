# No Heart Left Behind — Counseling & Client Management Platform

Faith-based counseling intake, scheduling, love offering, event management, and client tracking platform.

> *"As a man thinks in his heart, so is he."* — Proverbs 23:7

---

## Tech Stack

| Layer | Service |
|-------|---------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Hosting | Vercel |
| Database & Auth | Supabase (Postgres, RLS, Auth, Storage) |
| Payments | Stripe (PaymentIntents, custom amounts) |
| Email | Resend (dev) / AWS SES (prod) + React Email (templated, ICS calendar attachments) |
| Validation | Zod |
| Styling | Custom CSS variables (NHLB brand system) |

---

## Features at a Glance

### Client Booking Flow
- New and returning client paths with session-aware auto-login
- Counselor availability grid (9 AM – 5 PM Central, Mon–Fri)
- Returning clients locked to their assigned counselor
- Love offering (donation) collection via Stripe
- HIPAA intake form sent automatically after first session
- Booking confirmation + ICS calendar file emailed to client and counselor
- Online cancellation (24-hour policy enforced; call-in required within 24 hrs)
- Forgot password / password reset for client accounts

### Admin Portal (`/admin/bookings`)
- **Sessions** — Calendar (week/month) and list views with counselor color coding; complete sessions with notes and confirmation toast
- **Clients** — Full client list with search across name, email, HIPAA data, and session notes; view/edit client details; reassign counselors
- **Counselors** — Manage counselor profiles, create login accounts, upload photos, set Zoom meeting details
- **Events** — Create/edit events with photos, custom fields, registration fees, capacity limits; manage attendees; CSV export
- **Donations** — View all donations by fund category; CSV export for taxes
- **Reports** — Financial summaries by fund, monthly trends, per-counselor revenue with filters and CSV export

### Counselor Portal (`/counselor`)
- **My Schedule** — Week/list calendar views; today's sessions and upcoming overview; complete/cancel sessions; add session notes (public + private)
- **My Clients** — Client list with search (including session notes search); client detail with HIPAA intake, session history, and inline note editing
- **My Profile** — Edit name, title, bio, contact, Zoom details; upload/remove profile photo
- **Availability & Time Off** — Set weekly recurring hours; block specific dates

### Events System (`/events`)
- Public event listing with banner images
- Event detail/registration page with custom fields
- Stripe payment for paid events
- Admin management with photo upload, attendee tracking, CSV export

### Donation Page (`/donate`)
- Standalone donation page with fund category selection
- Stripe payment processing

### Email Notifications
- **Session Confirmation** — Client receives session details + ICS calendar file
- **Counselor Notification** — Counselor + admin receive new session alert + ICS file
- **Counselor Assignment** — Client notified when assigned or reassigned to a counselor (includes counselor photo, bio, Zoom details, upcoming sessions)
- **Virtual Session Info** — Zoom join details for virtual sessions
- **HIPAA Intake** — Secure link to complete intake form
- **All emails** include NHLB branding and Proverbs 23:7 footer

---

## Data Model

```
counselors
  id, name, title, bio, photo_url, email, phone, zoom_link, zoom_meeting_id,
  zoom_passcode, specialties[], is_active, supabase_user_id

counselor_availability
  id, counselor_id, day_of_week, start_time, end_time, is_active

counselor_blocked_dates
  id, counselor_id, blocked_date, start_time, end_time, reason

clients
  id, first_name, last_name, email, phone, service_type, brief_reason,
  assigned_counselor_id, supabase_user_id, stripe_customer_id

bookings
  id, client_id, counselor_id, scheduled_at, duration_minutes, type (IN_PERSON/VIRTUAL),
  status (CONFIRMED/CANCELLED/COMPLETED), donation_amount_cents, stripe_payment_id, notes

session_notes
  id, booking_id, counselor_id, content, private_notes

hipaa_intakes
  id, client_id, token, completed_at, form_data (JSONB)

events
  id, title, description, event_date, end_date, location, registration_fee_cents,
  fee_label, max_capacity, is_active, image_url, custom_fields (JSONB)

event_registrations
  id, event_id, first_name, last_name, email, phone, custom_data (JSONB),
  amount_paid_cents, stripe_payment_id, status

donations
  id, booking_id, client_id, event_id, amount_cents, stripe_payment_intent_id,
  stripe_status, fund (COUNSELING/OPERATIONS/EVENTS/GENERAL),
  donor_name, donor_email, message, is_anonymous
```

---

## Project Structure

```
├── emails/                          # React Email templates
│   ├── BookingConfirmation.tsx
│   ├── CounselorAssignment.tsx
│   ├── CounselorNotification.tsx
│   ├── HipaaIntakeEmail.tsx
│   └── VirtualSessionInfo.tsx
├── src/
│   ├── app/
│   │   ├── admin/                   # Admin portal
│   │   │   ├── bookings/            # Sessions, clients, counselors
│   │   │   ├── donations/           # Donation management
│   │   │   ├── events/              # Event management
│   │   │   └── reports/             # Financial reports
│   │   ├── api/                     # API routes
│   │   │   ├── auth/                # Client session, account creation, callbacks
│   │   │   ├── booking/             # Availability, create, update bookings
│   │   │   ├── clients/             # Client CRUD + notes
│   │   │   ├── counselor/           # Counselor self-service APIs
│   │   │   ├── counselors/          # Admin counselor management
│   │   │   ├── donations/           # Donation listing + export
│   │   │   ├── events/              # Event CRUD + registrations + photos
│   │   │   ├── intake/              # HIPAA intake form submission
│   │   │   ├── reports/             # Financial report data + CSV export
│   │   │   └── stripe/              # Payment intents + webhook
│   │   ├── auth/                    # Password reset callback + new password page
│   │   ├── book/                    # Client booking flow
│   │   │   ├── BookLanding.tsx      # Session-aware landing with auto-login
│   │   │   ├── new/                 # New client booking
│   │   │   ├── returning/           # Returning client booking
│   │   │   ├── confirmation/        # Post-booking confirmation
│   │   │   ├── cancel/              # Online cancellation
│   │   │   └── forgot-password/     # Client password reset
│   │   ├── counselor/               # Counselor portal
│   │   │   ├── clients/             # Client list + detail pages
│   │   │   ├── profile/             # Self-service profile editing
│   │   │   ├── availability/        # Weekly hours + blocked dates
│   │   │   ├── login/               # Counselor sign-in
│   │   │   └── forgot-password/     # Counselor password reset
│   │   ├── donate/                  # Public donation page
│   │   ├── events/                  # Public event pages
│   │   └── intake/                  # HIPAA intake form
│   ├── components/
│   │   ├── admin/AdminNav.tsx       # Shared admin navigation
│   │   ├── counselor/CounselorNav.tsx # Shared counselor navigation
│   │   └── booking/                 # Booking flow components
│   ├── lib/
│   │   ├── supabase.ts              # Server + admin Supabase clients
│   │   ├── supabase-browser.ts      # Browser Supabase client
│   │   ├── email.ts                 # Provider-agnostic email (Resend / AWS SES)
│   │   └── ics.ts                   # ICS calendar file generation
│   └── types/index.ts               # TypeScript interfaces
└── supabase/
    └── migrations/                  # Idempotent SQL migration scripts
        ├── 000_full_idempotent.sql  # Complete schema (run on fresh DB)
        ├── 001_initial.sql
        ├── 002_new_architecture.sql
        ├── 003_events_donations_funds.sql
        ├── 004_counselor_calendar.sql
        ├── 005_assigned_counselor.sql
        └── 006_zoom_details.sql
```

---

## API Routes

### Booking
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/booking/availability` | Available time slots (filterable by counselor, new/returning) |
| POST | `/api/booking/create` | Create client + booking, send confirmation emails |
| PATCH | `/api/booking/[bookingId]` | Update status (confirm, complete, cancel with 24-hr rule) |

### Clients
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/clients` | List/search clients (name, email, HIPAA data, session notes) |
| GET | `/api/clients/[clientId]` | Client detail + bookings + HIPAA intake |
| PATCH | `/api/clients/[clientId]` | Update client info or reassign counselor (triggers email) |
| GET/POST | `/api/clients/[clientId]/notes` | Admin session notes CRUD |

### Counselors (Admin)
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/counselors` | List or create counselors |
| PATCH/DELETE | `/api/counselors/[counselorId]` | Update or delete counselor |
| POST/DELETE | `/api/counselors/[counselorId]/photo` | Upload or remove counselor photo |
| POST | `/api/counselors/create-login` | Create Supabase auth account for counselor |
| GET/POST | `/api/counselors/[counselorId]/availability` | Manage weekly availability slots |

### Counselor Self-Service
| Method | Route | Description |
|--------|-------|-------------|
| GET/PATCH | `/api/counselor/me` | Get or update own profile |
| POST/DELETE | `/api/counselor/photo` | Upload or remove own photo |
| GET | `/api/counselor/schedule` | Fetch own bookings (with session notes + previous notes) |
| GET/POST | `/api/counselor/notes` | Manage session notes (includes private notes) |
| GET/POST/DELETE | `/api/counselor/blocked-dates` | Manage time-off dates |
| GET | `/api/counselor/clients` | List assigned clients (with notes search) |
| GET | `/api/counselor/clients/[clientId]` | Client detail scoped to counselor |

### Events
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/events` | List or create events |
| GET/PATCH/DELETE | `/api/events/[eventId]` | Event detail, update, or delete |
| POST/DELETE | `/api/events/[eventId]/photo` | Upload or remove event image |
| GET/POST | `/api/events/[eventId]/registrations` | List or create registrations |
| GET | `/api/events/[eventId]/registrations/export` | CSV export of attendees |

### Donations & Reports
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/donations` | List donations (filterable by fund) |
| GET | `/api/donations/export` | CSV export for taxes |
| GET | `/api/reports` | Aggregated financial data (by fund, counselor, month) |
| GET | `/api/reports/export` | CSV export of report data |

### Auth & Payments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/client-session` | Check active client session + assigned counselor |
| POST | `/api/auth/create-account` | Create client login account |
| POST | `/api/stripe/create-payment-intent` | Create Stripe payment intent |
| POST | `/api/stripe/webhook` | Stripe webhook handler |
| GET/POST | `/api/intake/[token]` | HIPAA intake form fetch/submit |

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `profile_image` | Counselor profile photos | Public |
| `events` | Event banner images | Public |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd nhlb
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/000_full_idempotent.sql` in the SQL editor
3. Create storage buckets: `profile_image` and `events` (both public)
4. Copy your **Project URL**, **anon key**, and **service_role key**

### 3. Set up Stripe

1. Get keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Add webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 4. Set up Email

The email system supports two providers — controlled by `EMAIL_PROVIDER`:

| Environment | Provider | Variable |
|-------------|----------|----------|
| Development | Resend | `EMAIL_PROVIDER=resend` |
| Production | AWS SES (HIPAA-eligible) | `EMAIL_PROVIDER=ses` |

**Development (Resend):**
1. Create API key at [resend.com](https://resend.com)
2. Verify your sending domain
3. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

**Production (AWS SES):**
1. Verify sending domain in AWS SES → Verified Identities
2. Request production access (removes sandbox restrictions)
3. Sign BAA through AWS Artifact for HIPAA compliance
4. Set `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY`, `AWS_SES_SECRET_KEY`, `SES_FROM_EMAIL`

All email logic lives in `src/lib/email.ts`. No route handler ever imports a provider SDK directly.

### 5. Environment variables

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email provider: 'resend' (development) | 'ses' (production)
EMAIL_PROVIDER=resend

# Resend (development only)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@noheartleftbehind.com

# AWS SES (production only — leave blank in development)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=
AWS_SES_SECRET_KEY=
SES_FROM_EMAIL=bookings@noheartleftbehind.com

# Shared
ADMIN_EMAIL=admin@noheartleftbehind.com
```

### 6. Run locally

```bash
npm run dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/book` | Client booking flow |
| `http://localhost:3000/admin/bookings` | Admin portal |
| `http://localhost:3000/counselor/login` | Counselor portal |
| `http://localhost:3000/events` | Public events |
| `http://localhost:3000/donate` | Public donation page |

For local Stripe webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in **Vercel → Settings → Environment Variables**.

Set `NEXT_PUBLIC_BASE_URL` to your production URL (e.g. `https://nhlb.vercel.app`).

---

## Key Business Rules

- **Session hours**: 9 AM – 5 PM Central Time (America/Chicago), Mon–Fri
- **Phone required**: Clients must provide a phone number when scheduling
- **Assigned counselor**: On first booking, the client is assigned to a counselor. Returning clients can only book with their assigned counselor.
- **Cancellation policy**: Clients can cancel online up to 24 hours before a session. Within 24 hours, they must call 985-264-8808.
- **Counselor reassignment**: Admin can reassign a client's counselor — all future confirmed sessions are moved to the new counselor, and the client receives an email notification.
- **Fund tracking**: Donations are categorized into Counseling, Operations, Events, and General Fund for financial reporting.
- **Session notes privacy**: Counselors have a "private notes" field visible only to them, separate from notes visible to admins.
- **HIPAA compliance**: Client health data is stored encrypted in Supabase with RLS policies. Intake forms use secure token-based links.
- **Email PHI rules**: No email subject line contains client name, service type, or `brief_reason`. `brief_reason` never appears in any email body. Booking references use truncated IDs only.
- **Email provider switching**: Set `EMAIL_PROVIDER=ses` and add SES credentials to switch to production. No code changes needed.

---

## Contact

**No Heart Left Behind**
430 N. Jefferson Ave, Covington, LA 70433
985-264-8808 · reconnectus@yahoo.com
[noheartleftbehind.com](https://www.noheartleftbehind.com)
