# GitHub Actions Setup

This directory contains GitHub Actions workflows for Continuous Integration and Deployment (CI/CD).

## 📋 Workflows

### 1. `build-deploy.yml` - Full CI/CD Pipeline
**When it runs:** On every push to `main` branch

**What it does:**
1. ✅ Checks out the code
2. ✅ Installs Node.js dependencies
3. ✅ Runs ESLint to check code quality
4. ✅ Builds the project with `npm run build`
5. ✅ Uploads build artifacts (`.next` folder)
6. ✅ **Deploys to Vercel** (if build succeeds)

**Requirements for Vercel deployment:**
You need to add 3 secrets in GitHub repository settings:
- `VERCEL_TOKEN` - From Vercel account settings
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Timeless Media Studio project ID

### 2. `test.yml` - Build Verification
**When it runs:** On every push to `main` or `develop` branch, or on pull requests

**What it does:**
1. ✅ Checks out the code
2. ✅ Installs dependencies
3. ✅ Runs linting (non-blocking)
4. ✅ Builds the project
5. ✅ Reports success/failure

**Requirements:** None - works with placeholder environment variables

---

## 🚀 How to Set Up Full Deployment

### Step 1: Get Vercel Tokens
1. Go to https://vercel.com/account/tokens
2. Create a new token with a name like "GitHub Actions"
3. Copy the token

### Step 2: Get Vercel Project ID
1. Go to https://vercel.com/dashboard
2. Select your project "timeless-media-studio"
3. Click **Settings → General**
4. Copy the **Project ID**

### Step 3: Get Vercel Organization ID
1. Still in project settings, find **Organization ID**
2. Or go to Organization settings at https://vercel.com/account/settings

### Step 4: Add GitHub Secrets
1. Go to GitHub: https://github.com/Tres29/timeless-media-studio
2. Click **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Add these 3 secrets:

| Secret Name | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel token from Step 1 |
| `VERCEL_ORG_ID` | Your Vercel organization ID from Step 3 |
| `VERCEL_PROJECT_ID` | Your Vercel project ID from Step 2 |

### Step 5: Test It
1. Make a small change to any file
2. Commit and push to GitHub: `git push origin main`
3. Go to GitHub **Actions** tab
4. Watch the workflow run
5. Should see: "Build and Deploy" workflow executing
6. Once successful, Vercel will auto-deploy

---

## 🔍 Monitor Workflows

### View Workflow Status
1. Go to your GitHub repo
2. Click **Actions** tab
3. See all workflow runs
4. Click any run to see detailed logs

### Status Badge
Add this to README.md to show build status:
```markdown
![Build](https://github.com/Tres29/timeless-media-studio/actions/workflows/test.yml/badge.svg)
```

---

## 🛠️ Troubleshooting

### Workflow Shows Red X (Failed)
1. Click the failed workflow
2. Click the failed job
3. Look at the error message
4. Common causes:
   - Build failed (check `npm run build` locally)
   - Missing environment variables
   - Node version issues

### Build succeeds locally but fails in GitHub
- Make sure all dependencies are committed to `package-lock.json`
- Check Node version matches (18.x)
- Verify environment variables are set (for Vercel workflows)

### Vercel deployment not triggered
- Verify all 3 secrets are set correctly
- Check VERCEL_TOKEN hasn't expired
- Make sure Project ID and Org ID are correct

---

## 📝 Environment Variables in Workflows

### Build Variables
The workflows use these environment variables during build:
```
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
PAYMONGO_SECRET_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

For local builds, these come from `.env.local`
For GitHub workflows, these use placeholder values (build works without them)
For production, these come from Vercel environment settings

---

## 🔒 Security Notes

- ✅ GitHub Secrets are encrypted
- ✅ Never hardcode API keys in workflows
- ✅ VERCEL_TOKEN should be kept secret
- ✅ Use separate tokens for different services
- ✅ Rotate tokens periodically

---

## 📚 Learn More

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/deployments/git#github)
- [Next.js CI/CD Best Practices](https://nextjs.org/docs/deployment)
