import { createBrowserSupabaseClient } from './browser'

/**
 * Browser Supabase client (cookie-based session for App Router).
 * Use in client components. For server-side use createServerSupabaseClient().
 */
export const supabase = createBrowserSupabaseClient()
