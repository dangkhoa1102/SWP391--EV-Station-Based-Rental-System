#!/bin/bash

# Test Admin Account - Curl Commands
# 
# S? d?ng script này ?? test tài kho?n admin
# 
# Cách ch?y:
#   chmod +x test-admin-account.sh
#   ./test-admin-account.sh
# 
# Ho?c ch?y t?ng l?nh riêng bi?t

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
ADMIN_EMAIL="admin@ev.com"
ADMIN_PASSWORD="admin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}?? Admin Account Test Suite${NC}"
echo -e "${BLUE}API Base URL: $API_URL${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Admin Login
echo -e "${YELLOW}?? Test 1: Admin Login${NC}"
echo -e "${YELLOW}Sending credentials...${NC}\n"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/Login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo -e "${GREEN}Response:${NC}"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token from response
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty' 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "\n${RED}? Failed to extract access token${NC}"
  exit 1
fi

echo -e "\n${GREEN}? Login Successful!${NC}"
echo -e "${GREEN}Access Token: ${ACCESS_TOKEN:0:50}...${NC}\n"

# Test 2: Get Current User
echo -e "${YELLOW}?? Test 2: Get Current User${NC}"
echo -e "${YELLOW}Using token to fetch current user info...${NC}\n"

USER_RESPONSE=$(curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo -e "${GREEN}Response:${NC}"
echo "$USER_RESPONSE" | jq '.' 2>/dev/null || echo "$USER_RESPONSE"

# Test 3: Verify Admin Details
echo -e "\n${YELLOW}?? Test 3: Verify Admin Details${NC}\n"

# Extract user data
if echo "$USER_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  USER_DATA=$(echo "$USER_RESPONSE" | jq '.data')
elif echo "$USER_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
  USER_DATA="$USER_RESPONSE"
else
  echo -e "${RED}? Could not parse user response${NC}"
  exit 1
fi

# Verify fields
EMAIL=$(echo "$USER_DATA" | jq -r '.email // empty')
ROLE=$(echo "$USER_DATA" | jq -r '.userRole // empty')
FIRST_NAME=$(echo "$USER_DATA" | jq -r '.firstName // empty')
LAST_NAME=$(echo "$USER_DATA" | jq -r '.lastName // empty')
IS_ACTIVE=$(echo "$USER_DATA" | jq -r '.isActive // empty')
USER_ID=$(echo "$USER_DATA" | jq -r '.id // empty')

echo -e "Email: ${BLUE}$EMAIL${NC}"
echo -e "Role: ${BLUE}$ROLE${NC}"
echo -e "Name: ${BLUE}$FIRST_NAME $LAST_NAME${NC}"
echo -e "Active: ${BLUE}$IS_ACTIVE${NC}"
echo -e "User ID: ${BLUE}$USER_ID${NC}\n"

# Verification checks
echo -e "${YELLOW}Verification Checks:${NC}"

if [ "$EMAIL" = "admin@ev.com" ]; then
  echo -e "${GREEN}?${NC} Email is correct"
else
  echo -e "${RED}?${NC} Email is incorrect (expected: admin@ev.com, got: $EMAIL)"
fi

if [ "$ROLE" = "Admin" ]; then
  echo -e "${GREEN}?${NC} Role is correct"
else
  echo -e "${RED}?${NC} Role is incorrect (expected: Admin, got: $ROLE)"
fi

if [ "$FIRST_NAME" = "Admin" ] && [ "$LAST_NAME" = "User" ]; then
  echo -e "${GREEN}?${NC} Name is correct"
else
  echo -e "${RED}?${NC} Name is incorrect (expected: Admin User, got: $FIRST_NAME $LAST_NAME)"
fi

if [ "$IS_ACTIVE" = "true" ]; then
  echo -e "${GREEN}?${NC} Account is active"
else
  echo -e "${RED}?${NC} Account is not active"
fi

if [ "$USER_ID" = "00000000-0000-0000-0000-000000000001" ]; then
  echo -e "${GREEN}?${NC} User ID is correct"
else
  echo -e "${RED}?${NC} User ID is incorrect (expected: 00000000-0000-0000-0000-000000000001, got: $USER_ID)"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}?? All tests completed!${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Additional commands reference
echo -e "${YELLOW}Additional Commands:${NC}\n"

echo "1. Test with invalid password:"
echo "   curl -X POST $API_URL/api/auth/Login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"admin@ev.com\", \"password\": \"wrongpassword\"}'"
echo ""

echo "2. Test with invalid email:"
echo "   curl -X POST $API_URL/api/auth/Login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"nonexistent@ev.com\", \"password\": \"admin\"}'"
echo ""

echo "3. Get user without token (should fail):"
echo "   curl -X GET $API_URL/api/auth/me"
echo ""

