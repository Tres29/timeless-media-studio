# Deployment Guide - Vercel & GitHub

## ✅ All Build Errors Fixed!

The project now builds successfully with no errors. All TypeScript type issues and unused variable warnings have been resolved.

### Build Status
- ✅ Compilation: **PASS**
- ✅ Linting: **PASS**
- ✅ Type Checking: **PASS**
- ✅ Pages Generated: **15 static + API routes**

---

## Vercel Deployment Setup

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository `timeless-media-studio`
4. Select **main** branch as production

### Step 3: Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### Payment Configuration (Paymongo)
```
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY = pk_test_xxx (from .env.local)
PAYMONGO_SECRET_KEY = sk_test_xxx (from .env.local)
NEXT_PUBLIC_APP_URL = https://your-production-domain.com
```

#### Database Configuration (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL = (from your Supabase project)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (from your Supabase project)
```

**Note:** Replace `xxx` with your actual API keys from:
- Paymongo: https://dashboard.paymongo.com/settings/api-keys
- Supabase: Your project settings

### Step 4: Verify Deployment

After setting environment variables:

1. **Trigger Manual Deploy**
   - Go to Vercel Dashboard → Deployments
   - Click **"Redeploy"** on the latest commit
   
2. **Check Build Logs**
   - Wait for build to complete (usually 2-3 minutes)
   - Verify no errors in build log

3. **Test Production URL**
   - Visit `https://your-project.vercel.app`
   - Test booking form
   - Test payment flow

---

## Troubleshooting

### Issue: Build fails with environment variable errors
**Solution:** Ensure ALL required env vars are set in Vercel dashboard before redeploying

### Issue: Payment gateway returns error
**Solution:** Verify Paymongo API keys are correct in Vercel env vars (not in .env.local)

### Issue: Database connection fails
**Solution:** Check Supabase URL and key in Vercel env vars, verify network access

---

## Production Domain Setup

### Option A: Use Vercel Domain
- Default: `your-project.vercel.app` (automatic)

### Option B: Use Custom Domain
1. Go to Vercel → Project Settings → Domains
2. Add your custom domain (e.g., `timelessstudio.com`)
3. Update DNS records as per Vercel instructions
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars

---

## Git & GitHub Integration

### Auto-Deploy on Push
Vercel is configured to auto-deploy on every push to `main`:
- Branch: `main` → Production
- Other branches → Preview deployments

### Commit Convention
```bash
git push origin main
# Automatically triggers Vercel deployment
```

---

## Post-Deployment Checklist

- [ ] All environment variables are set in Vercel
- [ ] Production build completes without errors
- [ ] Booking form displays correctly
- [ ] Calendar date picker works
- [ ] Payment integration responds
- [ ] Email confirmations send
- [ ] Database queries work
- [ ] Custom domain is configured (if applicable)

---

## Useful Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** Push & check Actions tab for CI/CD
- **Paymongo Docs:** https://docs.paymongo.com
- **Supabase Console:** https://app.supabase.com
- **Next.js Docs:** https://nextjs.org/docs

---

## Local Development

Before committing, always test locally:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build locally to verify
npm run build

# Start production build locally
npm start
```

Visit `http://localhost:3000` and test all features before pushing.

---

## Need Help?

If deployment still fails:
1. Check Vercel build logs for specific errors
2. Verify all environment variables are set
3. Clear Vercel cache: Settings → Deployments → Redeploy
4. Check GitHub Actions for any CI/CD failures

