# Vercel Email Configuration Guide

## Email Sender Setup for Vercel Production

The application uses Gmail SMTP to send booking confirmation and status update emails. Follow these steps to set up email sending in Vercel:

### Step 1: Create Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Click "App passwords" (at the bottom of the page)
4. Select "Mail" and "Windows Computer" (or your device type)
5. Google will generate a 16-character app password
6. Copy this password - you'll need it for Vercel

### Step 2: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **timeless-media-studio**
3. Go to **Settings** → **Environment Variables**
4. Add the following environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP server |
| `EMAIL_PORT` | `587` | Standard SMTP port |
| `EMAIL_SECURE` | `false` | Use STARTTLS (not SSL) |
| `EMAIL_USER` | `your-gmail@gmail.com` | Your Gmail address |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | 16-char app password from Step 1 |
| `EMAIL_FROM` | `your-gmail@gmail.com` | Sender email address |

### Step 3: Redeploy Your Application

1. After adding environment variables, redeploy your application:
   - Go to **Deployments** in Vercel
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Or simply push a new commit to trigger auto-deployment

2. Verify deployment was successful by checking the build logs

### Step 4: Test Email Sending

1. Go to your admin panel at: `https://your-domain.vercel.app/admin`
2. Create or select a test booking
3. Change the booking status to "Approved" or "Cancelled"
4. Check the recipient's email for the confirmation/status update

### Common Issues & Troubleshooting

#### ❌ "Email server configuration error"
- **Cause**: Missing or incorrect environment variables in Vercel
- **Fix**: Double-check all EMAIL_* variables are set in Vercel Settings
- **Verify**: Check Vercel Logs → Deployments → select deployment → Logs (filter for "Email Configuration")

#### ❌ "Failed to send confirmation email"
- **Causes**: 
  1. Gmail app password might be incorrect
  2. Less secure apps might be blocked
  3. SMTP connection issues in Vercel environment
- **Fix**:
  1. Regenerate app password in [Google Account Settings](https://myaccount.google.com/apppasswords)
  2. Copy the exact 16-character password (with spaces)
  3. Update in Vercel environment variables
  4. Redeploy your application

#### ❌ "Invalid login" or "Authentication failed"
- **Cause**: Email credentials are incorrect
- **Fix**: 
  1. Verify EMAIL_USER is correct (full Gmail address)
  2. Verify EMAIL_PASSWORD is the app password, not regular password
  3. Ensure no extra spaces or characters in password
  4. If using 2FA, make sure app password is generated (not regular password)

#### ❌ "Connection timeout" 
- **Cause**: Vercel serverless timeout or SMTP server unreachable
- **Potential Fixes**:
  1. Try changing EMAIL_PORT to 465 (if 587 doesn't work)
  2. Try changing EMAIL_SECURE to "true" (if "false" doesn't work)
  3. Check if Gmail SMTP is being blocked by firewall/network
  4. Check Vercel function timeout settings (default 60s)

#### ✅ Email Working Locally but Not in Vercel
- **Cause**: Environment variables set locally but not in Vercel
- **Fix**: Ensure ALL EMAIL_* variables are added to Vercel Settings
- **Note**: `.env.local` is for local development only and is never deployed to Vercel
- **Debugging**: 
  1. Go to Vercel Dashboard → Deployments
  2. Select the latest deployment
  3. Click on "Logs" (Runtime Logs tab)
  4. Look for "Email Configuration:" logs to see what variables are being used

### Debugging Email Issues in Vercel

#### Step 1: Check Vercel Logs
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **timeless-media-studio**
3. Go to **Deployments**
4. Click on the latest deployment
5. Click **Logs** tab (Runtime Logs)
6. Look for entries starting with 📧 or ❌

#### Step 2: Check Email Configuration
The logs will show:
```
📧 Email Configuration: {
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "user": "hib***",
  "environment": "production"
}
```

If variables are missing, you'll see:
```
❌ Missing email environment variables: {
  "EMAIL_HOST": false,
  "EMAIL_PORT": false,
  "EMAIL_USER": false,
  "EMAIL_PASSWORD": false
}
```

#### Step 3: Test Email Sending
1. Go to admin panel: `https://your-domain.vercel.app/admin`
2. Select a booking
3. Change status to "Approved" or "Cancelled"
4. Check Vercel logs for email send attempt
5. Look for either:
   - ✅ `Email sent successfully` = Success
   - ❌ `Email send error` = Check error details in logs

### Port Configuration Reference

For Vercel production, port 465 with SSL is **strongly recommended** over 587 with STARTTLS, as Vercel's serverless environment often blocks STARTTLS connections.

| EMAIL_PORT | EMAIL_SECURE | Protocol | Vercel Status |
|-----------|--------------|----------|--------|
| 465 | true | SSL/TLS | ✅ **Recommended** |
| 587 | false | STARTTLS | ⚠️ Often blocked by Vercel |
| 25 | false | Plain SMTP | ❌ Rarely works |

**For Vercel Deployment: Use port 465 with EMAIL_SECURE=true**

The system will automatically upgrade port 587 to 465 when running in Vercel (detected via `VERCEL_URL` environment variable).

### Environment Variables Summary

**Local Development (.env.local):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=hibuyer81@gmail.com
EMAIL_PASSWORD=aylevnyiytqtukhq
EMAIL_FROM=hibuyer81@gmail.com
```

**Vercel Production (Settings → Environment Variables):**
- Set the same values but with your own Gmail account credentials
- Use Gmail App Password (not your regular password)

### Security Notes

- 🔒 Never commit `.env.local` to GitHub (already in .gitignore)
- 🔒 App passwords are different from your Gmail password
- 🔒 Each app password is specific to this application
- 🔒 You can revoke app passwords anytime in Google Account settings

### Support

If you continue to experience issues:
1. Check Vercel deployment logs: **Deployments** → select deployment → **Logs**
2. Look for error messages in the logs
3. Verify environment variables are correctly set in Vercel Settings (not in code)

---

**Last Updated**: May 17, 2026
