# Customization Guide for SRE Teams

This guide helps SRE teams customize the status page aggregator for their specific technology stack and operational requirements.

## 🚀 Quick Start Customization

### 1. Fork and Setup

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/status-page-aggregator
cd status-page-aggregator
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your specific settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Email Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=sre-alerts@gmail.com
EMAIL_PASS=your-app-password
SLACK_EMAIL=sre-team@yourcompany.slack.com # You can receive any notification on any email ID, you can also add a slack channel's notification email to recieve email to any standard email ID.

# Optional: Custom branding
NEXT_PUBLIC_COMPANY_NAME="Your Company Name"
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourcompany.com
```

## 🛠️ Adding Your Services

### Understanding Service Types

The status aggregator supports three types of service monitoring:

1. **JSON API Services**: Services with statuspage.io-style APIs
2. **RSS Feed Services**: Services providing RSS feeds for incidents
3. **Atom Feed Services**: Services providing Atom feeds for incidents

### Adding JSON API Services

Edit `Supabase-Deno_Script.ts` and add to the `services_json` array:

```typescript
const services_json = [
  // Existing services...

  // Add your service
  {
    slug: "your-payment-processor",
    name: "Your Payment Processor",
    api: "https://status.yourpaymentprocessor.com/api/v2/status.json",
    incident_api:
      "https://status.yourpaymentprocessor.com/api/v2/incidents.json",
  },
  {
    slug: "your-database-provider",
    name: "Your Database Provider",
    api: "https://status.yourdatabase.com/api/v2/summary.json",
    incident_api: "https://status.yourdatabase.com/api/v2/incidents.json",
  },
];
```

### Adding RSS Feed Services

For services that provide RSS feeds:

```typescript
const services_rss = [
  // Existing services...

  // Add your service
  {
    slug: "your-cdn-provider",
    name: "Your CDN Provider",
    rss_url: "https://status.yourcdn.com/history.rss",
  },
  {
    slug: "your-monitoring-tool",
    name: "Your Monitoring Tool",
    rss_url: "https://status.yourmonitoring.com/feed.rss",
  },
];
```

### Adding Atom Feed Services

For services that provide Atom feeds:

```typescript
const services_atom = [
  // Existing services...

  // Add your service
  {
    slug: "your-cloud-provider",
    name: "Your Cloud Provider",
    atom_url: "https://status.yourcloud.com/feed.xml",
  },
];
```

### Finding Service Status APIs

Most services follow these patterns:

| Service Type      | Typical URLs                                    |
| ----------------- | ----------------------------------------------- |
| **Statuspage.io** | `https://status.service.com/api/v2/status.json` |
| **RSS Feed**      | `https://status.service.com/history.rss`        |
| **Atom Feed**     | `https://status.service.com/feed.xml`           |

**Research Tips:**

- Check the service's status page footer for API links
- Look for "API" or "RSS" links on their status page
- Try appending `/api/v2/status.json` to their status page URL
- Contact their support for API documentation

## 🚨 Configuring High-Priority Notifications

### Set Critical Services

Update the `NOTIFICATION_TRIGGER_SERVICES` set to match your critical dependencies:

```typescript
const NOTIFICATION_TRIGGER_SERVICES = new Set([
  // Cloud Infrastructure (Critical)
  "aws",
  "google-cloud",
  "azure",

  // Payment Processing (Critical for revenue)
  "stripe",
  "paypal",

  // Authentication & Security
  "auth0",
  "okta",

  // Monitoring & Observability
  "datadog",
  "new-relic",
  "sentry",

  // Communication Tools
  "slack",
  "pagerduty",

  // Your custom services
  "your-core-api",
  "your-database",
  "your-cdn",
]);
```

### Customize Email Content

Modify the `formatStatusChangeMessage` function for custom notification formatting:

```typescript
function formatStatusChangeMessage(changes, incidentServices) {
  let message = `🚨 Critical Service Alert - ${new Date().toISOString()}\n\n`;

  message += `Company: ${process.env.COMPANY_NAME || "Your Company"}\n`;
  message += `Dashboard: ${
    process.env.DASHBOARD_URL || "https://your-status-page.com"
  }\n\n`;

  // Add status changes with custom formatting
  message += "Status Changes:\n";
  changes.forEach((change) => {
    const statusEmoji = getStatusEmoji(change.new_status);
    const urgency = getUrgencyLevel(change.service_slug);

    message += `${statusEmoji} [${urgency}] ${change.service_name}: ${change.old_status} → ${change.new_status}\n`;
  });

  // Add runbook links for critical services
  message += "\n📖 Incident Response:\n";
  changes.forEach((change) => {
    const runbookUrl = getRunbookUrl(change.service_slug);
    if (runbookUrl) {
      message += `• ${change.service_name}: ${runbookUrl}\n`;
    }
  });

  return message;
}

// Helper functions
function getStatusEmoji(status) {
  const emojis = {
    operational: "✅",
    degraded: "⚠️",
    incident: "🚨",
    maintenance: "🔧",
    unknown: "❓",
  };
  return emojis[status] || "❓";
}

function getUrgencyLevel(serviceSlug) {
  const criticalServices = ["aws", "stripe", "auth0"];
  return criticalServices.includes(serviceSlug) ? "CRITICAL" : "MINOR";
}

function getRunbookUrl(serviceSlug) {
  const runbooks = {
    aws: "https://wiki.company.com/runbooks/aws-outage",
    stripe: "https://wiki.company.com/runbooks/payment-issues",
    auth0: "https://wiki.company.com/runbooks/auth-outage",
  };
  return runbooks[serviceSlug];
}
```

## 🎨 Frontend Customization

### Update Service List for Dashboard

Edit `app/page.tsx` to customize the frontend service display:

```typescript
const services = [
  // Infrastructure
  {
    name: "AWS",
    statusUrl: "https://status.aws.amazon.com/",
    slug: "aws",
    tags: ["Cloud Infrastructure"],
  },
  {
    name: "Your Internal API",
    statusUrl: "https://status.yourcompany.com/api",
    slug: "your-api",
    tags: ["Internal Services"],
  },

  // Development Tools
  {
    name: "GitHub",
    statusUrl: "https://www.githubstatus.com/",
    slug: "github",
    tags: ["Developer Tools"],
  },

  // Add all your monitored services...
];
```

### Customize Visual Styling

Update `tailwind.config.ts` for company branding:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Your company colors
        "company-primary": "#your-primary-color",
        "company-secondary": "#your-secondary-color",
        critical: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
      },
      fontFamily: {
        sans: ["Your Company Font", "system-ui", "sans-serif"],
      },
    },
  },
};
```

### Add Company Branding

Update the header in `app/page.tsx`:

```typescript
// Replace the existing header
<div className="text-center mb-12">
  <img
    src="/your-company-logo.svg"
    alt="Your Company"
    className="h-16 mx-auto mb-4"
  />
  <h1 className="text-4xl font-bold text-gray-900 mb-4">
    Your Company Status Dashboard
  </h1>
  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
    Real-time status monitoring for all critical services used by Your Company.
    Stay informed during incidents and planned maintenance.
  </p>
</div>
```

### Create Individual Service Pages

You can create dedicated pages for each service by adding `app/[service]/page.tsx`. Add your service data and update helper functions:

```typescript
// app/[service]/page.tsx - Add to serviceData object
const serviceData = {
  stripe: {
    name: "Stripe",
    slug: "stripe",
    statusUrl: "https://status.stripe.com/",
    communityUrl: "https://reddit.com/r/stripe",
    tags: ["Payment", "API"],
    description:
      "Stripe is a payment processing platform for online businesses.",
    faq: [
      {
        question: "Is Stripe down?",
        answer:
          "Check current status above. Stripe maintains 99.99% uptime for payment processing.",
      },
    ],
  },
};

// Update helper functions
function getRssUrl(service: string): string | null {
  const rssUrls: Record<string, string> = {
    stripe: "https://status.stripe.com/history.rss",
    github: "https://www.githubstatus.com/history.rss",
  };
  return rssUrls[service] || null;
}
```

## 📧 Email Provider Configuration

### Gmail Setup (Recommended for small teams)

```bash
# In .env.local
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Not your regular password!
```

1. Enable 2FA on your Gmail account
2. Generate an App Password: Account Settings → Security → App passwords
3. Use the app password, not your regular password

### SendGrid Setup (Recommended for production)

```bash
# In .env.local
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### AWS SES Setup (For AWS-based infrastructure)

```bash
# In .env.local
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-ses-smtp-username
EMAIL_PASS=your-ses-smtp-password
```

### Custom Email API Integration

If you prefer using your own email API, update the `sendEmailNotification` function:

```typescript
async function sendEmailNotification(subject, message) {
  try {
    // Option 1: Use your internal email API
    const response = await fetch("https://api.yourcompany.com/send-email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("INTERNAL_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: Deno.env.get("SRE_EMAIL"),
        subject: `[ALERT] ${subject}`,
        html: convertToHTML(message),
        priority: "high",
        tags: ["status-page", "incident"],
      }),
    });

    // Option 2: Send to Slack webhook
    await fetch(Deno.env.get("SLACK_WEBHOOK_URL"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🚨 Status Alert: ${subject}`,
        attachments: [
          {
            color: "danger",
            text: message,
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`);
    }

    console.log("Notification sent successfully");
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
```

## 🔄 Custom Update Frequencies

### Adjust Monitoring Frequency

Different services may need different monitoring frequencies. Update the scheduling:

```sql
-- Critical services: Every minute
SELECT cron.schedule('critical-services', '* * * * *', $$ ... $$);

-- Standard services: Every 5 minutes
SELECT cron.schedule('standard-services', '*/5 * * * *', $$ ... $$);

-- Low priority: Every 30 minutes
SELECT cron.schedule('low-priority-services', '*/30 * * * *', $$ ... $$);
```

### Business Hours Only Monitoring

For internal services that don't need 24/7 monitoring:

```sql
-- Monitor only during business hours (9 AM - 6 PM, Mon-Fri)
SELECT cron.schedule(
  'business-hours-only',
  '* 9-17 * * 1-5',  -- 9 AM to 5 PM, Monday to Friday
  $$ ... $$
);
```

## 📚 Additional Resources

- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Cron Schedule Examples**: [crontab.guru](https://crontab.guru)

## 🤝 Contributing Back

After customizing for your needs, consider contributing improvements:

1. **New service integrations** that others might use
2. **Bug fixes** you discover during customization
3. **Performance improvements** for large-scale deployments
4. **Documentation improvements** for common customization scenarios

---

**Need Help?** Open an issue in the GitHub repository with details about your customization needs.
