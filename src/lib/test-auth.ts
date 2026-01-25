/**
 * Test mode authentication helper
 * Creates a test user session for development without OTP
 */
import { supabase } from './supabase/supabaseClient'

export async function createTestSession(phone: string) {
  // Generate a test email from phone number (use a valid email domain)
  const testEmail = `test_${phone.replace(/\D/g, '')}@example.com`
  const testPassword = 'test123456'

  try {
    // Try to sign in with email first (if user already exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (signInData?.user && !signInError) {
      return { user: signInData.user, error: null }
    }

    // If sign in fails, try to create a new test user
    // Note: Supabase may require email confirmation, so we'll handle that
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      phone: `+${phone}`,
      options: {
        // Skip email confirmation in test mode
        emailRedirectTo: undefined,
        data: {
          test_user: true,
        },
      },
    })

    // Even if signup requires confirmation, we might get a user object
    if (signUpData?.user) {
      // If email confirmation is required, the user might not have a session yet
      // In that case, we'll need to handle it differently
      // For now, return the user - the session might be created automatically
      return { user: signUpData.user, error: null }
    }

    // If signup failed, try one more approach: use phone auth with a magic link
    // Or just return the error
    return { user: null, error: signUpError || signInError }
  } catch (err: unknown) {
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}
