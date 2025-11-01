#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://localhost:5001/api/v1"
TOKEN=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RESCULANCE API Testing${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Login
echo -e "${BLUE}[1] Testing Login API...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@resculance.com", "password": "Admin@123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
else
    echo -e "${RED}✗ Login failed${NC}"
    exit 1
fi

# Test 2: Get Profile
echo -e "${BLUE}[2] Testing Get Profile API...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "${API_URL}/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Profile retrieved${NC}"
else
    echo -e "${RED}✗ Profile failed${NC}"
fi

# Test 3: Get Organizations
echo -e "${BLUE}[3] Testing Get Organizations API...${NC}"
ORG_RESPONSE=$(curl -s -X GET "${API_URL}/organizations" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ORG_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Organizations retrieved${NC}"
else
    echo -e "${RED}✗ Organizations failed${NC}"
fi

# Test 4: Create Organization
echo -e "${BLUE}[4] Testing Create Organization API...${NC}"
CREATE_ORG_RESPONSE=$(curl -s -X POST "${API_URL}/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Hospital", "type": "hospital", "email": "test@hospital.com", "phoneNumber": "1234567890", "address": "Test Address"}')

if echo "$CREATE_ORG_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Organization created${NC}"
else
    echo -e "${RED}✗ Organization creation failed${NC}"
fi

# Test 5: Get Users
echo -e "${BLUE}[5] Testing Get Users API...${NC}"
USERS_RESPONSE=$(curl -s -X GET "${API_URL}/users" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USERS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Users retrieved${NC}"
else
    echo -e "${RED}✗ Users failed${NC}"
fi

# Test 6: Get Ambulances
echo -e "${BLUE}[6] Testing Get Ambulances API...${NC}"
AMB_RESPONSE=$(curl -s -X GET "${API_URL}/ambulances" \
  -H "Authorization: Bearer $TOKEN")

if echo "$AMB_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Ambulances retrieved${NC}"
else
    echo -e "${RED}✗ Ambulances failed${NC}"
fi

# Test 7: Get Patients
echo -e "${BLUE}[7] Testing Get Patients API...${NC}"
PAT_RESPONSE=$(curl -s -X GET "${API_URL}/patients" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PAT_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Patients retrieved${NC}"
else
    echo -e "${RED}✗ Patients failed${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}  All API tests completed!${NC}"
echo -e "${BLUE}========================================${NC}"
