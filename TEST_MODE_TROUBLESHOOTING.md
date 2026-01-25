# Test Mode Troubleshooting - No Twilio/SMS Provider

## Problem
You don't have Twilio (or any SMS provider) configured, but you want to test the app.

## Solution 1: Use Test Phone Numbers (Recommended)

Even without Twilio, Supabase allows you to configure **Test Phone Numbers** that work without SMS:

1. **Go to Supabase Dashboard** > Authentication > Phone Provider
2. **Scroll to "Test Phone Numbers and OTPs"** section
3. **Add your phone number** in this format:
   ```
   60183937031=123456
   ```
   - **Important**: 
     - Remove the `+` sign
     - Remove the leading `0` (if your number starts with 0)
     - Format: `60` (country code) + `183937031` (number without 0)
     - Use `=` to separate phone and OTP code
4. **Save** the settings
5. **In the app**: Enter `123456` as OTP code

## Solution 2: Use Email Auth Instead (Alternative)

If test phone numbers don't work, you can temporarily use email authentication:

1. **Enable Email Provider** in Supabase:
   - Go to Authentication > Providers
   - Enable "Email" provider
   - Disable "Confirm email" for testing (optional)

2. **Create a test user manually**:
   - Go to Authentication > Users
   - Add user with email: `test@example.com`
   - Set password: `test123456`

3. **Modify the login flow** (temporary):
   - Use email/password instead of phone OTP
   - Or add an email login option

## Solution 3: Use Supabase Local Development

Supabase has a local development mode that doesn't require SMS:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Use local credentials in .env.local
```

## Current Test Mode Behavior

The app tries these methods in order:

1. ✅ **Test Phone Numbers** (if configured in Supabase)
2. ✅ **Email Auth Fallback** (creates test user automatically)
3. ❌ **Shows error** if both fail

## Quick Fix for Your Case

Since you've already added `0183937031=123456` in Supabase:

**The format might be wrong.** Try these formats:

- `60183937031=123456` (remove 0, add 60)
- `+60183937031=123456` (with +)
- `0183937031=123456` (as you have it)

**Check the Supabase logs**:
- Go to Authentication > Logs
- See what phone number format Supabase is receiving
- Match that format in Test Phone Numbers

## Still Not Working?

1. **Check Supabase Auth Settings**:
   - Phone provider must be enabled (even without SMS provider)
   - Test phone numbers must be saved
   - Check "Test OTPs Valid Until" date (must be in future)

2. **Try different phone formats**:
   - `60183937031`
   - `+60183937031`
   - `0183937031`

3. **Check browser console** for detailed error messages

4. **Use email auth** as a temporary workaround
