# @kre8tion/shared-types

**Shared TypeScript types and interfaces for the KRE8TION platform**

Single source of truth for types used across:
- **Landing Page** (`ai-smb-partners`)
- **CRM** (`ai_smb_crm_frontend`)

---

## 📦 Installation

```bash
npm install @kre8tion/shared-types
```

or

```bash
pnpm add @kre8tion/shared-types
```

---

## 🚀 Usage

### Basic Import

```typescript
import {
  UnifiedBooking,
  UnifiedROICalculation,
  AgentResponse,
  User,
} from '@kre8tion/shared-types';
```

### Category-Specific Imports

```typescript
// Booking types
import {
  BookingFormData,
  UnifiedBooking,
  toLandingPageBooking,
  toCRMBooking,
} from '@kre8tion/shared-types';

// Voice agent types
import {
  ConversationMessage,
  ChatRequest,
  AgentResponse,
  ToolExecutionContext,
} from '@kre8tion/shared-types';

// ROI types
import {
  ROIResults,
  TaskCategory,
  TierConfig,
  TASK_CATEGORIES,
  TIER_DATA,
} from '@kre8tion/shared-types';

// Auth types
import {
  User,
  UserRole,
  AuthSession,
  SignInRequest,
  SignUpRequest,
} from '@kre8tion/shared-types';
```

### Validation with Zod

```typescript
import {
  bookingFormDataSchema,
  chatRequestSchema,
  validate,
} from '@kre8tion/shared-types';

// Validate booking form data
const result = validate(bookingFormDataSchema, formData);

if (result.success) {
  // Type-safe access
  const booking = result.data;
  console.log(booking.email); // Type: string
} else {
  // Handle validation errors
  console.error(result.errors);
}

// Direct parsing
const chatRequest = chatRequestSchema.parse(request.body);
```

---

## 📚 Type Categories

### 1. **Booking Types** (`booking.ts`)

Unified booking interfaces for consultations, assessments, and calendar integrations.

**Key Types:**
- `UnifiedBooking` - Platform-agnostic booking format
- `LandingPageBooking` - Landing page database format
- `CRMBooking` - CRM database format
- `BookingFormData` - Form submission data
- `AvailabilitySetting` - Weekly availability configuration
- `TimeSlot` - Available booking time slots

**Transformation Utilities:**
- `toUnifiedBooking()` - Convert from either format to unified
- `toLandingPageBooking()` - Convert unified to landing page format
- `toCRMBooking()` - Convert unified to CRM format

**Example:**
```typescript
import { UnifiedBooking, toLandingPageBooking } from '@kre8tion/shared-types';

const unified: UnifiedBooking = {
  id: '123',
  type: 'consultation',
  status: 'confirmed',
  guest: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  booking: {
    date: '2026-03-01',
    startTime: '14:00',
    endTime: '14:30',
    timezone: 'America/Los_Angeles',
  },
  createdAt: new Date().toISOString(),
};

// Convert to landing page format
const landingBooking = toLandingPageBooking(unified);
```

---

### 2. **Voice Agent Types** (`voice-agent.ts`)

Interfaces for voice agent functionality, conversations, and tool execution.

**Key Types:**
- `ConversationMessage` - Chat message structure
- `VoiceSession` - Complete session data
- `AgentResponse` - AI response with actions
- `ToolExecutionContext` - Tool execution environment
- `ToolResult` - Tool execution result
- `ClientAction` - UI actions triggered by agent

**Example:**
```typescript
import { ChatRequest, AgentResponse } from '@kre8tion/shared-types';

const chatRequest: ChatRequest = {
  sessionId: 'session-123',
  question: 'What services do you offer?',
  language: 'en',
  pagePath: '/services',
};

const agentResponse: AgentResponse = {
  response: 'We offer AI automation services...',
  clientActions: [
    {
      type: 'SCROLL_TO',
      payload: { elementId: 'services-section' },
      timestamp: new Date().toISOString(),
    },
  ],
};
```

---

### 3. **ROI Types** (`roi.ts`)

ROI calculation interfaces with guaranteed consistency across projects.

**Key Types:**
- `ROIResults` - Complete calculation results
- `TaskCategory` - Automation task categories
- `TierConfig` - Service tier configuration
- `UnifiedROICalculation` - Platform-agnostic ROI data

**Constants:**
- `TASK_CATEGORIES` - Pre-defined task types with automation rates
- `TIER_DATA` - Service tier pricing and features

**Example:**
```typescript
import { ROIResults, TIER_DATA } from '@kre8tion/shared-types';

const results: ROIResults = {
  taskBreakdown: [],
  automatedTasks: [],
  totalWeeklyHoursSaved: 15,
  weeklyLaborSavings: 1500,
  recoveredLeads: 5,
  monthlyRevenueRecovery: 10000,
  totalWeeklyBenefit: 3500,
  annualBenefit: 182000,
  investment: 9500,
  roi: 1815.79, // 1816% ROI
  paybackWeeks: 2.7,
  consultantCost: 50000,
  agencyCost: 100000,
};

// Access tier configuration
const foundationTier = TIER_DATA.foundation;
console.log(foundationTier.cost); // 9500
```

---

### 4. **Auth Types** (`auth.ts`)

Authentication and authorization types for user sessions and roles.

**Key Types:**
- `User` - User account data
- `UserProfile` - Extended user profile
- `AuthSession` - Active session data
- `UserRole` - Role enum (admin, team_member, customer)
- `Permission` - Permission enum

**Example:**
```typescript
import { User, UserRole, DEFAULT_ROLE_PERMISSIONS } from '@kre8tion/shared-types';

const user: User = {
  id: 1,
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  emailVerified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Check permissions
const adminPermissions = DEFAULT_ROLE_PERMISSIONS.find(
  (rp) => rp.role === 'admin'
);
console.log(adminPermissions?.permissions); // All permissions
```

---

### 5. **Email Types** (`email.ts`)

Email templates, sending, and webhook handling.

**Key Types:**
- `EmailTemplate` - Template structure
- `EmailMessage` - Complete email data
- `SendEmailRequest` - API request format
- `EmailWebhookPayload` - Webhook event data

**Constants:**
- `EMAIL_TEMPLATES` - Pre-defined email templates

**Example:**
```typescript
import { SendEmailRequest, EMAIL_TEMPLATES } from '@kre8tion/shared-types';

const emailRequest: SendEmailRequest = {
  to: 'customer@example.com',
  subject: 'Booking Confirmed',
  html: '<h1>Your booking is confirmed!</h1>',
  templateId: 'booking_confirmation',
  templateData: {
    name: 'John Doe',
    date: 'March 1, 2026',
    time: '2:00 PM',
  },
};

// Access template
const template = EMAIL_TEMPLATES.booking_confirmation;
console.log(template.variables); // ['name', 'date', 'time', ...]
```

---

### 6. **Payment Types** (`payment.ts`)

Payment processing, Stripe integration, and invoicing.

**Key Types:**
- `StripeCheckoutSession` - Stripe session data
- `PaymentRecord` - Payment transaction record
- `Invoice` - Invoice structure
- `PricingTier` - Service pricing

**Constants:**
- `PRICING_TIERS` - Service tier pricing

**Example:**
```typescript
import { CreateCheckoutSessionRequest, PRICING_TIERS } from '@kre8tion/shared-types';

const checkoutRequest: CreateCheckoutSessionRequest = {
  amount: 25000, // $250 in cents
  description: 'AI Implementation Assessment',
  customerEmail: 'customer@example.com',
  successUrl: 'https://kre8tion.com/payment/success',
  cancelUrl: 'https://kre8tion.com/payment/cancel',
};

// Access pricing
const foundationTier = PRICING_TIERS.find((t) => t.id === 'foundation');
console.log(foundationTier?.price); // 150000 ($1,500/month)
```

---

### 7. **Common Types** (`common.ts`)

Base types and utilities used across all categories.

**Key Types:**
- `Language` - 'en' | 'es'
- `ISODateString` - YYYY-MM-DD format
- `TimeString` - HH:mm format
- `APIResponse<T>` - Standard API response wrapper
- `ValidationResult` - Validation result structure

**Example:**
```typescript
import { APIResponse, Language, ISODateString } from '@kre8tion/shared-types';

const response: APIResponse<{ bookingId: string }> = {
  success: true,
  data: { bookingId: '123' },
};

const language: Language = 'en';
const date: ISODateString = '2026-03-01';
```

---

### 8. **Validation Schemas** (`schemas.ts`)

Zod schemas for runtime validation.

**Key Schemas:**
- `bookingFormDataSchema` - Booking form validation
- `chatRequestSchema` - Chat request validation
- `signInRequestSchema` - Sign-in validation
- `sendEmailRequestSchema` - Email sending validation

**Utilities:**
- `validate()` - Type-safe validation helper
- `formatZodErrors()` - Format errors for API responses

**Example:**
```typescript
import {
  chatRequestSchema,
  validate,
  formatZodErrors,
} from '@kre8tion/shared-types';

// Validate API request
const result = validate(chatRequestSchema, req.body);

if (!result.success) {
  const errors = formatZodErrors(result.errors);
  return res.status(400).json({ errors });
}

// Type-safe access
const { sessionId, question, language } = result.data;
```

---

## 🔄 Transformation Utilities

### Booking Transformations

```typescript
import {
  UnifiedBooking,
  LandingPageBooking,
  CRMBooking,
  toUnifiedBooking,
  toLandingPageBooking,
  toCRMBooking,
} from '@kre8tion/shared-types';

// From landing page format
const landingBooking: LandingPageBooking = { /* ... */ };
const unified = toUnifiedBooking(landingBooking);

// From CRM format
const crmBooking: CRMBooking = { /* ... */ };
const unified2 = toUnifiedBooking(crmBooking);

// To landing page format
const backToLanding = toLandingPageBooking(unified);

// To CRM format (requires user_id)
const toCRM = toCRMBooking(unified, 123);
```

### ROI Transformations

```typescript
import {
  UnifiedROICalculation,
  toUnifiedROI,
} from '@kre8tion/shared-types';

// From either landing page or CRM format
const landingROI: LandingPageROICalculation = { /* ... */ };
const unified = toUnifiedROI(landingROI);
```

---

## 🧪 Testing

The package includes comprehensive type tests to ensure compatibility.

```bash
npm run test
```

---

## 📖 Documentation

### Type-Level Documentation

All types include JSDoc comments for IDE intellisense:

```typescript
/**
 * Unified booking interface for both Landing Page and CRM.
 * Use transformation utilities to convert between formats.
 */
export interface UnifiedBooking {
  /** Unique booking identifier */
  id: string;

  /** Booking type (consultation or assessment) */
  type: BookingType;

  // ...
}
```

### Usage in Projects

#### Landing Page (`ai-smb-partners`)

```typescript
// In app/api/bookings/route.ts
import {
  UnifiedBooking,
  toLandingPageBooking,
  bookingFormDataSchema,
} from '@kre8tion/shared-types';

export async function POST(request: Request) {
  // Validate input
  const body = await request.json();
  const validation = validate(bookingFormDataSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: validation.errors },
      { status: 400 }
    );
  }

  // Type-safe access
  const formData = validation.data;

  // ... create booking logic

  return NextResponse.json({ success: true, booking });
}
```

#### CRM (`ai_smb_crm_frontend`)

```typescript
// In app/api/data/bookings/route.ts
import {
  UnifiedBooking,
  toCRMBooking,
  CRMBooking,
} from '@kre8tion/shared-types';

export async function POST(request: Request) {
  const unified: UnifiedBooking = await request.json();

  // Transform to CRM format
  const crmBooking = toCRMBooking(unified, session.userId);

  // Save to NCB database
  const saved = await ncb.create('bookings', crmBooking);

  return NextResponse.json({ success: true, booking: saved });
}
```

---

## 🔧 Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Lint

```bash
npm run lint
```

### Type Check

```bash
npm run typecheck
```

---

## 📦 Publishing

```bash
# Bump version
npm version patch|minor|major

# Build and publish
npm run prepublishOnly
npm publish
```

---

## 🤝 Contributing

1. Make changes in `src/`
2. Run type check: `npm run typecheck`
3. Build: `npm run build`
4. Test in projects by linking:
   ```bash
   # In this package
   npm link

   # In landing page or CRM
   npm link @kre8tion/shared-types
   ```

---

## 📋 Changelog

### v1.0.0 (2026-02-13)

- Initial release
- Booking types with transformation utilities
- Voice agent types
- ROI calculation types
- Auth types
- Email types
- Payment types
- Zod validation schemas
- Common utility types

---

## 📄 License

MIT © ELEV8TION

---

## 🔗 Related Packages

- `@kre8tion/voice-core` - Voice agent core (coming soon)
- `@kre8tion/roi-engine` - ROI calculation engine (coming soon)
- `@kre8tion/booking-system` - Booking system (coming soon)
- `@kre8tion/email-service` - Email service (coming soon)

---

**Questions?** Open an issue at [github.com/ELEV8TION/kre8tion-workspace](https://github.com/ELEV8TION/kre8tion-workspace)
