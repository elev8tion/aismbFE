#!/bin/bash

# CRM Agent System Test Runner
# Runs comprehensive integration tests for CRM voice agent

set -e

echo "═══════════════════════════════════════════════════════════════════════════"
echo "CRM Agent System Tests"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
TRACE=false
DEV_SERVER_RUNNING=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --trace)
      TRACE=true
      shift
      ;;
    --dev-running)
      DEV_SERVER_RUNNING=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./run-system-tests.sh [--trace] [--dev-running]"
      exit 1
      ;;
  esac
done

# Note: CRM tests mostly check configuration, not live API (requires auth)
echo -e "${BLUE}ℹ️  CRM tests verify configuration and code structure${NC}"
echo -e "${BLUE}ℹ️  Live API tests require authentication (manual testing recommended)${NC}"
echo ""

# Set environment variables
export TRACE=$TRACE
export API_BASE=http://localhost:3000

# Run tests
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Running CRM System Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Run the tests
if npm test -- __tests__/integration/crmAgent.system.test.ts; then
  echo ""
  echo -e "${GREEN}✅ All system tests passed!${NC}"
  TEST_RESULT=0
else
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  TEST_RESULT=1
fi

# Show report location
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Reports${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  JSON: ${GREEN}test-reports/crm-agent-system-report.json${NC}"
echo ""
echo -e "${BLUE}View report:${NC}"
echo -e "  cat test-reports/crm-agent-system-report.json | jq"
echo ""

exit $TEST_RESULT
