# EmailIt API Operator

Expert operator for the EmailIt transactional email API. Use this skill when working with EmailIt for sending emails, managing domains, handling webhooks, or integrating email functionality.

## When to Use This Skill

Activate this skill when the user needs to:
- Send transactional emails via EmailIt API
- Set up or verify sending domains
- Create or manage API credentials
- Configure webhooks for email events
- Debug email delivery issues
- Integrate EmailIt into applications
- Manage email audiences and contacts
- Track email events (opens, clicks, bounces)
- Implement SMTP integration

## Core Capabilities

### 1. Email Sending Operations

#### Send Single Email

```bash
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Your Subject Here",
    "html": "<h1>Email Content</h1><p>Your message here.</p>",
    "reply_to": "support@yourdomain.com"
  }'
```

#### Send Email with Attachments

```bash
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Document Attached",
    "html": "<p>Please find the document attached.</p>",
    "attachments": [
      {
        "filename": "document.pdf",
        "content": "base64_encoded_content_here",
        "type": "application/pdf"
      }
    ]
  }'
```

#### Send Email with Tags and Custom Headers

```bash
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Tagged Email",
    "html": "<p>Email content</p>",
    "tags": ["welcome", "onboarding", "user_123"],
    "headers": {
      "X-Campaign-ID": "campaign_456",
      "X-User-Segment": "premium"
    }
  }'
```

### 2. Sending Domain Management

#### List Sending Domains

```bash
curl -X GET 'https://api.emailit.com/v1/sending-domains' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Create Sending Domain

```bash
curl -X POST 'https://api.emailit.com/v1/sending-domains' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "yourdomain.com",
    "name": "Production Domain"
  }'
```

#### Get Domain Verification Details

```bash
curl -X GET 'https://api.emailit.com/v1/sending-domains/{domain_id}' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

This returns DNS records that need to be added:
- SPF record
- DKIM record
- DMARC record
- Custom return path (optional)

#### Verify Sending Domain

After adding DNS records, verify the domain:

```bash
curl -X POST 'https://api.emailit.com/v1/sending-domains/{domain_id}/verify' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

### 3. Credential Management

#### List Credentials

```bash
curl -X GET 'https://api.emailit.com/v1/credentials' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Create API Credential

```bash
curl -X POST 'https://api.emailit.com/v1/credentials' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "type": "api",
    "workspace_id": "ws_123456789"
  }'
```

#### Create SMTP Credential

```bash
curl -X POST 'https://api.emailit.com/v1/credentials' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SMTP Credentials",
    "type": "smtp",
    "workspace_id": "ws_123456789"
  }'
```

#### Rotate API Key

```bash
curl -X POST 'https://api.emailit.com/v1/credentials/{credential_id}/rotate' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

### 4. Audience Management

#### Create Audience

```bash
curl -X POST 'https://api.emailit.com/v1/audiences' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Newsletter Subscribers",
    "description": "Monthly newsletter recipients"
  }'
```

#### Add Contacts to Audience

```bash
curl -X POST 'https://api.emailit.com/v1/audiences/{audience_id}/contacts' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      {
        "email": "user1@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      {
        "email": "user2@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
      }
    ]
  }'
```

#### List Audiences

```bash
curl -X GET 'https://api.emailit.com/v1/audiences' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

### 5. Event Tracking

#### List All Events

```bash
curl -X GET 'https://api.emailit.com/v1/events' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Get Events for Specific Email

```bash
curl -X GET 'https://api.emailit.com/v1/events?email_id=email_123456789' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Filter Events by Type

```bash
curl -X GET 'https://api.emailit.com/v1/events?type=email.bounced' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Event Types to Monitor

- `email.sent` - Email successfully sent
- `email.delivered` - Email delivered to recipient
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked link
- `email.bounced` - Email bounced (hard or soft)
- `email.complained` - Marked as spam
- `email.unsubscribed` - Recipient unsubscribed

### 6. Webhook Integration

#### Register Webhook

```bash
curl -X POST 'https://api.emailit.com/v1/webhooks' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/emailit",
    "name": "Production Webhook",
    "events": [
      "email.delivered",
      "email.bounced",
      "email.complained"
    ]
  }'
```

#### List Webhooks

```bash
curl -X GET 'https://api.emailit.com/v1/webhooks' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

#### Delete Webhook

```bash
curl -X DELETE 'https://api.emailit.com/v1/webhooks/{webhook_id}' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}"
```

## Implementation Patterns

### Pattern 1: Node.js Integration

```javascript
// emailit-service.js
const axios = require('axios');

class EmailItService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.emailit.com/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendEmail({ from, to, subject, html, replyTo = null, tags = [] }) {
    try {
      const response = await this.client.post('/emails/send', {
        from,
        to,
        subject,
        html,
        reply_to: replyTo,
        tags
      });
      return response.data;
    } catch (error) {
      console.error('EmailIt error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getEmailEvents(emailId) {
    try {
      const response = await this.client.get('/events', {
        params: { email_id: emailId }
      });
      return response.data.events;
    } catch (error) {
      console.error('Failed to fetch events:', error.response?.data);
      throw error;
    }
  }
}

module.exports = EmailItService;
```

### Pattern 2: Python Integration

```python
# emailit_service.py
import requests
from typing import List, Dict, Optional

class EmailItService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://api.emailit.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def send_email(
        self,
        from_email: str,
        to_email: str,
        subject: str,
        html: str,
        reply_to: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> Dict:
        payload = {
            'from': from_email,
            'to': to_email,
            'subject': subject,
            'html': html
        }

        if reply_to:
            payload['reply_to'] = reply_to
        if tags:
            payload['tags'] = tags

        response = requests.post(
            f'{self.base_url}/emails/send',
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def get_events(self, email_id: Optional[str] = None) -> List[Dict]:
        params = {'email_id': email_id} if email_id else {}
        response = requests.get(
            f'{self.base_url}/events',
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()['events']
```

### Pattern 3: Webhook Handler (Express.js)

```javascript
// webhook-handler.js
const express = require('express');
const router = express.Router();

router.post('/webhooks/emailit', async (req, res) => {
  const event = req.body;

  // Acknowledge receipt immediately
  res.status(200).json({ received: true });

  // Process event asynchronously
  try {
    await processEmailEvent(event);
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
});

async function processEmailEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'email.delivered':
      console.log(`Email ${data.email_id} delivered to ${data.recipient}`);
      // Update database, send analytics, etc.
      break;

    case 'email.bounced':
      console.log(`Email ${data.email_id} bounced: ${data.bounce_reason}`);
      // Mark email as invalid, notify admin, etc.
      break;

    case 'email.complained':
      console.log(`Spam complaint for email ${data.email_id}`);
      // Unsubscribe user, investigate content, etc.
      break;

    case 'email.opened':
      console.log(`Email ${data.email_id} opened by ${data.recipient}`);
      // Track engagement, trigger follow-ups, etc.
      break;

    case 'email.clicked':
      console.log(`Link clicked in email ${data.email_id}: ${data.url}`);
      // Track link performance, user interest, etc.
      break;

    default:
      console.log(`Unhandled event type: ${type}`);
  }
}

module.exports = router;
```

### Pattern 4: SMTP Integration (Nodemailer)

```javascript
// smtp-emailit.js
const nodemailer = require('nodemailer');

// Create transporter with EmailIt SMTP credentials
const transporter = nodemailer.createTransport({
  host: 'smtp.emailit.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAILIT_SMTP_USER,
    pass: process.env.EMAILIT_SMTP_PASS
  }
});

async function sendEmailViaSMTP({ from, to, subject, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments
    });

    console.log('Message sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('SMTP send failed:', error);
    throw error;
  }
}

module.exports = { sendEmailViaSMTP };
```

## Troubleshooting Guide

### Issue: Authentication Failed (401)

**Cause**: Invalid or missing API key

**Solutions**:
1. Verify API key is correct and not expired
2. Check that credential type is "api" not "smtp"
3. Ensure Authorization header format: `Bearer {api_key}`
4. Verify credential has not been deleted or rotated

### Issue: Email Not Sending (422 Validation Error)

**Cause**: Invalid email parameters

**Solutions**:
1. Validate email address formats (from, to, reply_to)
2. Ensure required fields are present (from, to, subject, html/text)
3. Check that sender domain is verified
4. Verify HTML content is properly formatted
5. Check attachment size limits

### Issue: Domain Verification Failing

**Cause**: DNS records not configured correctly

**Solutions**:
1. Get verification details from API: `GET /v1/sending-domains/{domain_id}`
2. Add all required DNS records exactly as specified
3. Wait for DNS propagation (can take up to 48 hours)
4. Use DNS checker tools to verify records are live
5. Retry verification: `POST /v1/sending-domains/{domain_id}/verify`

### Issue: Emails Going to Spam

**Cause**: Poor domain reputation or missing authentication

**Solutions**:
1. Ensure SPF, DKIM, and DMARC records are configured
2. Start with low sending volume and gradually increase
3. Maintain clean email lists (remove bounces/complaints)
4. Use proper email formatting and content
5. Avoid spam trigger words
6. Implement proper unsubscribe mechanisms
7. Monitor bounce and complaint rates

### Issue: Webhook Not Receiving Events

**Cause**: Webhook endpoint configuration issues

**Solutions**:
1. Verify webhook URL is publicly accessible (HTTPS required)
2. Check that endpoint returns 200 status quickly
3. Ensure endpoint accepts POST requests
4. Test webhook manually with sample payload
5. Check firewall/security rules aren't blocking EmailIt IPs
6. Verify correct event types are subscribed

### Issue: Rate Limit Exceeded (429)

**Cause**: Sending too many requests too quickly

**Solutions**:
1. Implement exponential backoff retry logic
2. Check your workspace rate limits
3. Batch requests where possible
4. Use queuing system for high-volume sending
5. Contact support for rate limit increase if needed

## Best Practices

### 1. API Key Security

```javascript
// ✅ GOOD: Use environment variables
const apiKey = process.env.EMAILIT_API_KEY;

// ❌ BAD: Hardcoded API key
const apiKey = 'sk_live_abc123...';
```

### 2. Error Handling with Retries

```javascript
async function sendEmailWithRetry(emailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailItService.sendEmail(emailData);
      return result;
    } catch (error) {
      const status = error.response?.status;

      // Don't retry client errors (4xx)
      if (status >= 400 && status < 500) {
        throw error;
      }

      // Retry server errors (5xx) with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}
```

### 3. Email Template Management

```javascript
// templates/welcome.js
module.exports = {
  subject: 'Welcome to {{app_name}}!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome, {{user_name}}!</h1>
      <p>Thank you for joining {{app_name}}.</p>
      <a href="{{verification_link}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Verify Your Email
      </a>
    </div>
  `
};

// Usage
function renderTemplate(template, data) {
  let { subject, html } = template;

  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, data[key]);
    html = html.replace(regex, data[key]);
  });

  return { subject, html };
}
```

### 4. Event Tracking and Analytics

```javascript
// Track email performance
async function trackEmailPerformance(emailId) {
  const events = await emailItService.getEvents(emailId);

  const metrics = {
    sent: events.some(e => e.type === 'email.sent'),
    delivered: events.some(e => e.type === 'email.delivered'),
    opened: events.filter(e => e.type === 'email.opened').length,
    clicked: events.filter(e => e.type === 'email.clicked').length,
    bounced: events.some(e => e.type === 'email.bounced'),
    complained: events.some(e => e.type === 'email.complained')
  };

  // Calculate open rate, click rate, etc.
  metrics.openRate = metrics.delivered && metrics.opened > 0 ?
    (metrics.opened / 1) * 100 : 0;

  return metrics;
}
```

### 5. Idempotency for Webhooks

```javascript
const processedWebhooks = new Set();

router.post('/webhooks/emailit', async (req, res) => {
  const eventId = req.body.event_id;

  // Check if already processed (idempotency)
  if (processedWebhooks.has(eventId)) {
    return res.status(200).json({ received: true });
  }

  // Mark as processed
  processedWebhooks.add(eventId);
  res.status(200).json({ received: true });

  // Process event
  await processEmailEvent(req.body);
});
```

## Environment Setup

### Required Environment Variables

```bash
# .env
EMAILIT_API_KEY=your_api_key_here
EMAILIT_SMTP_USER=your_smtp_username
EMAILIT_SMTP_PASS=your_smtp_password
EMAILIT_WEBHOOK_SECRET=your_webhook_secret
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_REPLY_TO=support@yourdomain.com
```

### Development vs Production

```javascript
// config/emailit.js
module.exports = {
  development: {
    apiKey: process.env.EMAILIT_DEV_API_KEY,
    fromEmail: 'dev@yourdomain.com',
    enableLogging: true
  },
  production: {
    apiKey: process.env.EMAILIT_PROD_API_KEY,
    fromEmail: 'noreply@yourdomain.com',
    enableLogging: false
  }
};
```

## Testing EmailIt Integration

### 1. Test Email Sending

```bash
# Test with curl
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from EmailIt.</p>"
  }'
```

### 2. Test Webhook Locally

```bash
# Use ngrok to expose local webhook endpoint
ngrok http 3000

# Register webhook with ngrok URL
curl -X POST 'https://api.emailit.com/v1/webhooks' \
  -H "Authorization: Bearer ${EMAILIT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-ngrok-url.ngrok.io/webhooks/emailit",
    "events": ["email.delivered", "email.opened"]
  }'
```

## Quick Reference

### Common cURL Commands

```bash
# Send email
curl -X POST https://api.emailit.com/v1/emails/send \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d @email.json

# List domains
curl https://api.emailit.com/v1/sending-domains \
  -H "Authorization: Bearer $EMAILIT_API_KEY"

# Get events
curl https://api.emailit.com/v1/events?email_id=email_123 \
  -H "Authorization: Bearer $EMAILIT_API_KEY"

# Create webhook
curl -X POST https://api.emailit.com/v1/webhooks \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d @webhook.json
```

## Operator Guidelines

When using this skill:

1. **Always verify API key** is properly configured before operations
2. **Check domain verification** before attempting to send emails
3. **Implement proper error handling** with retries for 5xx errors
4. **Use environment variables** for sensitive credentials
5. **Monitor event webhooks** for delivery issues
6. **Test in development** before production deployment
7. **Follow rate limits** and implement backoff strategies
8. **Secure webhook endpoints** with signature verification
9. **Keep DNS records updated** for domain authentication
10. **Log errors appropriately** for debugging without exposing keys

## Additional Resources

- **Full Documentation**: `/Users/kcdacre8tor/edc_web/emailit_api_docs/claude.md`
- **API Reference**: https://docs.emailit.com/api
- **Screenshots**: `/Users/kcdacre8tor/edc_web/emailit_api_docs/*.png`
