#!/bin/bash

API_BASE="http://localhost:5000/api/v1"

echo "=========================================="
echo "DATA VERIFICATION - Detailed View"
echo "=========================================="

# Login as superadmin
echo -e "\n1. Logging in as Superadmin..."
TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@resculance.com","password":"Super@123"}' | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"

# Get all patient sessions
echo -e "\n2. Patient Sessions (Trips):"
echo "-------------------------------------------"
curl -s -X GET "$API_BASE/patients/sessions" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.sessions[] | "ID: \(.id) | Code: \(.session_code) | Status: \(.status) | Org: \(.organization_name // "N/A") (\(.organization_code // "N/A"))"'

# Get all collaboration requests
echo -e "\n3. Collaboration Requests:"
echo "-------------------------------------------"
COLLABS=$(curl -s -X GET "$API_BASE/collaborations" \
  -H "Authorization: Bearer $TOKEN")

echo "$COLLABS" | jq -r '.data.requests[] | "ID: \(.id) | Code: \(.code // "N/A") | Hospital: \(.hospital_name // "N/A") | Fleet: \(.fleet_name // "N/A") | Status: \(.status)"'

# Get all organizations
echo -e "\n4. Organizations:"
echo "-------------------------------------------"
curl -s -X GET "$API_BASE/organizations" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.organizations[] | "ID: \(.id) | Name: \(.name) | Code: \(.code) | Type: \(.type)"'

# Get all ambulances
echo -e "\n5. Ambulances:"
echo "-------------------------------------------"
curl -s -X GET "$API_BASE/ambulances" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.ambulances[] | "ID: \(.id) | Number: \(.vehicle_number) | Org: \(.organization_name // "N/A")"'

# Test AIIMS Admin access
echo -e "\n=========================================="
echo "AIIMS ADMIN VIEW (Organization Filtered)"
echo "=========================================="

AIIMS_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aiims.delhi","password":"Admin@123"}' | jq -r '.data.accessToken')

echo -e "\n6. Patient Sessions visible to AIIMS Admin:"
echo "-------------------------------------------"
curl -s -X GET "$API_BASE/patients/sessions" \
  -H "Authorization: Bearer $AIIMS_TOKEN" | jq -r '.data.sessions[] | "Code: \(.session_code) | Status: \(.status) | Org: \(.organization_name // "N/A")"'

echo -e "\n7. Collaboration Requests visible to AIIMS Admin:"
echo "-------------------------------------------"
curl -s -X GET "$API_BASE/collaborations" \
  -H "Authorization: Bearer $AIIMS_TOKEN" | jq -r '.data.requests[] | "Code: \(.code // "N/A") | Hospital: \(.hospital_name // "N/A") | Fleet: \(.fleet_name // "N/A") | Status: \(.status)"'

echo -e "\n=========================================="
echo "✅ Verification Complete"
echo "=========================================="
