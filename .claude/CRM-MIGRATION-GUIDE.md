# CRM Migration Guide: Shared Types & Zod Validation

**Project:** ai_smb_crm_frontend
**Estimated Time:** 8 hours
**Date Created:** February 13, 2026

---

## Prerequisites

- ✅ Landing page (ai-smb-partners) successfully deployed with shared-types
- ✅ `@kre8tion/shared-types` package built and tested
- ✅ Admin API key configured
- ⚠️ **BACKUP FIRST:** Ensure CRM has no uncommitted work

---

## Phase 1: Setup & Audit (1 hour)

### Step 1.1: Navigate to CRM Project
```bash
cd /Users/kcdacre8tor/ai_smb_crm_frontend
```

### Step 1.2: Create Backup Branch
```bash
git checkout -b backup-before-migration
git push origin backup-before-migration
git checkout main
git checkout -b feature/shared-types-migration
```

### Step 1.3: Audit Current State
```bash
# Find all type definition files
find . -name "*types*.ts" -not -path "./node_modules/*" -not -path "./.next/*"

# Find all API routes
find ./app/api -name "*.ts" -type f

# Search for manual validation (regex patterns)
grep -r "email.*@.*test\|phone.*regex\|validate" --include="*.ts" app/api/ | head -20
```

**Document findings in a file:**
```bash
cat > MIGRATION-NOTES.md << 'EOF'
# CRM Migration Notes

## Type Files Found:
[Paste output from find command]

## API Routes Found:
[Paste output from API find command]

## Manual Validation Found:
[Paste grep results]
EOF
```

### Step 1.4: Verify Current Build
```bash
npm run build
```
**✅ Checkpoint:** Build should succeed. If not, fix issues before proceeding.

---

## Phase 2: Link Shared Types Package (30 minutes)

### Step 2.1: Copy Shared Types to CRM
```bash
# Create packages directory if it doesn't exist
mkdir -p packages

# Copy shared-types from landing page project
cp -r /Users/kcdacre8tor/ai-smb-partners/packages/shared-types ./packages/

# Verify it was copied
ls -la packages/shared-types/
```

### Step 2.2: Update CRM package.json
```bash
# Read current package.json
cat package.json | jq '.dependencies["@kre8tion/shared-types"] = "file:./packages/shared-types"' > package.json.tmp && mv package.json.tmp package.json
```

**Or manually add to package.json:**
```json
{
  "dependencies": {
    "@kre8tion/shared-types": "file:./packages/shared-types"
  }
}
```

### Step 2.3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 2.4: Build Shared Types
```bash
cd packages/shared-types
npm run build
cd ../..
```

### Step 2.5: Test Import
Create a test file to verify imports work:
```bash
cat > test-import.ts << 'EOF'
import { LandingPageBooking, BookingType } from '@kre8tion/shared-types';
console.log('Import successful');
EOF

npx tsc test-import.ts --noEmit
rm test-import.ts
```

**✅ Checkpoint:** Import test should pass with no errors.

---

## Phase 3: Migrate Type Imports (3 hours)

### Step 3.1: Search for All Type Imports
```bash
# Find all imports from local types
grep -r "from ['\"].*types['\"]" . \
  --include="*.ts" \
  --include="*.tsx" \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./packages/shared-types/*" \
  > type-imports.txt

cat type-imports.txt
```

### Step 3.2: Categorize Files by Risk
Organize files into batches:

**Batch 1: Utility Files (Lowest Risk)**
- Files in `lib/` directory
- No user-facing impact if broken

**Batch 2: API Routes (Medium Risk)**
- Files in `app/api/` directory
- Server-side, can be tested with curl

**Batch 3: Components (Higher Risk)**
- Files in `components/` directory
- UI components, test in browser

**Batch 4: Pages (Highest Risk)**
- Files in `app/` page files
- Full page renders, most visible

### Step 3.3: Migrate Batch 1 - Utility Files

For each file found in `type-imports.txt` that's in `lib/`:

1. **Read the file:**
   ```bash
   cat lib/[filename].ts
   ```

2. **Identify what types are imported**

3. **Replace the import:**
   ```typescript
   // OLD:
   import { SomeType } from './types';
   import { SomeType } from '../types';

   // NEW:
   import { SomeType } from '@kre8tion/shared-types';

   // For CRM-specific types that might not exist in shared-types:
   import { LandingPageBooking as Booking } from '@kre8tion/shared-types';
   ```

4. **Verify after each file:**
   ```bash
   npx tsc --noEmit
   ```

5. **Commit after each batch:**
   ```bash
   git add lib/
   git commit -m "refactor: migrate lib types to shared-types"
   ```

### Step 3.4: Migrate Batch 2 - API Routes

Repeat the same process for files in `app/api/`:

```bash
# For each API file with type imports:
# 1. Read and understand imports
# 2. Replace with shared-types
# 3. Verify TypeScript
# 4. Test endpoint with curl
```

**After each API route migration:**
```bash
# Start dev server
npm run dev

# Test the endpoint
curl http://localhost:3000/api/[route-name]

# Verify no errors
```

**Commit after API routes:**
```bash
git add app/api/
git commit -m "refactor: migrate API routes to shared-types"
```

### Step 3.5: Migrate Batch 3 - Components

```bash
# For each component file:
# 1. Replace type imports
# 2. Verify TypeScript
# 3. Check component renders in browser
```

**Commit after components:**
```bash
git add components/
git commit -m "refactor: migrate components to shared-types"
```

### Step 3.6: Migrate Batch 4 - Pages

```bash
# For each page file:
# 1. Replace type imports
# 2. Verify TypeScript
# 3. Test page in browser
```

**Commit after pages:**
```bash
git add app/
git commit -m "refactor: migrate pages to shared-types"
```

### Step 3.7: Delete Local Type Files

**ONLY after ALL imports are migrated:**

```bash
# Verify no more imports from local types
grep -r "from ['\"]\..*types['\"]" . \
  --include="*.ts" \
  --include="*.tsx" \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./packages/shared-types/*"

# Should return EMPTY (only ROI or other non-booking types)

# Delete old type files
rm -f lib/types.ts
rm -f lib/booking/types.ts
# ... any other type files found in audit

# Commit deletion
git add -A
git commit -m "refactor: remove local type files (migrated to shared-types)"
```

**✅ Checkpoint:**
```bash
npm run build
# Should succeed with no errors
```

---

## Phase 4: Add Zod Validation to API Routes (2 hours)

### Step 4.1: Identify Routes with Manual Validation

From your audit in Phase 1, review `MIGRATION-NOTES.md` for routes with:
- Email regex validation
- Phone regex validation
- Manual validation functions

### Step 4.2: Check Available Schemas

```bash
# See what Zod schemas are available
cat packages/shared-types/src/schemas.ts | grep "export const"
```

Common schemas available:
- `createBookingRequestSchema`
- `adminBookingRequestSchema`
- `caldavConnectRequestSchema`
- `emailSchema`
- `phoneSchema`
- `urlSchema`
- `isoDateSchema`
- `timeSchema`

### Step 4.3: Migrate Each Route to Zod

For each API route with manual validation:

**BEFORE:**
```typescript
function validateRequest(data: unknown): SomeType | null {
  if (!data || typeof data !== 'object') return null;
  const req = data as Record<string, unknown>;

  if (typeof req.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email)) {
    return null;
  }
  // ... more validation

  return { /* validated data */ };
}

// In route handler:
const validated = validateRequest(await req.json());
if (!validated) {
  return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
}
```

**AFTER:**
```typescript
import { validate, formatZodErrors, [schemaName] } from '@kre8tion/shared-types';

// In route handler:
const validation = validate([schemaName], await req.json());
if (!validation.success) {
  return NextResponse.json({
    error: 'Validation failed',
    details: formatZodErrors(validation.errors)
  }, { status: 400 });
}
const validatedData = validation.data;
```

### Step 4.4: Create New Schemas if Needed

If CRM has unique validation requirements not in shared-types:

```bash
cd packages/shared-types/src
```

**Add to schemas.ts:**
```typescript
// Example: CRM-specific contact schema
export const crmContactRequestSchema = z.object({
  contact_name: z.string().min(2),
  contact_email: emailSchema,
  contact_phone: phoneSchema.optional(),
  company_name: z.string().optional(),
  // ... other fields
});
```

**Export from index.ts:**
```typescript
export {
  // ... existing exports
  crmContactRequestSchema,
} from './schemas';
```

**Rebuild shared-types:**
```bash
cd packages/shared-types
npm run build
cd ../..
```

### Step 4.5: Test Each Migrated Route

```bash
# Start dev server
npm run dev

# Test with valid data
curl -X POST http://localhost:3000/api/[route] \
  -H "Content-Type: application/json" \
  -d '{ "valid": "data" }'

# Test with invalid data (should return Zod errors)
curl -X POST http://localhost:3000/api/[route] \
  -H "Content-Type: application/json" \
  -d '{ "invalid": "data" }'
```

**Expected response for invalid data:**
```json
{
  "error": "Validation failed",
  "details": {
    "fieldName": ["Error message"]
  }
}
```

### Step 4.6: Commit After Each Route

```bash
git add app/api/[route-name]/
git commit -m "feat: add Zod validation to [route-name] API"
```

**✅ Checkpoint:**
```bash
npm run build
# All routes should build successfully
```

---

## Phase 5: Update Build Configuration (30 minutes)

### Step 5.1: Update package.json Build Script

Ensure shared-types is built before CRM:

```json
{
  "scripts": {
    "prebuild": "cd packages/shared-types && npm run build",
    "build": "next build",
    "pages:build": "...[existing]"
  }
}
```

### Step 5.2: Update next.config.ts

If not already present:

```typescript
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
  // ... other config
};
```

### Step 5.3: Test Full Build

```bash
npm run build
```

**✅ Checkpoint:** Build must succeed before deployment.

---

## Phase 6: Deploy CRM (1 hour)

### Step 6.1: Final Pre-deployment Checks

```bash
# 1. All tests pass (if you have tests)
npm test

# 2. TypeScript compiles
npx tsc --noEmit

# 3. Build succeeds
npm run build

# 4. Git status clean
git status
```

### Step 6.2: Merge to Main

```bash
# Push feature branch
git push origin feature/shared-types-migration

# Merge to main
git checkout main
git merge feature/shared-types-migration
```

### Step 6.3: Deploy to Cloudflare Pages

```bash
# Build for Cloudflare Pages
npm run pages:build

# Deploy
npx wrangler pages deploy .vercel/output/static \
  --project-name=ai-smb-crm \
  --commit-dirty=true \
  --no-bundle
```

### Step 6.4: Monitor Deployment

Watch the deployment logs for any errors.

**✅ Checkpoint:** Deployment should complete without errors.

---

## Phase 7: Production Testing (30 minutes)

### Test 1: CRM Authentication
```bash
# Test that CRM auth still works
curl https://app.kre8tion.com/api/auth/[endpoint]
```

### Test 2: CRM Data API
```bash
# Test that data APIs work
curl https://app.kre8tion.com/api/data/[endpoint]
```

### Test 3: Zod Validation in CRM
```bash
# Test invalid data returns structured errors
curl -X POST https://app.kre8tion.com/api/[some-route] \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# Should return:
# {"error":"Validation failed","details":{...}}
```

### Test 4: Manual CRM Testing
1. Log in to CRM at https://app.kre8tion.com
2. Navigate through all major features
3. Create/update/delete records
4. Verify no console errors
5. Verify all forms validate properly

---

## Rollback Procedures

### If Issues Found Before Deployment

```bash
# Discard all changes
git reset --hard origin/main

# Or revert specific commits
git revert [commit-hash]
```

### If Issues Found After Deployment

```bash
# Rollback to previous deployment in Cloudflare dashboard
# Or redeploy from backup branch:

git checkout backup-before-migration
npm run pages:build
npx wrangler pages deploy .vercel/output/static \
  --project-name=ai-smb-crm \
  --commit-dirty=true \
  --no-bundle
```

---

## Troubleshooting Guide

### Issue: "Cannot find module '@kre8tion/shared-types'"

**Solution:**
```bash
cd packages/shared-types
npm run build
cd ../..
npm install --legacy-peer-deps
```

### Issue: TypeScript errors about missing types

**Solution:**
1. Check if type exists in shared-types:
   ```bash
   cat packages/shared-types/src/index.ts | grep [TypeName]
   ```
2. If missing, either:
   - Add it to shared-types
   - Create CRM-specific type file

### Issue: Zod validation not working

**Solution:**
1. Verify schema is exported from shared-types
2. Check schema matches your data structure
3. Use `console.log(validation)` to debug

### Issue: Build fails with "Module not found"

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Rebuild shared-types
cd packages/shared-types && npm run build && cd ../..

# Try build again
npm run build
```

---

## Verification Checklist

Before marking migration as complete, verify:

- [ ] All local type imports migrated to `@kre8tion/shared-types`
- [ ] Local type files deleted
- [ ] `npm run build` succeeds
- [ ] All API routes use Zod validation
- [ ] Error responses use `formatZodErrors()`
- [ ] CRM deploys successfully
- [ ] Production tests pass
- [ ] No console errors in production
- [ ] All CRM features working

---

## Post-Migration Cleanup

### Update Documentation
```bash
# Add to CRM README
echo "## Type System

This project uses \`@kre8tion/shared-types\` for type definitions.

To rebuild types:
\`\`\`bash
cd packages/shared-types && npm run build
\`\`\`
" >> README.md
```

### Update Memory Files
Document learnings in `.claude/memory/` for future reference.

---

## Success Criteria

**Migration is successful when:**

1. ✅ CRM builds without errors
2. ✅ All imports from `@kre8tion/shared-types`
3. ✅ All API routes use Zod validation
4. ✅ Deployment succeeds
5. ✅ Production tests pass
6. ✅ No regressions in functionality
7. ✅ Consistent error handling across all routes

---

## Estimated Timeline

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Setup & Audit | 1 hour | LOW |
| Phase 2: Link Shared Types | 30 min | LOW |
| Phase 3: Migrate Type Imports | 3 hours | MEDIUM |
| Phase 4: Add Zod Validation | 2 hours | MEDIUM |
| Phase 5: Update Build Config | 30 min | LOW |
| Phase 6: Deploy CRM | 1 hour | MEDIUM |
| Phase 7: Production Testing | 30 min | LOW |
| **TOTAL** | **8.5 hours** | **Over 1-2 days** |

---

## Notes

- Work in batches and commit frequently
- Test after each batch
- Don't rush - thoroughness prevents issues
- Keep backup branch until fully verified
- CRM is separate from landing page - can't break it

---

**Good luck! Follow each step carefully and you'll have a consistent, type-safe CRM.**
