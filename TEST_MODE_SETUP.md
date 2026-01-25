# Test Mode Setup - Bypass OTP for Development

## Quick Setup (Recommended)

The easiest way to test without SMS is to configure **Test Phone Numbers** in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Phone Provider**
3. Scroll to **Test Phone Numbers** section
4. Click **Add Test Phone Number**
5. Enter your phone number (e.g., `+60183937031`)
6. Set the OTP code to `123456` (or any 6-digit code)
7. Save

Now when you enter that phone number and the test OTP code (`123456`), Supabase will accept it without sending an actual SMS.

## Alternative: Manual User Creation

If test phone numbers don't work, you can create a test user manually:

1. Go to Supabase Dashboard > **Authentication** > **Users**
2. Click **Add User** > **Create new user**
3. Enter:
   - Email: `test_183937031@example.com`
   - Password: `test123456`
   - Phone: `+60183937031`
4. **Disable** "Auto Confirm User" (or enable it if you want immediate access)
5. Save

Then in the app, use OTP code `123456` and it should work.

## Current Test Mode Behavior

In development mode (`npm run dev`):

- **Login page**: Skips OTP sending, goes directly to verify page
- **Verify page**: 
  - Shows test mode warning
  - Accepts test codes: `123456`, `000000`, `111111`, `999999`, `123123`
  - Tries to create test user session automatically
  - Falls back to email auth if OTP fails

## Troubleshooting

If test mode fails:

1. **Check Supabase Auth Settings**:
   - Go to Authentication > Settings
   - Ensure "Enable phone provider" is ON
   - Check if email confirmation is required (might block test users)

2. **Check RLS Policies**:
   - Make sure RLS policies allow users to create businesses
   - Test with a manually created user first

3. **Use Test Phone Numbers** (Best Option):
   - This is the most reliable way
   - No SMS costs
   - Works exactly like production flow

## Production

In production (`npm run build`), test mode is disabled and real OTP verification is required.
