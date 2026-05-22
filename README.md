# Timeless Media Studio

A modern, full-stack booking and payment system for photography/video services built with Next.js, Supabase, and Paymongo.

## 🚀 Features

- **Booking System**: Interactive booking form with email confirmations
- **Calendar Date Picker**: Visual calendar with availability tracking
- **Max 5 Bookings Per Date**: Fully booked dates are automatically grayed out
- **Payment Integration**: GCash and Maya payments via Paymongo
- **Booking Tracker**: Track and update bookings with confirmation numbers
- **Email Confirmations**: Automated booking confirmation emails
- **Admin Panel**: Manage bookings and track payments
- **Responsive Design**: Works on desktop, tablet, and mobile

## 📋 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Payments**: Paymongo (GCash, Maya)
- **Email**: Gmail SMTP
- **Hosting**: Vercel (recommended)

## 🛠️ Prerequisites

- Node.js 18+ and npm
- GitHub account
- Vercel account (free)
- Supabase account (free)
- Paymongo account (free test tier)

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Tres29/timeless-media-studio.git
cd timeless-media-studio

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

## 🏃 Local Development

```bash
npm run dev
# Open http://localhost:3000
```

## 📤 Deploy to Vercel

1. Push to GitHub: `git push origin main`
2. Go to https://vercel.com/dashboard
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Add environment variables in Settings → Environment Variables:
   - `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY`
   - `PAYMONGO_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Redeploy"

## 📁 Project Structure

```
app/                  # Next.js app directory
├── (marketting)/     # Public routes
│   ├── contact/      # Booking form
│   └── api/          # API endpoints
├── admin/            # Admin panel
└── about/            # About page

components/           # React components
├── BookingCalendar.tsx
├── PaymentComponent.tsx
└── ui/

lib/                  # Utilities
├── payment-*.ts      # Payment utilities
├── email/            # Email functions
└── supabase/         # Database

public/               # Static assets
sections/             # Page sections
```

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```
# Paymongo
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_SECRET_KEY=sk_test_xxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

**⚠️ Never commit `.env.local` to GitHub**

## 🔗 Links

- [Paymongo Dashboard](https://dashboard.paymongo.com)
- [Supabase Console](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Next.js Docs](https://nextjs.org/docs)

## 📝 License

Private and confidential.

