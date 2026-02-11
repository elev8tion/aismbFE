# EmailIt API Documentation

EmailIt is a transactional email API service that allows you to send emails programmatically and manage email infrastructure through a REST API.

## Base Information

- **Base URL**: `https://api.emailit.com`
- **Authentication**: Bearer token authentication
- **API Key Location**: Generated in workspace credentials with API type
- **Documentation**: https://docs.emailit.com

## Authentication

All API requests require Bearer authentication using an API key generated from your EmailIt workspace.

### Example Request with Bearer Auth

```bash
curl -X POST 'https://api.emailit.com/v1/emails/send' \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "name <test@emailit.com>",
    "to": "recipient@emailit.com",
    "reply_to": "support@emailit.com",
    "subject": "Hello World",
    "html": "<h1>Hello World</h1>"
  }'
```

**Important**: Never commit your EmailIt API key to version control.

## Core Resources

### 1. Emails

Send transactional emails through the API.

#### Send Email Endpoint

- **Endpoint**: `POST /v1/emails/send`
- **Required Headers**:
  - `Authorization: Bearer {api_key}`
  - `Content-Type: application/json`

#### Required Email Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `from` | string | Sender email address |
| `to` | string | Recipient email address |
| `subject` | string | Email subject line |
| `html` or `text` | string | Email body content |

#### Optional Email Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `reply_to` | string | Reply-to email address |
| `cc` | string | CC recipients |
| `bcc` | string | BCC recipients |
| `attachments` | array | File attachments |
| `headers` | object | Custom email headers |
| `tags` | array | Tags for categorization |

#### Example Send Email Request

```json
{
  "from": "sender@yourdomain.com",
  "to": "recipient@example.com",
  "subject": "Welcome to our service",
  "html": "<h1>Welcome!</h1><p>Thank you for signing up.</p>",
  "reply_to": "support@yourdomain.com",
  "tags": ["onboarding", "welcome"]
}
```

### 2. Sending Domains

Manage domains authorized to send emails through EmailIt.

#### Key Operations

- **List sending domains**: `GET /v1/sending-domains`
- **Create sending domain**: `POST /v1/sending-domains`
- **Get sending domain**: `GET /v1/sending-domains/{domain_id}`
- **Delete sending domain**: `DELETE /v1/sending-domains/{domain_id}`
- **Verify sending domain**: `POST /v1/sending-domains/{domain_id}/verify`

#### Creating a Sending Domain

Before sending emails, you must create and verify a sending domain:

1. Add domain via API or dashboard
2. Add DNS records (SPF, DKIM, DMARC) to your domain
3. Verify domain ownership through EmailIt
4. Domain status changes to "verified" when DNS records are correct

#### Required DNS Records

- **SPF Record**: Authorizes EmailIt servers to send from your domain
- **DKIM Record**: Cryptographic signature for email authentication
- **DMARC Record**: Policy for handling authentication failures
- **Custom Return Path** (optional): For tracking bounces

### 3. Credentials

API keys and SMTP credentials for authentication.

#### Credential Types

1. **API Type**: For REST API access (Bearer token)
2. **SMTP Type**: For sending via SMTP protocol

#### Key Operations

- **List credentials**: `GET /v1/credentials`
- **Create credential**: `POST /v1/credentials`
- **Get credential**: `GET /v1/credentials/{credential_id}`
- **Delete credential**: `DELETE /v1/credentials/{credential_id}`
- **Rotate credential**: `POST /v1/credentials/{credential_id}/rotate`

#### Creating an API Credential

```json
{
  "name": "Production API Key",
  "type": "api",
  "workspace_id": "ws_123456789"
}
```

### 4. Audiences

Manage email contact lists and subscribers.

#### Key Operations

- **List audiences**: `GET /v1/audiences`
- **Create audience**: `POST /v1/audiences`
- **Get audience**: `GET /v1/audiences/{audience_id}`
- **Update audience**: `PATCH /v1/audiences/{audience_id}`
- **Delete audience**: `DELETE /v1/audiences/{audience_id}`
- **Add contacts**: `POST /v1/audiences/{audience_id}/contacts`
- **Remove contacts**: `DELETE /v1/audiences/{audience_id}/contacts`

#### Audience Object

```json
{
  "id": "aud_123456789",
  "name": "Newsletter Subscribers",
  "description": "Monthly newsletter recipients",
  "contact_count": 1500,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 5. Events

Track email delivery events and status changes.

#### Event Types

| Event Type | Description |
|------------|-------------|
| `email.sent` | Email was successfully sent |
| `email.delivered` | Email was delivered to recipient |
| `email.opened` | Recipient opened the email |
| `email.clicked` | Recipient clicked a link |
| `email.bounced` | Email bounced (hard or soft) |
| `email.complained` | Recipient marked as spam |
| `email.unsubscribed` | Recipient unsubscribed |

#### Event Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique event ID |
| `type` | string | Event type (see above) |
| `email_id` | string | Associated email ID |
| `created_at` | timestamp | When event occurred |
| `data` | object | Additional event data |

#### List Events

```bash
curl -X GET 'https://api.emailit.com/v1/events?email_id=email_123' \
  -H "Authorization: Bearer {api_key}"
```

#### Example Event Response

```json
{
  "events": [
    {
      "id": "evt_123456789",
      "type": "email.delivered",
      "email_id": "email_987654321",
      "created_at": "2025-01-03T10:30:00Z",
      "data": {
        "recipient": "user@example.com",
        "smtp_response": "250 Message accepted"
      }
    }
  ]
}
```

### 6. Webhooks

Receive real-time notifications for email events.

#### Registering Webhooks

To register a webhook, you need:
- A URL endpoint that EmailIt can POST to
- Event types you want to listen for
- (Optional) A webhook name/description

#### Webhook Configuration

```json
{
  "url": "https://yourapp.com/webhooks/emailit",
  "name": "Production Webhook",
  "events": ["email.delivered", "email.bounced", "email.complained"]
}
```

#### Consuming Webhooks

When an event occurs, EmailIt sends a POST request to your webhook URL:

```json
{
  "event_id": "evt_123456789",
  "type": "email.delivered",
  "data": {
    "email_id": "email_987654321",
    "recipient": "user@example.com",
    "timestamp": "2025-01-03T10:30:00Z"
  }
}
```

#### Webhook Security

- Verify webhook signatures to ensure requests are from EmailIt
- Use HTTPS endpoints for webhook URLs
- Implement idempotency to handle duplicate webhook deliveries

## Error Handling

EmailIt uses standard HTTP status codes to indicate success or failure.

### Status Code Categories

#### 2xx - Success
- `200 OK`: Request successful
- `201 Created`: Resource created successfully

#### 4xx - Client Errors
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error

#### 5xx - Server Errors
- `500 Internal Server Error`: EmailIt server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid email address format",
    "details": {
      "field": "to",
      "value": "invalid-email"
    }
  }
}
```

### Best Practices for Error Handling

- Check status codes before parsing response
- Implement retry logic for 5xx errors with exponential backoff
- Validate input before making API requests
- Log errors for debugging
- 95% of reported errors are user errors - check your code first

## SMTP Integration

EmailIt also supports sending emails via SMTP protocol.

### SMTP Credentials

1. Create SMTP-type credential in workspace
2. Use generated username and password
3. Configure SMTP client with EmailIt SMTP server

### SMTP Server Settings

- **Host**: `smtp.emailit.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Authentication**: Required
- **Username**: From SMTP credential
- **Password**: From SMTP credential

### Example SMTP Configuration (Node.js)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.emailit.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'smtp_username',
    pass: 'smtp_password'
  }
});

await transporter.sendMail({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Hello from SMTP',
  html: '<h1>Test Email</h1>'
});
```

## Getting Started Checklist

1. ✅ Create EmailIt account and workspace
2. ✅ Create API credential (type: api)
3. ✅ Add and verify sending domain
4. ✅ Configure DNS records (SPF, DKIM, DMARC)
5. ✅ Send test email via API
6. ✅ Set up webhooks for event tracking
7. ✅ Implement error handling and retry logic

## Rate Limits and Quotas

- Check your workspace plan for rate limits
- Implement exponential backoff for rate limit errors
- Monitor your sending quota and usage
- Contact support for limit increases if needed

## Security Best Practices

1. **API Key Management**
   - Store API keys in environment variables
   - Never commit keys to version control
   - Rotate keys periodically
   - Use separate keys for development/production

2. **Domain Security**
   - Implement DMARC policy (start with p=none for monitoring)
   - Use DKIM signing for all emails
   - Configure SPF records correctly
   - Monitor domain reputation

3. **Webhook Security**
   - Verify webhook signatures
   - Use HTTPS endpoints only
   - Implement rate limiting on webhook endpoints
   - Handle duplicate deliveries with idempotency

## Common Use Cases

### Transactional Emails
- Welcome emails
- Password reset emails
- Order confirmations
- Shipping notifications
- Account verification

### Notifications
- System alerts
- Activity updates
- Reminder emails
- Status changes

### Marketing (via Audiences)
- Newsletter campaigns
- Product announcements
- Event invitations
- Promotional emails

## Support and Resources

- **Documentation**: https://docs.emailit.com
- **API Reference**: https://docs.emailit.com/api
- **Status Page**: Check EmailIt status page for service health
- **Support**: Contact through EmailIt dashboard

## Integration Tips

1. Start with REST API for simplest integration
2. Use SMTP for compatibility with existing email libraries
3. Implement webhook handlers for real-time event tracking
4. Set up proper error handling and logging
5. Test thoroughly in development before production
6. Monitor email delivery rates and event metrics
7. Keep DNS records up to date
