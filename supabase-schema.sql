-- =====================================================
-- Enhanced MAKER Video Generator - Supabase Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query)

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  render_count_month INTEGER DEFAULT 0,
  render_limit_month INTEGER DEFAULT 10,
  last_reset_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- =====================================================
-- 2. VIDEOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  execution_id TEXT UNIQUE NOT NULL,
  title TEXT,
  composition_type TEXT NOT NULL CHECK (composition_type IN ('TextScene', 'ImageScene', 'MultiSceneVideo')),
  duration_seconds NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rendering', 'completed', 'failed')),
  
  -- File storage
  supabase_path TEXT, -- Path in Supabase Storage
  public_url TEXT, -- Public accessible URL
  thumbnail_url TEXT, -- Thumbnail URL
  file_size_bytes BIGINT,
  
  -- Video metadata
  resolution TEXT DEFAULT '1920x1080',
  fps INTEGER DEFAULT 30,
  format TEXT DEFAULT 'mp4',
  has_watermark BOOLEAN DEFAULT false,
  
  -- Render details
  input_props JSONB DEFAULT '{}'::jsonb,
  render_duration_ms INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_execution_id ON public.videos(execution_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_composition_type ON public.videos(composition_type);

-- =====================================================
-- 3. RENDERS TABLE (Queue/History)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'rendering', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Error handling
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_renders_video_id ON public.renders(video_id);
CREATE INDEX IF NOT EXISTS idx_renders_user_id ON public.renders(user_id);
CREATE INDEX IF NOT EXISTS idx_renders_status ON public.renders(status);
CREATE INDEX IF NOT EXISTS idx_renders_queued_at ON public.renders(queued_at DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Videos table policies
CREATE POLICY "Users can view own videos" ON public.videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON public.videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON public.videos
  FOR DELETE USING (auth.uid() = user_id);

-- Renders table policies
CREATE POLICY "Users can view own renders" ON public.renders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own renders" ON public.renders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for videos table
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly render counts
CREATE OR REPLACE FUNCTION reset_monthly_render_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET render_count_month = 0,
      last_reset_date = NOW()
  WHERE EXTRACT(MONTH FROM last_reset_date) != EXTRACT(MONTH FROM NOW())
     OR EXTRACT(YEAR FROM last_reset_date) != EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check render limits before creating video
CREATE OR REPLACE FUNCTION check_render_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT tier, render_count_month, render_limit_month
  INTO user_record
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Free tier users have limits
  IF user_record.tier = 'free' AND user_record.render_count_month >= user_record.render_limit_month THEN
    RAISE EXCEPTION 'Monthly render limit reached. Upgrade to paid tier for unlimited renders.';
  END IF;
  
  -- Increment render count
  UPDATE public.users
  SET render_count_month = render_count_month + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check limits before inserting video
CREATE TRIGGER enforce_render_limit
  BEFORE INSERT ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION check_render_limit();

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================
-- These need to be created in Supabase Dashboard -> Storage
-- Or run via SQL if you have permissions

-- Create videos bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('videos', 'videos', true);

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies (add after creating buckets)
-- CREATE POLICY "Public read access for videos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'videos');

-- CREATE POLICY "Authenticated users can upload videos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- CREATE POLICY "Public read access for thumbnails"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'thumbnails');

-- =====================================================
-- 7. SEED DATA (Optional - for testing)
-- =====================================================

-- Create a test user (you can remove this in production)
-- INSERT INTO public.users (email, tier, render_limit_month)
-- VALUES ('test@example.com', 'free', 10)
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create storage buckets in Dashboard -> Storage:
--    - Create 'videos' bucket (public)
--    - Create 'thumbnails' bucket (public)
-- 3. Enable storage policies for public access
-- =====================================================
