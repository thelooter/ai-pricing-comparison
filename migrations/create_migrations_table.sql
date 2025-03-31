-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

-- Set up policies
DROP POLICY IF EXISTS "Allow admin access to migrations" ON migrations;
CREATE POLICY "Allow admin access to migrations" 
ON migrations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

DROP POLICY IF EXISTS "Allow public read access to migrations" ON migrations;
CREATE POLICY "Allow public read access to migrations" 
ON migrations FOR SELECT USING (true);

-- Add comment to the table
COMMENT ON TABLE migrations IS 'Tracks which database migrations have been applied and when';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS migrations_name_idx ON migrations (name);
CREATE INDEX IF NOT EXISTS migrations_applied_at_idx ON migrations (applied_at);

-- Insert some initial records for existing structure
INSERT INTO migrations (name, applied_at, status)
VALUES 
  ('0001_initial_schema', NOW(), 'success'),
  ('0004_reports_table', NOW(), 'success'),
  ('0003_fix_admin_policies', NOW(), 'success')
ON CONFLICT (name) DO NOTHING; 