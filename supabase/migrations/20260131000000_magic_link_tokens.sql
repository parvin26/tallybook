-- Magic link authentication: single-use, short-lived tokens (hashed).
-- Used only server-side; never expose raw tokens in logs or client.

CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  hashed_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_hashed_token
  ON public.magic_link_tokens (hashed_token)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email_created
  ON public.magic_link_tokens (email, created_at DESC);

-- RLS: table is accessed only via service role (API/server). No anon access.
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON public.magic_link_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.magic_link_tokens IS 'Single-use magic link tokens (hashed). Do not log or expose raw tokens.';
