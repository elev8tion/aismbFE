# EmailIt API Documentation - Usage Guide

## What This Is

**EmailIt** is a transactional email API service for sending emails programmatically. This folder contains complete API documentation, examples, and screenshots to help you integrate EmailIt into your applications.

## Quick Start

### 1. API Basics

**Base URL:** `https://api.emailit.com`
**Authentication:** Bearer token (get from EmailIt workspace credentials)

### 2. Send Your First Email

```bash
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Hello World",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

### 3. Before You Can Send

You **must** verify your sending domain first:

1. Create sending domain via API or dashboard
2. Add DNS records (SPF, DKIM, DMARC) to your domain
3. Verify domain through EmailIt
4. Domain status changes to "verified" when ready

## What's Included in This Folder

### Documentation Files

| File | Purpose |
|------|---------|
| `claude.md` | Complete API reference (resources, endpoints, examples) |
| `emailit-operator.md` | Operator guide with code patterns and troubleshooting |
| `*.png` | Screenshots of EmailIt dashboard and documentation |

### Core API Resources

1. **Emails** - Send transactional emails
2. **Sending Domains** - Manage authorized domains
3. **Credentials** - API keys and SMTP credentials
4. **Audiences** - Manage contact lists
5. **Events** - Track email delivery (opens, clicks, bounces)
6. **Webhooks** - Real-time event notifications

## Common Use Cases

### Use Case 1: Send Welcome Email

```javascript
// Node.js example
const axios = require('axios');

async function sendWelcomeEmail(userEmail, userName) {
  await axios.post('https://api.emailit.com/v1/emails/send', {
    from: 'welcome@yourapp.com',
    to: userEmail,
    subject: 'Welcome to Our Service!',
    html: `
      <h1>Welcome, ${userName}!</h1>
      <p>Thank you for signing up.</p>
    `,
    tags: ['welcome', 'onboarding']
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.EMAILIT_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### Use Case 2: Password Reset Email

```python
# Python example
import requests

def send_password_reset(user_email, reset_token):
    response = requests.post(
        'https://api.emailit.com/v1/emails/send',
        headers={
            'Authorization': f'Bearer {os.getenv("EMAILIT_API_KEY")}',
            'Content-Type': 'application/json'
        },
        json={
            'from': 'noreply@yourapp.com',
            'to': user_email,
            'subject': 'Password Reset Request',
            'html': f'''
                <h2>Reset Your Password</h2>
                <p>Click the link below to reset your password:</p>
                <a href="https://yourapp.com/reset?token={reset_token}">
                    Reset Password
                </a>
            ''',
            'tags': ['password-reset', 'security']
        }
    )
    return response.json()
```

### Use Case 3: Order Confirmation

```javascript
// Send order confirmation with details
async function sendOrderConfirmation(order) {
  await emailItService.sendEmail({
    from: 'orders@yourstore.com',
    to: order.customerEmail,
    subject: `Order Confirmation #${order.id}`,
    html: `
      <h1>Thank you for your order!</h1>
      <h2>Order #${order.id}</h2>
      <p><strong>Total:</strong> $${order.total}</p>
      <p><strong>Estimated Delivery:</strong> ${order.deliveryDate}</p>
    `,
    tags: ['order', 'confirmation', `order-${order.id}`]
  });
}
```

## Setup Checklist

- [ ] Create EmailIt account and workspace
- [ ] Generate API credential (type: api)
- [ ] Add your sending domain
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Verify domain
- [ ] Send test email
- [ ] Set up webhooks for event tracking (optional)
- [ ] Implement error handling in your code

## Key Features

### Email Sending
- REST API or SMTP
- HTML and plain text support
- Attachments
- CC/BCC recipients
- Custom headers
- Email tagging for organization

### Domain Management
- Verify domain ownership
- SPF/DKIM/DMARC configuration
- Multiple domain support
- Domain verification status tracking

### Event Tracking
- email.sent
- email.delivered
- email.opened
- email.clicked
- email.bounced
- email.complained
- email.unsubscribed

### Webhooks
- Real-time event notifications
- Custom event subscriptions
- HTTPS endpoints
- Signature verification

## Environment Variables

Always use environment variables for sensitive data:

```bash
# .env
EMAILIT_API_KEY=your_api_key_here
EMAILIT_SMTP_USER=your_smtp_username
EMAILIT_SMTP_PASS=your_smtp_password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_REPLY_TO=support@yourdomain.com
```

## Error Handling Best Practices

```javascript
async function sendEmailWithRetry(emailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await sendEmail(emailData);
      return result;
    } catch (error) {
      const status = error.response?.status;

      // Don't retry client errors (4xx)
      if (status >= 400 && status < 500) {
        console.error('Client error:', error.response.data);
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

## Common Issues & Solutions

### Issue: Authentication Failed (401)
**Solution:** Verify API key is correct and credential type is "api" not "smtp"

### Issue: Email Not Sending (422)
**Solution:** Check that:
- Email addresses are valid
- Required fields present (from, to, subject, html/text)
- Sender domain is verified

### Issue: Domain Verification Failing
**Solution:**
1. Get DNS records from API: `GET /v1/sending-domains/{domain_id}`
2. Add all records exactly as specified
3. Wait for DNS propagation (up to 48 hours)
4. Retry verification: `POST /v1/sending-domains/{domain_id}/verify`

### Issue: Emails Going to Spam
**Solution:**
- Ensure SPF, DKIM, DMARC configured
- Start with low volume, increase gradually
- Remove bounced/complained addresses
- Use proper email formatting
- Avoid spam trigger words

## Where to Find More

### In This Folder
- `claude.md` - Complete API documentation
- `emailit-operator.md` - Code patterns and troubleshooting
- `*.png` - Dashboard screenshots

### Online Resources
- **Documentation:** https://docs.emailit.com
- **API Reference:** https://docs.emailit.com/api

## Integration Patterns

### Pattern 1: Service Class (Recommended)

Create a reusable EmailIt service:

```javascript
// services/emailit-service.js
class EmailItService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.emailit.com/v1';
  }

  async sendEmail({ from, to, subject, html, replyTo = null, tags = [] }) {
    const response = await fetch(`${this.baseURL}/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        reply_to: replyTo,
        tags
      })
    });

    if (!response.ok) {
      throw new Error(`EmailIt error: ${response.statusText}`);
    }

    return response.json();
  }
}

module.exports = EmailItService;
```

### Pattern 2: Template System

Organize email templates:

```javascript
// templates/welcome.js
module.exports = {
  subject: 'Welcome to {{app_name}}!',
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h1>Welcome, {{user_name}}!</h1>
      <p>Thank you for joining {{app_name}}.</p>
    </div>
  `
};

// Usage
const template = require('./templates/welcome');
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

### Pattern 3: Webhook Handler

```javascript
// routes/webhooks.js
router.post('/webhooks/emailit', async (req, res) => {
  const event = req.body;

  // Acknowledge receipt immediately
  res.status(200).json({ received: true });

  // Process event asynchronously
  switch (event.type) {
    case 'email.bounced':
      await markEmailInvalid(event.data.recipient);
      break;
    case 'email.complained':
      await unsubscribeUser(event.data.recipient);
      break;
    case 'email.opened':
      await trackEngagement(event.data.email_id);
      break;
  }
});
```

## Quick Reference Commands

```bash
# Send email
curl -X POST https://api.emailit.com/v1/emails/send \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d @email.json

# List sending domains
curl https://api.emailit.com/v1/sending-domains \
  -H "Authorization: Bearer $EMAILIT_API_KEY"

# Get email events
curl https://api.emailit.com/v1/events?email_id=email_123 \
  -H "Authorization: Bearer $EMAILIT_API_KEY"

# Create webhook
curl -X POST https://api.emailit.com/v1/webhooks \
  -H "Authorization: Bearer $EMAILIT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourapp.com/webhooks/emailit",
    "events": ["email.delivered", "email.bounced"]
  }'
```

## Testing Your Integration

1. **Test Email Sending**
   - Send to your own email first
   - Verify email arrives and looks correct
   - Check spam folder

2. **Test Webhooks**
   - Use ngrok to expose local endpoint
   - Register webhook with ngrok URL
   - Trigger events and verify webhook receives them

3. **Test Error Handling**
   - Try invalid email addresses
   - Test with invalid API key
   - Verify retry logic works

## Security Reminders

- **Never commit API keys to version control**
- Store keys in environment variables
- Use separate keys for dev/production
- Rotate keys periodically
- Use HTTPS for webhook endpoints
- Verify webhook signatures

---

**Need Help?**
- Read `claude.md` for complete API reference
- Read `emailit-operator.md` for code patterns and troubleshooting
- Check screenshots in this folder for dashboard guidance
