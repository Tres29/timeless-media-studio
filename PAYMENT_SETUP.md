# Payment Integration Setup Guide

## Overview

This project uses **Paymongo** for payment processing. Paymongo supports multiple payment methods including:
- 💳 **GCash** (e-wallet)
- 💳 **Maya** (e-wallet)
- 💳 **Credit/Debit Cards** (Visa, Mastercard)

### Why Paymongo?

✅ **Free Tier** - No setup fees, pay only per transaction
✅ **Philippine-Based** - Optimized for PH payment methods
✅ **Generous Limits** - Up to 1,000 transactions/month free
✅ **Easy Integration** - Simple REST API
✅ **Secure** - PCI DSS compliant

---

## Setup Instructions

### Step 1: Create Paymongo Account

1. Go to [paymongo.com](https://paymongo.com)
2. Click **Sign Up**
3. Fill in your business details:
   - Business Name: `Timeless Media Studio`
   - Email: Your business email
   - Phone: Your business phone
4. Verify your email
5. Complete KYC (Know Your Customer) verification

### Step 2: Get API Keys

1. Log in to [Paymongo Dashboard](https://dashboard.paymongo.com)
2. Go to **Settings** → **API Keys**
3. You'll see two keys:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

⚠️ **IMPORTANT:** Never share your Secret Key publicly!

### Step 3: Configure Environment Variables

Add these to `.env.local` in your project root:

```env
# Paymongo API Keys
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Your App URL (for payment redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app  # Production
```

### Step 4: Enable Payment Methods in Paymongo

1. Go to **Dashboard** → **Payment Methods**
2. Enable:
   - ✅ GCash
   - ✅ Maya
   - ✅ Credit/Debit Card (optional)

### Step 5: Setup Webhooks (Optional but Recommended)

For production, set up webhooks to track payment status:

1. Go to **Settings** → **Webhooks**
2. Add Webhook URL: `https://your-domain.vercel.app/api/webhooks/paymongo`
3. Events: `source.chargeable`

---

## Testing

### Test Mode (Sandbox)

All test keys start with `test_`. Use these credentials to test:

**GCash Test:**
- Phone: `09171234567`
- OTP: Any 6-digit number

**Maya Test:**
- Email: `test@paymongo.com`
- Password: `123456`

### Test Payment Flow

1. Go to your booking form
2. Fill in test details
3. Select GCash or Maya
4. Click "Pay"
5. Use test credentials above
6. Verify payment success page

---

## Production Deployment

### Before Going Live

1. ✅ Switch to **Live API Keys** in Paymongo dashboard
2. ✅ Update `.env` variables with live keys
3. ✅ Set `NEXT_PUBLIC_APP_URL` to your actual domain
4. ✅ Test with real transactions (small amounts)
5. ✅ Set up webhooks for payment notifications
6. ✅ Configure email confirmations with payment details

### Update Environment Variables

In **Vercel Dashboard**:

1. Go to **Settings** → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY = pk_live_xxxxxxxxxxxxx
   PAYMONGO_SECRET_KEY = sk_live_xxxxxxxxxxxxx
   NEXT_PUBLIC_APP_URL = https://your-domain.com
   ```
3. Redeploy application

---

## Integration Points

### 1. **Booking Form** (`/contact`)

Already integrated with `PaymentComponent`. After booking confirmation, users can:
- See payment summary
- Choose between GCash/Maya
- Process payment securely
- Receive email confirmation with payment details

### 2. **Admin Panel** (`/admin`)

Payment status will sync with booking status:
- `pending` → Payment not started
- `approved` → Payment verified
- `completed` → Order completed after payment
- `cancelled` → Payment failed/cancelled

### 3. **Payment Routes**

- `POST /api/payment/create-source` - Initiate payment
- `GET /api/payment/status?id=<sourceId>` - Check payment status
- `POST /api/webhooks/paymongo` - Handle payment callbacks (optional)

---

## Pricing Configuration

Edit [lib/payment-config.ts](../../lib/payment-config.ts) to adjust package prices:

```typescript
export const PACKAGE_PRICES: Record<string, number> = {
  'BASIC - VIDEOGRAPHY': 5000,
  'ELITE - VIDEOGRAPHY': 15000,
  'PREMIUM - VIDEOGRAPHY': 25000,
  // Add more packages as needed
};
```

All prices are in **Philippine Pesos (₱)**.

---

## Troubleshooting

### ❌ "Payment service not configured"

**Cause:** Missing `PAYMONGO_SECRET_KEY` in environment variables

**Fix:**
```bash
# Check .env.local has:
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

Restart dev server: `npm run dev`

### ❌ "Invalid payment method"

**Cause:** Selected payment method not enabled in Paymongo dashboard

**Fix:**
1. Go to Paymongo Dashboard
2. Check **Payment Methods** section
3. Enable GCash/Maya

### ❌ Redirect loop or "Page not found"

**Cause:** `NEXT_PUBLIC_APP_URL` not set correctly

**Fix:**
```env
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://your-actual-domain.com
```

### ❌ Payment page doesn't load

**Cause:** CORS or network issue

**Solution:**
1. Check browser console for errors
2. Verify API keys are correct
3. Check Paymongo API status: [status.paymongo.com](https://status.paymongo.com)

---

## File Structure

```
lib/
  payment-config.ts       # Configuration and constants
  payment-utils.ts        # Utility functions
components/
  PaymentComponent.tsx    # Payment UI component
app/(marketting)/api/payment/
  create-source/route.ts  # Create payment endpoint
  status/route.ts         # Check payment status endpoint
```

---

## Support

- **Paymongo Docs:** [docs.paymongo.com](https://docs.paymongo.com)
- **Paymongo Support:** support@paymongo.com
- **Community:** [Paymongo Slack Channel](https://paymongo-community.slack.com)

---

## Security Notes

🔒 **Best Practices:**

- Never commit API keys to git
- Use environment variables only
- Validate payment amount on backend
- Use HTTPS in production
- Implement CSRF protection
- Log all payment transactions
- Don't store card details directly

---

Last Updated: May 21, 2026
