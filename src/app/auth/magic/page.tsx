import { redirect } from 'next/navigation'
import { validateAndConsumeMagicToken } from '@/lib/auth/magic-link-db'
import { getSupabaseAdmin } from '@/lib/supabase/server-admin'

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://tallybook.app'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function MagicLinkPage({ searchParams }: PageProps) {
  const params = await searchParams
  const token = params.token ?? null

  const result = await validateAndConsumeMagicToken(token)

  if (!result.ok) {
    redirect(`/auth/magic/error?reason=${result.reason}`)
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: result.email,
    options: {
      redirectTo: `${APP_BASE_URL}/app`,
    },
  })

  if (error || !data?.properties?.action_link) {
    redirect('/auth/magic/error?reason=invalid')
  }

  redirect(data.properties.action_link)
}
