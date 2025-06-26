-- Fix Row Level Security to allow updates to service_status table

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'service_status';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'service_status';

-- Option 1: Disable RLS completely (if this is an internal tool)
ALTER TABLE service_status DISABLE ROW LEVEL SECURITY;

-- Option 2: OR create a policy to allow all operations (more secure)
-- Uncomment these lines if you prefer to keep RLS enabled:

-- DROP POLICY IF EXISTS "Allow all operations on service_status" ON service_status;
-- CREATE POLICY "Allow all operations on service_status" 
-- ON service_status FOR ALL 
-- TO anon, authenticated 
-- USING (true) 
-- WITH CHECK (true);

-- Verify the fix
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'service_status'; 