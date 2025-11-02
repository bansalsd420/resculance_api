#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5000/api/v1"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   RBAC & Data Verification Test Suite     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Login as Superadmin
echo -e "${YELLOW}Test 1: Login as Superadmin${NC}"
SUPERADMIN_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@resculance.com","password":"Super@123"}' | jq -r '.data.accessToken')

if [ "$SUPERADMIN_TOKEN" != "null" ] && [ -n "$SUPERADMIN_TOKEN" ]; then
  echo -e "${GREEN}✅ Superadmin login successful${NC}"
else
  echo -e "${RED}❌ Superadmin login failed${NC}"
  exit 1
fi

# Test 2: Login as Hospital Admin (AIIMS)
echo -e "\n${YELLOW}Test 2: Login as AIIMS Hospital Admin${NC}"
AIIMS_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aiims.delhi","password":"Admin@123"}' | jq -r '.data.accessToken')

if [ "$AIIMS_TOKEN" != "null" ] && [ -n "$AIIMS_TOKEN" ]; then
  echo -e "${GREEN}✅ AIIMS admin login successful${NC}"
else
  echo -e "${RED}❌ AIIMS admin login failed${NC}"
  exit 1
fi

# Test 3: Login as Fleet Admin (FastAid)
echo -e "\n${YELLOW}Test 3: Login as FastAid Fleet Admin${NC}"
FASTAID_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fastaid.com","password":"Admin@123"}' | jq -r '.data.accessToken')

if [ "$FASTAID_TOKEN" != "null" ] && [ -n "$FASTAID_TOKEN" ]; then
  echo -e "${GREEN}✅ FastAid admin login successful${NC}"
else
  echo -e "${RED}❌ FastAid admin login failed${NC}"
  exit 1
fi

# Test 4: Superadmin - View all users
echo -e "\n${YELLOW}Test 4: Superadmin views all users${NC}"
SUPERADMIN_USERS=$(curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq '.data.users | length')
echo -e "Users visible to superadmin: ${GREEN}$SUPERADMIN_USERS${NC}"

# Test 5: AIIMS Admin - View users (should only see AIIMS users)
echo -e "\n${YELLOW}Test 5: AIIMS Admin views users${NC}"
AIIMS_USERS=$(curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $AIIMS_TOKEN" | jq '.data.users | length')
echo -e "Users visible to AIIMS admin: ${GREEN}$AIIMS_USERS${NC}"

# Test 6: Superadmin - View all ambulances
echo -e "\n${YELLOW}Test 6: Superadmin views all ambulances${NC}"
SUPERADMIN_AMBULANCES=$(curl -s -X GET "$API_BASE/ambulances" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq '.data.ambulances | length')
echo -e "Ambulances visible to superadmin: ${GREEN}$SUPERADMIN_AMBULANCES${NC}"

# Test 7: FastAid Admin - View ambulances (should only see FastAid ambulances)
echo -e "\n${YELLOW}Test 7: FastAid Admin views ambulances${NC}"
FASTAID_AMBULANCES=$(curl -s -X GET "$API_BASE/ambulances" \
  -H "Authorization: Bearer $FASTAID_TOKEN" | jq '.data.ambulances | length')
echo -e "Ambulances visible to FastAid admin: ${GREEN}$FASTAID_AMBULANCES${NC}"

# Test 8: Superadmin - View all patient sessions (trips)
echo -e "\n${YELLOW}Test 8: Superadmin views all patient sessions${NC}"
SUPERADMIN_SESSIONS=$(curl -s -X GET "$API_BASE/patients/sessions" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq '.data.sessions | length')
echo -e "Sessions visible to superadmin: ${GREEN}$SUPERADMIN_SESSIONS${NC}"

# Test 9: AIIMS Admin - View patient sessions (should only see AIIMS sessions)
echo -e "\n${YELLOW}Test 9: AIIMS Admin views patient sessions${NC}"
AIIMS_SESSIONS=$(curl -s -X GET "$API_BASE/patients/sessions" \
  -H "Authorization: Bearer $AIIMS_TOKEN" | jq '.data.sessions | length')
echo -e "Sessions visible to AIIMS admin: ${GREEN}$AIIMS_SESSIONS${NC}"

# Test 10: Superadmin - View all collaboration requests
echo -e "\n${YELLOW}Test 10: Superadmin views all collaboration requests${NC}"
SUPERADMIN_COLLABS=$(curl -s -X GET "$API_BASE/collaborations" \
  -H "Authorization: Bearer $SUPERADMIN_TOKEN" | jq '.data.requests | length')
echo -e "Collaboration requests visible to superadmin: ${GREEN}$SUPERADMIN_COLLABS${NC}"

# Test 11: AIIMS Admin - View collaboration requests (should only see AIIMS requests)
echo -e "\n${YELLOW}Test 11: AIIMS Admin views collaboration requests${NC}"
AIIMS_COLLABS=$(curl -s -X GET "$API_BASE/collaborations" \
  -H "Authorization: Bearer $AIIMS_TOKEN" | jq '.data.requests | length')
echo -e "Collaboration requests visible to AIIMS admin: ${GREEN}$AIIMS_COLLABS${NC}"

# Test 12: FastAid Admin - View collaboration requests (should only see FastAid requests)
echo -e "\n${YELLOW}Test 12: FastAid Admin views collaboration requests${NC}"
FASTAID_COLLABS=$(curl -s -X GET "$API_BASE/collaborations" \
  -H "Authorization: Bearer $FASTAID_TOKEN" | jq '.data.requests | length')
echo -e "Collaboration requests visible to FastAid admin: ${GREEN}$FASTAID_COLLABS${NC}"

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Expected behavior:${NC}"
echo -e "  • Superadmin should see ALL data (users: 15, ambulances: 5, sessions: 3, collabs: 3)"
echo -e "  • AIIMS admin should see only AIIMS data (users: 3, sessions: 2, collabs: 1)"
echo -e "  • FastAid admin should see only FastAid data (ambulances: 3, collabs: 2)"
echo ""
echo -e "${YELLOW}Actual results:${NC}"
echo -e "  Superadmin: Users=$SUPERADMIN_USERS, Ambulances=$SUPERADMIN_AMBULANCES, Sessions=$SUPERADMIN_SESSIONS, Collabs=$SUPERADMIN_COLLABS"
echo -e "  AIIMS Admin: Users=$AIIMS_USERS, Sessions=$AIIMS_SESSIONS, Collabs=$AIIMS_COLLABS"
echo -e "  FastAid Admin: Ambulances=$FASTAID_AMBULANCES, Collabs=$FASTAID_COLLABS"
echo ""

# Validation
PASS=true
if [ "$SUPERADMIN_USERS" -lt "15" ]; then
  echo -e "${RED}❌ Superadmin should see at least 15 users${NC}"
  PASS=false
fi

if [ "$SUPERADMIN_AMBULANCES" -lt "5" ]; then
  echo -e "${RED}❌ Superadmin should see at least 5 ambulances${NC}"
  PASS=false
fi

if [ "$SUPERADMIN_SESSIONS" -lt "3" ]; then
  echo -e "${RED}❌ Superadmin should see at least 3 sessions${NC}"
  PASS=false
fi

if [ "$AIIMS_USERS" -gt "3" ]; then
  echo -e "${RED}❌ AIIMS admin should see only 3 AIIMS users${NC}"
  PASS=false
fi

if [ "$PASS" = true ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     ✅ ALL TESTS PASSED! ✅                ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║     ❌ SOME TESTS FAILED ❌                ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
  exit 1
fi
