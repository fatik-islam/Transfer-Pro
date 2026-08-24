BEGIN;

ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public."Notification"
  ADD COLUMN IF NOT EXISTS "recipient" TEXT,
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nextAttemptAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS public."RateLimitEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."AnalyticsEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "rating" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RateLimitEvent_scope_keyHash_createdAt_idx"
  ON public."RateLimitEvent" ("scope", "keyHash", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Notification_status_nextAttemptAt_idx"
  ON public."Notification" ("status", "nextAttemptAt");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_name_createdAt_idx"
  ON public."AnalyticsEvent" ("name", "createdAt" DESC);

ALTER TABLE public."RateLimitEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalyticsEvent" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_scope TEXT,
  p_key_hash TEXT,
  p_window_seconds INTEGER,
  p_max_requests INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  IF p_window_seconds < 1 OR p_max_requests < 1 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_scope || ':' || p_key_hash));

  DELETE FROM public."RateLimitEvent"
  WHERE "scope" = p_scope
    AND "keyHash" = p_key_hash
    AND "createdAt" < now() - make_interval(secs => GREATEST(p_window_seconds, 86400));

  SELECT count(*)::INTEGER
  INTO recent_count
  FROM public."RateLimitEvent"
  WHERE "scope" = p_scope
    AND "keyHash" = p_key_hash
    AND "createdAt" >= now() - make_interval(secs => p_window_seconds);

  IF recent_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public."RateLimitEvent" ("scope", "keyHash")
  VALUES (p_scope, p_key_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO project_admin;

COMMIT;
