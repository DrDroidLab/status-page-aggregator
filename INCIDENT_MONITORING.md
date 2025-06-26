# Incident Monitoring System

This system monitors specific services for incidents and sends email notifications to a Slack channel when issues are detected.

## Monitored Services

The system currently monitors these services as requested:

- OpenAI
- Azure
- Supabase
- Render
- Claude (Anthropic)
- Vercel
- Cloudflare
- QDrant
- Clerk
- Slack

## Setup Instructions

### 1. Configure Email Credentials

Update the email configuration in `lib/email.ts` or set environment variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SLACK_EMAIL=clerk_updates-aaaaqs4l7lp4cfjbnrpxpti3v4@deep-sea-global.slack.com
```

### 2. Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

### 3. Enable Nodemailer (Optional)

If you want to use actual email sending instead of console logging:

1. Uncomment the nodemailer implementation in `lib/email.ts`
2. Comment out the current console-based implementation
3. Make sure your email credentials are properly configured

## API Endpoints

### Manual Incident Check

```
GET /api/check-incidents
POST /api/check-incidents
```

Manually triggers an incident check for all monitored services.

### Scheduled Check

```
GET /api/schedule-check
POST /api/schedule-check
```

Wrapper endpoint for scheduled checks (useful for cron jobs).

## Setting Up Automated Monitoring

### Option 1: External Cron Service (Recommended)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com/) to call your API endpoint every 5-10 minutes:

```
URL: https://your-domain.com/api/schedule-check
Method: GET
Frequency: Every 5 minutes
```

### Option 2: Vercel Cron Jobs

If using Vercel, you can set up cron jobs in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/schedule-check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 3: GitHub Actions

Create `.github/workflows/incident-check.yml`:

```yaml
name: Incident Check
on:
  schedule:
    - cron: "*/5 * * * *" # Every 5 minutes
  workflow_dispatch: # Allow manual triggering

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Call incident check API
        run: |
          curl -X GET "https://your-domain.com/api/schedule-check"
```

## How It Works

1. **Status Monitoring**: The system fetches status data from each service's RSS feed, Atom feed, or status API
2. **Incident Detection**: It checks if the service status indicates an incident (degraded, outage, or incident)
3. **Email Notification**: When an incident is detected, it sends an email to the configured Slack email address
4. **Logging**: All activity is logged to the console for debugging

## Email Configuration Options

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Account Settings > Security > App passwords
3. Use your Gmail address and the app password in the configuration

### Other Email Providers

Update the `EMAIL_CONFIG` in `lib/email.ts` with your provider's SMTP settings:

```typescript
const EMAIL_CONFIG = {
  host: "smtp.your-provider.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@domain.com",
    pass: "your-password",
  },
};
```

## Testing

### Test the API Manually

```bash
# Check for incidents
curl https://your-domain.com/api/check-incidents

# Trigger scheduled check
curl https://your-domain.com/api/schedule-check
```

### Test Email Functionality

1. Temporarily modify a service's status check to always return "incident"
2. Call the API endpoint
3. Verify the email notification is sent/logged

## Troubleshooting

### Common Issues

1. **No emails being sent**: Check email credentials and SMTP settings
2. **API timeouts**: Some status pages may be slow; consider increasing timeout values
3. **Rate limiting**: If checking too frequently, some services may rate limit requests

### Debugging

Check the server logs for detailed information about:

- Service status checks
- Email sending attempts
- API errors

## Security Notes

- Store email credentials as environment variables, not in code
- Use app passwords instead of main account passwords
- Consider using a dedicated email account for notifications
- Regularly rotate credentials

## Customization

### Adding New Services

1. Add the service to `MONITORED_SERVICES` in `app/api/check-incidents/route.ts`
2. Add the appropriate RSS/API URL in `getServiceDataUrl()`

### Modifying Notification Content

Edit the email template in `lib/email.ts` to customize:

- Subject line format
- Email body content
- HTML formatting

### Changing Check Frequency

Adjust the cron schedule in your chosen scheduling method to check more or less frequently.
