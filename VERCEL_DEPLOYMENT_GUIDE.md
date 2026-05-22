# ✅ Vercel Deployment - Step by Step Guide

## Prerequisites
- ✅ GitHub account and repository pushed
- ✅ Vercel account (free tier available at vercel.com)
- ✅ API keys from required services

---

## Step 1: Gather API Keys

### A. Paymongo API Keys
1. Go to https://dashboard.paymongo.com/settings/api-keys
2. Click "Generate Test Keys" (or use existing)
3. Copy:
   - **Public Key** (starts with `pk_test_`)
   - **Secret Key** (starts with `sk_test_`)
4. Keep these safe - you'll need them soon

### B. Supabase Configuration
1. Go to https://app.supabase.com/projects
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
5. Keep these for later

### C. Gmail SMTP (Optional - for email confirmations)
If you want production emails to work:
1. Enable 2-Factor Authentication in Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer"
4. Copy the 16-character password

---

## Step 2: Push Latest Code to GitHub

```bash
# Stage all changes
git add .

# Commit with message
git commit -m "fix: prepare for Vercel deployment"

# Push to GitHub main branch
git push origin main
```

**Verify:** Go to https://github.com/Tres29/timeless-media-studio and confirm latest commit is visible.

---

## Step 3: Connect Vercel to GitHub

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard

2. **Click "Add New"**
   - Select **"Project"**

3. **Import GitHub Repository**
   - Click "Continue with GitHub"
   - Find and select **"timeless-media-studio"**
   - Click **"Import"**

4. **Configure Project Name**
   - Name: `timeless-media-studio` (or your choice)
   - Framework: `Next.js` (should auto-detect)
   - Click **"Deploy"** (it will likely fail - this is normal, we'll fix it next)

---

## Step 4: Add Environment Variables in Vercel

The deployment will fail because environment variables are missing. Let's add them:

1. **Go to Project Settings**
   - In Vercel dashboard, click your project
   - Go to **Settings → Environment Variables**

2. **Add Each Variable** (copy-paste from your notes):

   | Variable Name | Value | Environment |
   |---|---|---|
   | `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | `pk_test_xxx...` | Production & Preview |
   | `PAYMONGO_SECRET_KEY` | `sk_test_xxx...` | Production Only |
   | `NEXT_PUBLIC_APP_URL` | `https://timeless-media-studio.vercel.app` | Production |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production & Preview |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Production & Preview |

3. **Save Each Variable**
   - After pasting each value, click "Save"
   - Verify it appears in the list

---

## Step 5: Trigger First Deployment

1. **Go to Deployments Tab**
   - In Vercel, click **"Deployments"**

2. **Find Latest Commit**
   - Should show the commit you just pushed
   - Status: "Failed" (because env vars weren't set before)

3. **Redeploy**
   - Click the **"..."** menu on the failed deployment
   - Click **"Redeploy"**
   - Vercel will now use the env vars you just added

4. **Wait for Build**
   - Build should take 2-3 minutes
   - Check build logs for any errors
   - If successful: Status changes to "Ready" ✅

---

## Step 6: Test Production Deployment

1. **Get Your URL**
   - In Vercel dashboard, find **"Domains"**
   - Your domain: `https://timeless-media-studio.vercel.app` (or similar)

2. **Test Each Feature**
   - ✅ Booking form loads
   - ✅ Calendar date picker works
   - ✅ Fully booked dates are grayed out
   - ✅ Select a date and proceed
   - ✅ Enter email and get confirmation
   - ✅ Payment dialog appears
   - ✅ Can select GCash/Maya payment method
   - ✅ Submit payment (test mode)
   - ✅ Check email for confirmation

3. **Check Logs**
   - If any feature fails, check Vercel logs:
   - Go to **"Deployments" → Latest → "Logs"**
   - Look for error messages

---

## Step 7: Configure Production Domain (Optional)

If you have a custom domain:

1. **In Vercel Dashboard**
   - Go to **Settings → Domains**
   - Click **"Add Domain"**

2. **Enter Your Domain**
   - Example: `timelessstudio.com`

3. **Update DNS Records**
   - Vercel will show you what DNS records to add
   - Add them to your domain registrar

4. **Wait for Verification**
   - Usually takes 5-30 minutes
   - Vercel will show when it's ready

---

## Troubleshooting Deployment Errors

### Error: "Build failed"
**Solution:** 
- Check Vercel logs for specific error
- Most common: Missing or incorrect environment variables
- Fix in Settings → Environment Variables and redeploy

### Error: "Payment not working"
**Solution:**
- Verify Paymongo keys are correct
- Make sure `PAYMONGO_SECRET_KEY` is **Production Only** (not Preview)
- Redeploy after fixing

### Error: "Database connection failed"
**Solution:**
- Check Supabase URL and key are correct
- Verify Supabase project is running (not paused)
- Redeploy

### Error: "Emails not sending"
**Solution:**
- Email is optional in preview
- For production, add Gmail credentials to env vars (see Step 1.C)
- Check email configuration in API routes

---

## After Deployment - Important!

1. **Keep .env.local Local Only**
   - NEVER commit .env.local to GitHub
   - It's already in .gitignore ✅

2. **Use .env.example as Template**
   - Share this with your team
   - Don't share actual .env.local values

3. **Auto-Deploy on Push**
   - Every push to `main` branch auto-deploys
   - Other branches create preview deployments

4. **Monitor Deployments**
   - Check Vercel dashboard regularly
   - Review build logs for warnings
   - Fix issues before they affect users

---

## Quick Reference

| Step | Action | Status |
|------|--------|--------|
| 1 | Gather API keys | ⏳ TODO |
| 2 | Push to GitHub | ⏳ TODO |
| 3 | Import to Vercel | ⏳ TODO |
| 4 | Add env variables | ⏳ TODO |
| 5 | Redeploy | ⏳ TODO |
| 6 | Test features | ⏳ TODO |
| 7 | Setup custom domain | ⏳ TODO (optional) |

---

## Support Links

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Paymongo Docs:** https://docs.paymongo.com
- **Supabase Docs:** https://supabase.com/docs

---

## Need Help?

If you encounter issues:

1. **Check build logs:**
   - Vercel Dashboard → Deployments → [Your Deployment] → Logs

2. **Common fixes:**
   - Clear Vercel cache: Settings → Deployments → Rebuild
   - Re-add environment variables
   - Check GitHub for latest commits

3. **Still stuck?**
   - Check the error message carefully
   - Google the error code
   - Check documentation for your service (Paymongo, Supabase, etc.)

