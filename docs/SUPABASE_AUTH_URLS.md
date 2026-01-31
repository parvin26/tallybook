# Supabase Auth – URL configuration

For magic link sign-in to work in production, configure these in the **Supabase Dashboard**:

**Authentication → URL Configuration**

- **Site URL:** `https://tallybook.app`
- **Redirect URLs:** add `https://tallybook.app/auth/callback`

Supabase will only redirect to URLs listed in Redirect URLs after sign-in.
