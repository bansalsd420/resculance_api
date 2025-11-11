# Partnership Onboarding Implementation Summary

## Changes Implemented (Build: index-B_oSDgrr.js)

### 1. Fixed Partnered Hospital Selection for Fleet Owners
**File:** `frontend/src/pages/onboarding/Onboarding.jsx`

**Problem:** Fleet owners saw ALL hospitals instead of only partnered ones  
**Solution:** Updated `fetchPartneredHospitals()` to:
- Filter collaborations where `status === 'approved'`
- Match `fleet_id` with current user's organization ID
- Extract only hospitals that are actively partnered

```javascript
// Now correctly filters by fleet's own partnerships
const hospitalIds = collabData
  .filter(c => {
    const status = (c.status || c.request_status || '').toLowerCase();
    const fleetId = c.fleet_id || c.fleetId;
    return status === 'approved' && Number(fleetId) === Number(userOrgId);
  })
  .map(c => c.hospital_id || c.hospitalId)
```

### 2. Added Partnered Ambulances Display for Hospitals
**Feature:** Hospital admins can now see and onboard patients on partnered fleet ambulances

**UI Changes:**
- Own hospital ambulances shown first (if any)
- Partnered fleet ambulances grouped by fleet name with visual separators
- Each fleet section has distinctive styling (teal accents for partners)
- Search works across both own and partnered ambulances

**Backend Compatibility:**
- Uses existing ambulance API: `GET /api/v1/ambulances?organizationId={fleetId}`
- Leverages partnership data from: `GET /api/v1/collaborations?status=approved`

### 3. Visual Fleet Name Separators
```
────────────── YOUR HOSPITAL AMBULANCES ──────────────
[Table with hospital's own ambulances]

────────────── APEX-FLEET (PARTNER) ──────────────
[Table with apex-fleet's ambulances]

────────────── METRO-FLEET (PARTNER) ──────────────
[Table with metro-fleet's ambulances]
```

## Testing Instructions

### Test 1: Fleet Owner - Destination Hospital Dropdown
1. Login as fleet owner (apex-fleet-admin)
2. Go to Onboarding page
3. Click "Onboard Patient" on any available ambulance
4. Check "Destination Hospital" dropdown
5. **Expected:** Only partnered hospitals appear (e.g., "Shresth Test 3A")
6. **Bug if:** Shows all hospitals or "No options"

### Test 2: Hospital Admin - Partnered Ambulances Visibility
1. Login as hospital admin (apex-admin2)
2. Go to Onboarding page
3. **Expected:** See two sections:
   - "YOUR HOSPITAL AMBULANCES" (if you have any)
   - "APEX-FLEET (PARTNER)" or other fleet names
4. **Bug if:** Only see your own ambulances, or error loading

### Test 3: View Active Session
1. Login as hospital admin
2. Click "View" on ambulance with "Active Onboarding" status
3. **Expected:** Navigate to session detail page
4. **Current Bug:** Shows "Could not find active session. Please refresh the page."
5. **Root Cause:** Need to investigate session query response structure

## Known Issues Still Requiring Fixes

### Issue #1: "Could not find active session" Error
**Symptom:** Clicking "View" on active ambulance shows error toast  
**Location:** `handleViewOnboarding()` function (line ~295)  
**Debug Steps:**
1. Check browser console for API response from `GET /api/v1/patients/sessions?ambulanceId=X&status=active`
2. Verify response structure matches: `response.data.data.sessions` or `response.data.sessions`
3. Check if session exists in database for that ambulance

**Potential Fix:**
```javascript
// May need to adjust response parsing
const sessions = response.data?.data?.sessions || 
                 response.data?.sessions || 
                 response.data?.data || // <-- ADD THIS
                 response.data || 
                 [];
```

### Issue #2: Fleet Owner Cannot Load Ambulances
**Symptom:** Fleet owner sees "No ambulances found" on onboarding page  
**Root Cause:** Unknown - need to check:
1. Is `user.organizationId` set correctly for fleet users?
2. Does API call include correct `organizationId` param?
3. Check browser network tab for actual request params

**Debug:**
```javascript
// Add console.log in fetchAmbulances():
console.log('🚑 Fetching ambulances with params:', params);
console.log('🚑 User org ID:', user?.organizationId);
console.log('🚑 User type:', user?.organizationType);
```

### Issue #3: Cross-Organization Patient/Session Sync
**Requirement:** When hospital onboards patient on partnered ambulance:
- Create patient record for fleet owner's organization
- Link session to both hospital and fleet

**Backend Changes Needed:**
1. `patientController.onboard()` should:
   - Detect if ambulance belongs to different organization
   - Create patient in both organizations
   - Store partnership reference in session

2. `patientController.offboard()` should:
   - Create session record for destination hospital
   - Update patient status in both organizations

**API Modifications Required:**
```sql
-- May need new columns in patient_sessions table
ALTER TABLE patient_sessions ADD COLUMN partnership_id INT NULL;
ALTER TABLE patient_sessions ADD COLUMN source_org_id INT;
ALTER TABLE patient_sessions ADD COLUMN dest_org_id INT;
```

## API Endpoint Usage

### Existing Endpoints Used:
1. `GET /api/v1/collaborations?status=approved` - Get active partnerships
2. `GET /api/v1/ambulances?organizationId={id}` - Fetch ambulances by org
3. `GET /api/v1/patients/sessions?ambulanceId={id}&status=active` - Get active session
4. `POST /api/v1/patients/onboard` - Onboard patient
5. `POST /api/v1/patients/offboard` - Offboard patient

### No New Endpoints Required
All features use existing APIs - just need to ensure:
- Partnerships data includes organization names
- Onboard/offboard logic handles cross-org scenarios

## Next Steps (Priority Order)

1. **HIGH:** Fix "View session" error
   - Add detailed logging to `handleViewOnboarding()`
   - Check actual API response structure
   - Verify session exists in DB

2. **HIGH:** Fix fleet owner ambulance loading
   - Add logging to see what params are sent
   - Verify user context is correct
   - Check API response

3. **MEDIUM:** Implement cross-org patient sync
   - Update `patientController.onboard()` backend
   - Update `patientController.offboard()` backend
   - Add partnership context to session creation

4. **LOW:** Add validation for partnered ambulance onboarding
   - Ensure hospital can only onboard to partnered hospitals
   - Prevent onboarding if partnership is inactive

## Files Modified

1. `frontend/src/pages/onboarding/Onboarding.jsx`
   - Added `partneredAmbulances` state
   - Updated `fetchPartneredHospitals()` logic
   - Added `fetchPartneredAmbulances()` function
   - Updated UI to show fleet separators

2. `frontend/src/pages/collaborations/Collaborations.jsx` (previous session)
   - Added duplicate partnership prevention
   - Fixed cancel/reject permissions

## Rollback Instructions

If issues arise, revert to previous build:
```bash
cd d:\Projects\frontend
git checkout HEAD~1 src/pages/onboarding/Onboarding.jsx
npm run build
```

## Testing Checklist

- [ ] Fleet owner sees only partnered hospitals in destination dropdown
- [ ] Hospital admin sees partnered ambulances grouped by fleet
- [ ] Onboarding on partnered ambulance works
- [ ] View session navigates correctly
- [ ] Fleet owner can load their own ambulances
- [ ] Search works across own + partnered ambulances
- [ ] Offboard works on partnered ambulances
- [ ] Cross-org patient data syncs (after backend implementation)

---
**Build Date:** 2025-11-11  
**Build Hash:** index-B_oSDgrr.js  
**Status:** Partial - UI complete, debugging needed
