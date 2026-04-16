-- ============================================================
-- Tabla: reviews
-- Proyecto: fullsite-amalay / Supabase: qjiomlvudfmzuvqvhwpk
-- Propósito: n8n escribe (service key), War Room lee (anon key)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id                 BIGSERIAL    PRIMARY KEY,
  review_id          TEXT         UNIQUE NOT NULL,         -- Google reviewId
  author             TEXT         NOT NULL DEFAULT 'Anónimo',
  rating             SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text               TEXT         NOT NULL DEFAULT '',     -- comentario del cliente
  date               TIMESTAMPTZ,                          -- createTime de Google
  status             TEXT         NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','draft','approved','published')),
  draft_response     TEXT         NOT NULL DEFAULT '',     -- borrador generado por IA
  published_response TEXT         NOT NULL DEFAULT '',     -- respuesta publicada en GBP
  location_id        TEXT,                                 -- "locations/123456"
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auto-actualizar updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status);
CREATE INDEX IF NOT EXISTS reviews_date_idx   ON public.reviews (date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS reviews_rating_idx ON public.reviews (rating);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anon key: solo lectura (War Room frontend)
DROP POLICY IF EXISTS "anon_select" ON public.reviews;
CREATE POLICY "anon_select" ON public.reviews
  FOR SELECT TO anon USING (true);

-- Authenticated (anon key también): puede actualizar draft_response y status
-- (para que el War Room pueda aprobar drafts sin service key)
DROP POLICY IF EXISTS "anon_update_draft" ON public.reviews;
CREATE POLICY "anon_update_draft" ON public.reviews
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- service_role bypasses RLS automáticamente — n8n usa service key para INSERT
-- No se necesita política extra para service_role.

-- ── Vista útil para el War Room ───────────────────────────────
CREATE OR REPLACE VIEW public.reviews_pending AS
  SELECT * FROM public.reviews
  WHERE status IN ('pending', 'draft')
  ORDER BY date DESC NULLS LAST;
