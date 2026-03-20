# No Heart Left Behind — Counseling Booking App

Faith-based counseling intake, scheduling, and love offering platform built on Next.js, Vercel, Supabase, Stripe, and Resend.

---

## Stack

| Layer | Service |
|-------|---------|
| Framework | Next.js 15 (App Router) |
| Hosting | Vercel |
| Database + Auth | Supabase (Postgres + RLS) |
| Payments | Stripe (PaymentIntents, custom amount) |
| Email | Resend (React Email templates) |

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo>
cd nhlb
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Copy your **service_role key** (keep this secret — server-side only)
4. Run the migration in the Supabase SQL editor:

```sql
-- paste contents of supabase/migrations/001_initial.sql
```

### 3. Configure Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Copy your **Publishable key** and **Secret key**
3. For the webhook:
   - Add endpoint: `https://yourdomain.com/api/webhook`
   - Events to listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Signing secret** (`whsec_...`)

### 4. Configure Resend

1. Go to [resend.com](https://resend.com) → API Keys → Create
2. Add and verify your sending domain (e.g. `noheartleftbehind.com`)
3. Update `RESEND_FROM_EMAIL` in `.env.local`

### 5. Set environment variables

```bash
cp .env.local.example .env.local
# Fill in all values
```

### 6. Run locally

```bash
npm run dev
# Booking flow:   http://localhost:3000/booking
# Admin dashboard: http://localhost:3000/admin
```

For local Stripe webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Routes

| Route | Description |
|-------|-------------|
| `/booking` | 4-step client booking flow |
| `/admin` | Admin dashboard — view, confirm, cancel bookings |
| `POST /api/bookings` | Create client + booking, fire confirmation emails |
| `GET /api/availability` | Return booked slots for a counselor |
| `POST /api/payment` | Create Stripe PaymentIntent for love offering |
| `POST /api/webhook` | Stripe webhook — mark donations succeeded |
| `GET /api/admin` | List bookings (filterable by status) |
| `PATCH /api/admin` | Update booking status |

---

## Booking flow (4 steps)

1. **Intake** — name, email, phone, service type (individual / marriage / family), brief reason
2. **Counselor** — choose from active counselors loaded from Supabase
3. **Schedule** — pick from available hourly slots (Mon–Fri, 9am–5pm) over the next 14 days. Already-booked slots are greyed out in real time.
4. **Love offering** — enter any amount ($0 is valid and gracefully handled). Pre-set suggestions: Skip / $15 / $25 / $50 / $75. Custom amount supported. Stripe PaymentElement handles card collection securely.

---

## Admin dashboard

Visit `/admin` to:
- View all bookings filtered by status (pending / confirmed / completed / all)
- See client name, contact, service type, requested counselor, and their stated reason
- One-click **Confirm**, **Mark complete**, or **Cancel**

> **Security note**: The admin route is currently open. Before going live, add Supabase Auth or a simple secret-header middleware to protect `/admin` and `/api/admin`.

---

## Adding admin auth (recommended before launch)

The simplest approach is a Supabase Auth magic link:

```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  return <>{children}</>
}
```

---

## Data model

```
counselors         — id, name, title, bio, specialties[], is_active
availability_slots — counselor_id, day_of_week, start_time, end_time
clients            — id, first_name, last_name, email, phone, service_type, brief_reason
bookings           — id, client_id, counselor_id, scheduled_at, status, notes
donations          — id, booking_id, client_id, amount_cents, stripe_payment_intent_id, stripe_status, message, is_anonymous
```

---

## Email templates

Located in `/emails/`:

- `BookingConfirmation.tsx` — sent to client after booking. Includes date, time, counselor name, office address.
- `CounselorNotification.tsx` — sent to admin after each booking. Includes full client details and stated reason.

Both use [React Email](https://react.email/) components and are rendered server-side by Resend.
