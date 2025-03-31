-- Add popular and legacy boolean fields to models table
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legacy BOOLEAN DEFAULT FALSE; 