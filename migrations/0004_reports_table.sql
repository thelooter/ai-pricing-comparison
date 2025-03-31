-- Create reports table for pricing reports

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  model_name TEXT,
  details TEXT NOT NULL, 
  contact_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS reports_type_idx ON reports (type);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);

-- Enable RLS on the reports table
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports table
DROP POLICY IF EXISTS "Allow admin access to reports" ON reports;
CREATE POLICY "Allow admin access to reports" 
ON reports FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Allow public to insert reports
DROP POLICY IF EXISTS "Allow public insert access to reports" ON reports;
CREATE POLICY "Allow public insert access to reports" 
ON reports FOR INSERT WITH CHECK (true);

-- Allow users to see their own reports
DROP POLICY IF EXISTS "Allow users to see their own reports" ON reports;
CREATE POLICY "Allow users to see their own reports" 
ON reports FOR SELECT 
USING (
  user_id = auth.uid()
); 