-- ============================================================
-- AI PR Reviewer — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Extensions ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── User Profiles ─────────────────────────────────────────
-- Extends Supabase Auth users with app-specific data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id       BIGINT UNIQUE,
  email           TEXT,
  username        TEXT,
  avatar_url      TEXT,
  name            TEXT,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  usage_count     INTEGER NOT NULL DEFAULT 0,
  usage_reset_at  TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    username,
    avatar_url,
    name,
    github_id
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'user_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'full_name',
    (NEW.raw_user_meta_data ->> 'provider_id')::BIGINT
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Usage Counter (atomic increment) ──────────────────────
CREATE OR REPLACE FUNCTION public.increment_usage_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET usage_count = usage_count + 1,
      updated_at  = NOW()
  WHERE id = user_id;
END;
$$;

-- ─── Reviews ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pr_url          TEXT,
  repo            TEXT,
  pr_number       INTEGER,
  pr_title        TEXT,
  overall_summary TEXT,
  verdict         TEXT CHECK (verdict IN ('approved', 'needs_changes', 'nitpick')),
  total_issues    INTEGER NOT NULL DEFAULT 0,
  critical_count  INTEGER NOT NULL DEFAULT 0,
  warning_count   INTEGER NOT NULL DEFAULT 0,
  suggestion_count INTEGER NOT NULL DEFAULT 0,
  info_count      INTEGER NOT NULL DEFAULT 0,
  files_reviewed  INTEGER NOT NULL DEFAULT 0,
  files_skipped   INTEGER NOT NULL DEFAULT 0,
  model_used      TEXT,
  status          TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'complete', 'error')),
  is_public       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Review Files ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  file_path    TEXT NOT NULL,
  language     TEXT,
  file_summary TEXT,
  issues       JSONB NOT NULL DEFAULT '[]',
  verdict      TEXT CHECK (verdict IN ('approved', 'needs_changes', 'nitpick')),
  issue_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_user_id   ON public.reviews(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_is_public ON public.reviews(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_review_files_review_id ON public.review_files(review_id);

-- ─── Row Level Security ────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_files  ENABLE ROW LEVEL SECURITY;

-- user_profiles: users can read and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- reviews: users can CRUD their own reviews; public reviews readable by all
CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- review_files: accessible if parent review is accessible
CREATE POLICY "Review files follow review access"
  ON public.review_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id
        AND (r.user_id = auth.uid() OR r.is_public = true)
    )
  );

CREATE POLICY "Users can insert review files for own reviews"
  ON public.review_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete review files for own reviews"
  ON public.review_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.user_id = auth.uid()
    )
  );

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role full access to profiles"
  ON public.user_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to reviews"
  ON public.reviews FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to review files"
  ON public.review_files FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Vector Extension (for historical pattern detection) ────────────────────
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Review Costs ──────────────────────────────────────────────────────────
-- Tracks LLM token usage and USD cost per file per review
CREATE TABLE IF NOT EXISTS public.review_costs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model         TEXT NOT NULL,
  file_path     TEXT,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10, 6) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_costs_review_id ON public.review_costs(review_id);
CREATE INDEX IF NOT EXISTS idx_review_costs_user_month ON public.review_costs(user_id, created_at DESC);

ALTER TABLE public.review_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own costs" ON public.review_costs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to costs" ON public.review_costs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Team Rules ────────────────────────────────────────────────────────────
-- Plain-English coding rules injected as context into every review
CREATE TABLE IF NOT EXISTS public.team_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_pattern TEXT NOT NULL DEFAULT '*',
  rule_text    TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_rules_user_id ON public.team_rules(user_id);

ALTER TABLE public.team_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rules" ON public.team_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to rules" ON public.team_rules FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Repo Settings ─────────────────────────────────────────────────────────
-- Per-repo configuration: path filters, auto-review, model selection
CREATE TABLE IF NOT EXISTS public.repo_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_name            TEXT NOT NULL,
  path_includes        TEXT[] NOT NULL DEFAULT '{}',
  path_excludes        TEXT[] NOT NULL DEFAULT '{}',
  auto_review_enabled  BOOLEAN NOT NULL DEFAULT false,
  models               TEXT[] NOT NULL DEFAULT ARRAY['claude-3-5-sonnet-20241022'],
  webhook_secret       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, repo_name)
);

CREATE INDEX IF NOT EXISTS idx_repo_settings_user_id ON public.repo_settings(user_id);

ALTER TABLE public.repo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own repo settings" ON public.repo_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to repo settings" ON public.repo_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Issue Embeddings ──────────────────────────────────────────────────────
-- Vector embeddings for historical issue similarity search (pgvector)
CREATE TABLE IF NOT EXISTS public.issue_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  issue_title TEXT NOT NULL,
  issue_text  TEXT NOT NULL,
  severity    TEXT,
  category    TEXT,
  embedding   vector(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_embeddings_review_id ON public.issue_embeddings(review_id);
CREATE INDEX IF NOT EXISTS idx_issue_embeddings_user_id ON public.issue_embeddings(user_id);
-- Vector similarity index (IVFFlat for approximate nearest-neighbor search)
CREATE INDEX IF NOT EXISTS idx_issue_embeddings_vector
  ON public.issue_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.issue_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own embeddings" ON public.issue_embeddings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to embeddings" ON public.issue_embeddings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Coaching Insights ─────────────────────────────────────────────────────
-- Aggregated per-user coaching data (computed periodically)
CREATE TABLE IF NOT EXISTS public.coaching_insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  top_issues        JSONB NOT NULL DEFAULT '[]',
  issue_counts      JSONB NOT NULL DEFAULT '{}',
  improvement_score NUMERIC(5, 2),
  total_reviews     INTEGER NOT NULL DEFAULT 0,
  total_issues      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_coaching_insights_user_id ON public.coaching_insights(user_id, period_start DESC);

ALTER TABLE public.coaching_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coaching insights" ON public.coaching_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to coaching" ON public.coaching_insights FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Similarity Search Function ────────────────────────────────────────────
-- Finds similar past issues by vector cosine similarity
CREATE OR REPLACE FUNCTION public.find_similar_issues(
  query_embedding vector(1536),
  match_user_id   UUID,
  match_threshold FLOAT DEFAULT 0.85,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  review_id   UUID,
  file_path   TEXT,
  issue_title TEXT,
  issue_text  TEXT,
  severity    TEXT,
  category    TEXT,
  similarity  FLOAT,
  created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ie.id,
    ie.review_id,
    ie.file_path,
    ie.issue_title,
    ie.issue_text,
    ie.severity,
    ie.category,
    1 - (ie.embedding <=> query_embedding) AS similarity,
    ie.created_at
  FROM public.issue_embeddings ie
  WHERE
    ie.user_id = match_user_id
    AND 1 - (ie.embedding <=> query_embedding) > match_threshold
  ORDER BY ie.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
