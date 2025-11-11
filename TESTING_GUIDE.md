# 🧪 Testing Guide - Partnership & Onboarding Features

## Build Information
- **Build File:** `index-DHcxO5dw.js`
- **Build Date:** November 11, 2025
- **Status:** Ready for testing with enhanced logging

## 📋 Pre-Testing Checklist

1. **Refresh Browser (CRITICAL)**
   ```
   Press: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   ```
   This ensures you load the new build file.

2. **Open Browser Console**
   ```
   Press F12 → Go to "Console" tab
   ```
   All debug logs will appear here with emoji prefixes for easy identification.

3. **Check Your Partnerships**
   - Go to Partnerships page
   - Verify you have at least one "Approved" partnership
   - Note the partner organization name

---

## 🧪 Test Scenarios

### Test 1: Fleet Owner - View Partnered Hospitals ✅

**User:** Fleet Owner (e.g., apex-fleet-admin)  
**Goal:** Verify destination hospital dropdown shows only partnered hospitals

**Steps:**
1. Login as fleet owner
2. Navigate to `/onboarding`
3. Watch console for: `🚑 User context:` log
4. Click "Onboard Patient" on any available ambulance
5. Look at "Destination Hospital" dropdown

**Expected Console Logs:**
```
🚑 User context: {role: "fleet_admin", orgId: 16, orgType: "fleet_owner"}
🚑 Fetching ambulances with params: {organizationId: 16}
🚑 Ambulances API response: {...}
🚑 Extracted ambulances: 3 items
🏥 Found partnered hospital IDs: [15]
🏥 Partnered hospitals: ["Shresth Test 3A"]
```

**Expected UI:**
- ✅ Dropdown shows "Shresth Test 3A - Muzaffarnagar, Uttar Pradesh"
- ❌ **BUG if:** Shows "No options" or empty dropdown
- ❌ **BUG if:** Shows ALL hospitals instead of just partnered ones

**Debug if Fails:**
- Check console for hospital IDs
- Verify partnership status is "approved" in database
- Check if `collaborationService.getAll()` returns correct data

---

### Test 2: Hospital Admin - View Partnered Ambulances ✅

**User:** Hospital Admin (e.g., apex-admin2)  
**Goal:** See ambulances from partnered fleet owners

**Steps:**
1. Login as hospital admin
2. Navigate to `/onboarding`
3. Scroll down to ambulances section

**Expected Console Logs:**
```
🚑 User context: {role: "hospital_admin", orgId: 15, orgType: "hospital"}
🚑 Fetching ambulances with params: {organizationId: 15}
🏥 Hospital context detected - fetching partnered ambulances
🚑 Found partnered fleet IDs: [16]
🚑 Partnered ambulances by fleet: [{fleetId: 16, fleetName: "apex-fleet", ambulances: [...]}]
```

**Expected UI:**
```
────────────── YOUR HOSPITAL AMBULANCES ──────────────
[ACM-ACTIVE-FINAL, ABM-ACTIVE-NEW, AMB-ACTIVE...]

────────────── APEX-FLEET (PARTNER) ──────────────
[AMB-522-004, AMB-FLEET-1, AMB-FLEET-2...]
```

**Verify:**
- ✅ Both sections appear
- ✅ Fleet name is displayed correctly
- ✅ Partner ambulances have teal-colored separator
- ✅ All ambulances are clickable

**Debug if Fails:**
- Check console for `🚑 Found partnered fleet IDs`
- Verify partnerships exist in database with status='approved'
- Check if fleet has ambulances in database

---

### Test 3: View Active Session (CRITICAL BUG FIX) 🔧

**User:** Any admin (hospital or fleet)  
**Goal:** Click "View" button on active ambulance and navigate to session detail

**Steps:**
1. Find ambulance with status "Active Onboarding" (green badge)
2. Click "View" button
3. Watch console for detailed logs

**Expected Console Logs:**
```
🔍 Viewing onboarding for ambulance: {id: 123, status: "active", ...}
🔍 Ambulance status: active
🔍 Ambulance ID: 123
📡 Fetching session with params: {ambulanceId: 123, status: "active", limit: 1}
📡 Session API response: {...}
📡 Response.data: {...}
📡 Extracted sessions: [{id: 30, ...}]
✅ Found active session ID: 30
[Navigation to /onboarding/30]
```

**Expected UI:**
- ✅ Navigate to session detail page showing patient vitals, location, video call

**Debug if Fails (IMPORTANT):**

If you see `❌ No active session found`:
1. Copy the ENTIRE console output (all logs starting with 🔍 and 📡)
2. Check what `📡 Session API response:` shows
3. Verify the ambulance actually has an active session in database:
   ```sql
   SELECT * FROM patient_sessions 
   WHERE ambulance_id = 123 AND status = 'active';
   ```

**Possible Issues:**
- API response structure is different than expected
- Session doesn't exist (ambulance status is wrong)
- Session exists but `id` field is named differently (session_id?)

---

### Test 4: Fleet Owner Ambulance Loading 🔧

**User:** Fleet Owner  
**Goal:** Verify ambulances load on onboarding page

**Steps:**
1. Login as fleet owner
2. Navigate to `/onboarding`
3. Check if ambulances appear in table

**Expected Console Logs:**
```
🚑 User context: {role: "fleet_admin", orgId: 16, orgType: "fleet_owner"}
🚑 Fetching ambulances with params: {organizationId: 16}
🚑 Ambulances API response: {success: true, data: {ambulances: [...]}}
🚑 Extracted ambulances: 3 items
```

**Expected UI:**
- ✅ Table shows fleet's ambulances (AMB-522-004, etc.)
- ✅ Ambulances have status badges (Available, Active, Inactive)

**Debug if "No ambulances found":**
1. Check console `🚑 User context:` - is orgId null or undefined?
2. Check `🚑 Ambulances API response:` - does it contain data?
3. Verify fleet has ambulances in database:
   ```sql
   SELECT * FROM ambulances WHERE organization_id = 16;
   ```

---

## 🐛 Common Issues & Solutions

### Issue: "No options" in destination hospital dropdown
**Cause:** No approved partnerships exist  
**Fix:** Go to Partnerships page, accept a pending request

### Issue: Partnered ambulances not showing
**Cause:** Partnership status is "pending" not "approved"  
**Fix:** Partner hospital/fleet must accept the partnership first

### Issue: Console shows 403 or 401 errors
**Cause:** Authentication issue  
**Fix:** Logout and login again

### Issue: Cannot onboard patient
**Cause:** Missing required fields  
**Check:** Ensure patient AND destination hospital are selected

---

## 📸 What to Report

When reporting bugs, provide:

1. **User Role & Organization**
   - e.g., "Fleet Admin of apex-fleet"

2. **Console Logs**
   - Copy ALL logs with emoji prefixes (🚑 🏥 🔍 📡)
   - Include the full API response JSON

3. **Expected vs Actual**
   - What you expected to see
   - What actually happened

4. **Screenshots**
   - Show the error message or UI state
   - Include browser console visible

---

## ✅ Success Criteria

All tests pass if:
- [x] Fleet owner sees only partnered hospitals in dropdown
- [x] Hospital admin sees partnered ambulances with fleet name separators
- [x] View button navigates to session detail page
- [x] Fleet owner can load their ambulances
- [x] Search works across all ambulances
- [x] Onboarding works on both own and partnered ambulances

---

## 🔄 Next Steps After Testing

After you test and report results:
1. I'll fix any remaining issues based on console logs
2. Implement cross-org patient/session sync (backend changes needed)
3. Add validation for partnership status before onboarding
4. Clean up debug console.log statements (production build)

**Refresh browser and start testing!** 🚀
