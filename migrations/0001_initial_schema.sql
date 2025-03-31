-- Initial database schema setup

-- Create capabilities table
CREATE TABLE IF NOT EXISTS capabilities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  input_price TEXT NOT NULL,
  output_price TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create model_capabilities junction table
CREATE TABLE IF NOT EXISTS model_capabilities (
  id SERIAL PRIMARY KEY,
  model_id INTEGER REFERENCES models(id) ON DELETE CASCADE,
  capability_id INTEGER REFERENCES capabilities(id) ON DELETE CASCADE,
  UNIQUE(model_id, capability_id)
);

-- Create alternative_providers table
CREATE TABLE IF NOT EXISTS alternative_providers (
  id SERIAL PRIMARY KEY,
  model_id INTEGER REFERENCES models(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  input_price TEXT NOT NULL,
  output_price TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table for admin access control
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some initial capabilities if they don't exist
INSERT INTO capabilities (name)
SELECT 'Text' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Text');

INSERT INTO capabilities (name) 
SELECT 'Image Input' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Image Input');

INSERT INTO capabilities (name)
SELECT 'Object Generation' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Object Generation');

INSERT INTO capabilities (name)
SELECT 'Tool Usage' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Tool Usage');

INSERT INTO capabilities (name)
SELECT 'Audio Processing' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Audio Processing');

INSERT INTO capabilities (name)
SELECT 'Video Processing' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Video Processing');

INSERT INTO capabilities (name)
SELECT 'Code Generation' WHERE NOT EXISTS (SELECT 1 FROM capabilities WHERE name = 'Code Generation');

-- Create a function to update the updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column if it doesn't exist
DROP TRIGGER IF EXISTS update_models_updated_at ON models;
CREATE TRIGGER update_models_updated_at
BEFORE UPDATE ON models
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies if they don't exist
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternative_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access on models" ON models;
DROP POLICY IF EXISTS "Allow public read access on capabilities" ON capabilities;
DROP POLICY IF EXISTS "Allow public read access on model_capabilities" ON model_capabilities;
DROP POLICY IF EXISTS "Allow public read access on alternative_providers" ON alternative_providers;
DROP POLICY IF EXISTS "Allow admin write access on models" ON models;
DROP POLICY IF EXISTS "Allow admin write access on capabilities" ON capabilities;
DROP POLICY IF EXISTS "Allow admin write access on model_capabilities" ON model_capabilities;
DROP POLICY IF EXISTS "Allow admin write access on alternative_providers" ON alternative_providers;

-- Create policies for public read access
CREATE POLICY "Allow public read access on models" 
ON models FOR SELECT USING (true);

CREATE POLICY "Allow public read access on capabilities" 
ON capabilities FOR SELECT USING (true);

CREATE POLICY "Allow public read access on model_capabilities" 
ON model_capabilities FOR SELECT USING (true);

CREATE POLICY "Allow public read access on alternative_providers" 
ON alternative_providers FOR SELECT USING (true);

-- Create policies for admin write access
CREATE POLICY "Allow admin write access on models" 
ON models FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Allow admin write access on capabilities" 
ON capabilities FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Allow admin write access on model_capabilities" 
ON model_capabilities FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Allow admin write access on alternative_providers" 
ON alternative_providers FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Setup admin_users policies
DROP POLICY IF EXISTS "Allow public read access on admin_users" ON admin_users;
CREATE POLICY "Allow public read access on admin_users" 
ON admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow self-management of admin_users" ON admin_users;
CREATE POLICY "Allow self-management of admin_users" 
ON admin_users FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow self-deletion of admin_users" ON admin_users;
CREATE POLICY "Allow self-deletion of admin_users" 
ON admin_users FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow first user to become admin" ON admin_users;
CREATE POLICY "Allow first user to become admin" 
ON admin_users FOR INSERT 
WITH CHECK (
  (SELECT COUNT(*) FROM admin_users) = 0
  OR
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
); 