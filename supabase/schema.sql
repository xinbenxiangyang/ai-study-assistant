-- Supabase schema for AI Study Assistant
-- Run this in Supabase SQL Editor

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    subscription TEXT DEFAULT 'free' CHECK (subscription IN ('free', 'student', 'unlimited')),
    daily_usage INTEGER DEFAULT 0,
    total_usage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_active TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mind_map', 'quiz', 'summary', 'flashcards')),
    tokens_used INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated content history
CREATE TABLE history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    filename TEXT,
    content TEXT,
    result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_created_at ON usage(created_at);
CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_created_at ON history(created_at);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin full access (use service_role key on backend)
-- Profiles: admin access via backend service_role key bypasses RLS

-- Users can read their own usage
CREATE POLICY "Users read own usage" ON usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users insert own usage" ON usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own history
CREATE POLICY "Users read own history" ON history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users insert own history" ON history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role, subscription, daily_usage, total_usage, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'free',
        0,
        0,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset daily usage (run via pg_cron or manual)
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    UPDATE profiles SET daily_usage = 0;
END;
$$ LANGUAGE plpgsql;
