# Supabase Setup Guide for Status Page Aggregator

This guide walks SRE teams through setting up Supabase backend for the status page aggregator, including database schema, edge functions, and automated scheduling.

## 📋 Prerequisites

- [Supabase account](https://supabase.com) (free tier sufficient)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally
- Basic SQL knowledge
- The `Supabase-Deno_Script.ts` file from this repository

## 🚀 1. Create Supabase Project

### Option A: Web Interface

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Select your organization
4. Enter project name (e.g., `company-status-page`)
5. Choose region closest to your users
6. Set a strong database password
7. Wait 2-3 minutes for project initialization

### Option B: CLI (Advanced)

```bash
# Login to Supabase
supabase login

# Initialize new project locally
mkdir my-status-page && cd my-status-page
supabase init

# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF
```

## 🗃️ 2. Database Schema Setup

### Create the Service Status Table

Run this SQL in your **Supabase SQL Editor** (Dashboard → SQL Editor):

```sql
-- Create service_status table
-- This matches the schema used by the Deno Edge Function
CREATE TABLE service_status (
  service_slug TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'incident', 'maintenance', 'unknown')),
  last_incident TIMESTAMPTZ,
  last_incident_details JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional:
-- Create indexes for optimal query performance
CREATE INDEX idx_service_status_slug ON service_status(service_slug);
CREATE INDEX idx_service_status_status ON service_status(status);
CREATE INDEX idx_service_status_updated_at ON service_status(updated_at);

-- Add a partial index for non-operational services (for faster incident queries)
CREATE INDEX idx_service_status_incidents ON service_status(updated_at DESC)
WHERE status IN ('incident', 'degraded', 'outage');

-- Add comment for documentation
COMMENT ON TABLE service_status IS 'Stores current status of monitored services';
COMMENT ON COLUMN service_status.service_slug IS 'Unique identifier for each service (e.g., "openai", "aws")';
COMMENT ON COLUMN service_status.status IS 'Current operational status of the service';
COMMENT ON COLUMN service_status.last_incident IS 'Timestamp of most recent incident';
COMMENT ON COLUMN service_status.last_incident_details IS 'JSON object with detailed incident information (title, description, status, components)';
COMMENT ON COLUMN service_status.updated_at IS 'Last time status was checked/updated';
```

### Enable Row Level Security

```sql
-- Enable RLS for security
ALTER TABLE service_status ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for frontend)
-- This allows the frontend to read status data without authentication
CREATE POLICY "Public read access" ON service_status
  FOR SELECT TO anon
  USING (true);

-- Policy: Allow service role full access (for edge function)
-- This allows the edge function to update status data
CREATE POLICY "Service role full access" ON service_status
  FOR ALL TO service_role
  USING (true);

-- Optional: Policy for authenticated users (if you add auth later)
CREATE POLICY "Authenticated read access" ON service_status
  FOR SELECT TO authenticated
  USING (true);
```

### Verify Table Creation

```sql
-- Verify table structure
\d service_status

-- Test with sample data
INSERT INTO service_status (service_slug, status) VALUES
  ('test-service', 'operational'),
  ('sample-api', 'incident');

-- Verify data and clean up
SELECT * FROM service_status;
DELETE FROM service_status WHERE service_slug IN ('test-service', 'sample-api');
```

### Migrating Existing Database

If you already have a `service_status` table from an earlier version, run this migration:

```sql
-- Add the new column for detailed incident information
ALTER TABLE service_status ADD COLUMN last_incident_details JSONB;

-- Add comment for the new column
COMMENT ON COLUMN service_status.last_incident_details IS 'JSON object with detailed incident information (title, description, status, components)';

-- Verify migration
\d service_status
```

**Note**: After running the migration, redeploy your Deno Edge Function to start populating the new column with detailed incident data.

## 🔧 3. Get Supabase Credentials

### From Dashboard

1. Go to **Project Settings** → **API**
2. Note these values:

```bash
# Project Configuration
Project URL: https://[your-project-ref].supabase.co
Project Ref: [your-project-ref]

# API Keys
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security Note**: Never commit the `service_role` key to version control!

### From CLI

```bash
# Get project info
supabase projects list

# Get API keys (if linked to project)
supabase status
```

## 🔄 4. Deploy Edge Function

### Prepare Function Code

1. **Create function directory**:

```bash
mkdir -p supabase/functions/status-sync
```

2. **Copy and modify the script**:

```bash
# Copy the main script
cp Supabase-Deno_Script.ts supabase/functions/status-sync/index.ts

# Update email configuration in the file
sed -i 's/EMAIL_API_URL = ".*"/EMAIL_API_URL = "YOUR_EMAIL_ENDPOINT"/' supabase/functions/status-sync/index.ts
```

3. **Review and customize services**:
   Edit `supabase/functions/status-sync/index.ts` to match your monitoring needs:

```typescript
// Customize high-priority services for notifications
const NOTIFICATION_TRIGGER_SERVICES = new Set([
  "aws", // Your cloud provider
  "stripe", // Payment processing
  "datadog", // Monitoring
  "github", // Code hosting
  "slack", // Communication
  // Add your critical services
]);
```

### Deploy Function

```bash
# Deploy the function
supabase functions deploy status-sync --project-ref YOUR_PROJECT_REF

# Verify deployment
supabase functions list --project-ref YOUR_PROJECT_REF
```

### Set Environment Variables

```bash
# Set Supabase credentials for the edge function
supabase secrets set SUPABASE_URL=https://your-project.supabase.co --project-ref YOUR_PROJECT_REF
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key --project-ref YOUR_PROJECT_REF

# Verify secrets (won't show values)
supabase secrets list --project-ref YOUR_PROJECT_REF
```

## ⏰ 5. Schedule Automated Updates

### Enable Required Extensions

```sql
-- Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify extensions
SELECT * FROM pg_available_extensions WHERE name IN ('pg_cron', 'pg_net');
```

### Store Credentials Securely

```sql
-- Store project URL in Vault
SELECT vault.create_secret('https://your-project-ref.supabase.co', 'project_url');

-- Store service role key in Vault
SELECT vault.create_secret('your-service-role-key', 'service_role_key');

-- Verify secrets exist (won't show values)
SELECT name, created_at FROM vault.secrets;
```

### Create Scheduled Job

```sql
-- Schedule function to run every minute
SELECT cron.schedule(
  'status-sync-job',              -- Job name
  '* * * * *',                   -- Cron schedule (every minute)
  $$
  SELECT
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/status-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := jsonb_build_object('scheduled', true, 'timestamp', extract(epoch from now()))
    ) as request_id;
  $$
);
```

### Alternative Scheduling Options

For different update frequencies:

```sql
-- Every 5 minutes (recommended for production)
SELECT cron.schedule('status-sync-5min', '*/5 * * * *', $$ ... $$);

-- Every 30 minutes (for less critical monitoring)
SELECT cron.schedule('status-sync-30min', '*/30 * * * *', $$ ... $$);

-- Business hours only (9 AM - 6 PM UTC, Monday-Friday)
SELECT cron.schedule('status-sync-business', '* 9-18 * * 1-5', $$ ... $$);
```

## 🔍 6. Monitoring & Debugging

### Check Function Logs

```bash
# View recent function logs
supabase functions logs status-sync --project-ref YOUR_PROJECT_REF

# Follow logs in real-time
supabase functions logs status-sync --follow --project-ref YOUR_PROJECT_REF
```

### Monitor Cron Jobs

```sql
-- Check if cron job exists
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'status-sync-job';

-- View recent job executions
SELECT
  job_run_details.jobid,
  job.jobname,
  job_run_details.start_time,
  job_run_details.end_time,
  job_run_details.status,
  job_run_details.return_message
FROM cron.job_run_details
JOIN cron.job ON job.jobid = job_run_details.jobid
WHERE job.jobname = 'status-sync-job'
ORDER BY start_time DESC
LIMIT 10;

-- Check for failed executions
SELECT * FROM cron.job_run_details
WHERE status = 'failed'
ORDER BY start_time DESC;
```

### Test Manual Function Execution

```bash
# Test function manually
curl -X POST "https://your-project.supabase.co/functions/v1/status-sync" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manual_test": true}'
```

### Query Service Status Data

```sql
-- Check current service statuses
SELECT service_slug, status, last_incident, updated_at
FROM service_status
ORDER BY updated_at DESC;

-- Find services with recent incidents
SELECT service_slug, status, last_incident
FROM service_status
WHERE status IN ('incident', 'degraded')
OR last_incident > NOW() - INTERVAL '24 hours';

-- Monitor update frequency
SELECT
  service_slug,
  status,
  updated_at,
  NOW() - updated_at as time_since_update
FROM service_status
WHERE updated_at < NOW() - INTERVAL '10 minutes'
ORDER BY updated_at ASC;
```

## 🛡️ 7. Security Best Practices

### API Key Management

```bash
# Rotate API keys regularly (every 90 days)
# 1. Generate new keys in Supabase dashboard
# 2. Update environment variables
# 3. Update Vault secrets
# 4. Test functionality
# 5. Revoke old keys
```

### Database Security

```sql
-- Audit RLS policies
SELECT * FROM pg_policies WHERE tablename = 'service_status';

-- Monitor database connections
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity
WHERE datname = current_database()
AND state = 'active';

-- Set up monitoring for unusual activity
CREATE OR REPLACE FUNCTION log_service_status_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to a separate audit table if needed
  RAISE NOTICE 'Service % status changed from % to %',
    NEW.service_slug, OLD.status, NEW.status;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create trigger for status changes
CREATE TRIGGER service_status_audit
  AFTER UPDATE ON service_status
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_service_status_changes();
```

## 🔧 8. Performance Optimization

### Database Optimization

```sql
-- Analyze table statistics
ANALYZE service_status;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'service_status';

-- Monitor query performance
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%service_status%'
ORDER BY total_time DESC;
```

### Function Optimization

- Use connection pooling for high-frequency updates
- Implement batch updates for multiple services
- Add timeout handling for external API calls
- Cache responses for frequently accessed data

## 🆘 9. Troubleshooting

### Common Issues

| Issue                               | Symptoms                    | Solution                                 |
| ----------------------------------- | --------------------------- | ---------------------------------------- |
| **Function timeout**                | Logs show timeout errors    | Reduce batch size, add error handling    |
| **RLS blocking queries**            | Frontend shows no data      | Check RLS policies, verify API keys      |
| **Cron job not running**            | No recent executions        | Check pg_cron extension, verify schedule |
| **External API failures**           | Services stuck in "unknown" | Add retry logic, check rate limits       |
| **Email notifications not working** | No alerts received          | Verify EMAIL_API_URL configuration       |

### Debug Checklist

```sql
-- 1. Verify table exists and has data
SELECT COUNT(*) FROM service_status;

-- 2. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'service_status';

-- 3. Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- 4. Check cron jobs
SELECT * FROM cron.job;

-- 5. Review recent function calls
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

### Get Help

- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: Report bugs in this repository

---

**Next Steps**: After completing this setup, configure your frontend with the Supabase credentials and deploy your status page!
