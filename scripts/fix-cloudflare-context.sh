#!/bin/bash

# Fix all getRequestContext() calls to use getOptionalRequestContext()
# This enables local development and testing

echo "Fixing Cloudflare context calls across all CRM API routes..."

# Find all TypeScript files in app/api
find app/api -name "*.ts" -type f | while read -r file; do
  if grep -q "from '@cloudflare/next-on-pages'" "$file"; then
    echo "Processing: $file"

    # Replace getRequestContext with getOptionalRequestContext in import
    sed -i '' "s/{ getRequestContext }/{ getOptionalRequestContext }/g" "$file"
    sed -i '' "s/, getRequestContext/, getOptionalRequestContext/g" "$file"
    sed -i '' "s/getRequestContext,/getOptionalRequestContext,/g" "$file"

    # Replace usage: const { env } = getRequestContext();
    # to: const ctx = getOptionalRequestContext(); const env = (ctx?.env || process.env) as any;
    sed -i '' "s/const { env } = getRequestContext()/const ctx = getOptionalRequestContext(); const env = (ctx?.env || process.env) as any/g" "$file"

    # Replace usage: const { env: cfEnv } = getRequestContext();
    sed -i '' "s/const { env: cfEnv } = getRequestContext()/const ctx = getOptionalRequestContext(); const cfEnv = (ctx?.env || process.env) as any/g" "$file"

    # Replace other patterns
    sed -i '' "s/const context = getRequestContext()/const context = getOptionalRequestContext()/g" "$file"
    sed -i '' "s/const ctx = getRequestContext()/const ctx = getOptionalRequestContext()/g" "$file"

    echo "  ✅ Fixed: $file"
  fi
done

echo ""
echo "Done! Run tests to verify:"
echo "  npm run dev"
echo "  ./scripts/run-system-tests.sh --trace --dev-running"
