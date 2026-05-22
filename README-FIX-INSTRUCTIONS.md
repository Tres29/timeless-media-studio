# Timeless Media Studio Deployment Fix

Replace these files in your project:

- package.json
- vercel.json
- .gitignore
- .env.example
- .github/workflows/test.yml
- .github/workflows/build-deploy.yml

Then run these commands:

```bash
npm install
npm run build
git add .
git commit -m "Fix deployment and production config"
git push origin main
```

Important:

1. Do not commit `.env` or `.env.local`.
2. Add your real environment variables in Vercel Dashboard > Project > Settings > Environment Variables.
3. If you want GitHub Actions to deploy to Vercel, add these GitHub repository secrets:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
   - PAYMONGO_SECRET_KEY
   - NEXT_PUBLIC_APP_URL
   - EMAIL_HOST
   - EMAIL_PORT
   - EMAIL_SECURE
   - EMAIL_USER
   - EMAIL_PASS

If you deploy directly from Vercel GitHub integration, you can also delete the `.github/workflows` folder.
