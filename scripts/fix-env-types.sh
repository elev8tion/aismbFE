#!/bin/bash

# Replace all manual env extraction with typed helper

echo "Fixing environment variable types..."

find app/api -name "*.ts" -type f | while read -r file; do
  if grep -q "getOptionalRequestContext" "$file"; then
    echo "Processing: $file"

    # Add import if not present
    if ! grep -q "import { getEnv }" "$file"; then
      # Replace the getOptionalRequestContext import
      sed -i '' "s/import { getOptionalRequestContext } from '@cloudflare\/next-on-pages';/import { getEnv } from '@\/lib\/cloudflare\/env';/g" "$file"
    fi

    # Replace the pattern: const ctx = getOptionalRequestContext(); const env = (ctx?.env || process.env) as any;
    # With: const env = getEnv();
    sed -i '' "s/const ctx = getOptionalRequestContext(); const env = (ctx?.env || process\.env) as any;/const env = getEnv();/g" "$file"

    # Also replace variant: const ctx = getOptionalRequestContext(); const cfEnv = (ctx?.env || process.env) as any;
    sed -i '' "s/const ctx = getOptionalRequestContext(); const cfEnv = (ctx?.env || process\.env) as any;/const cfEnv = getEnv();/g" "$file"

    echo "  ✅ Fixed: $file"
  fi
done

echo ""
echo "Done! Run build to verify:"
echo "  npm run build"
