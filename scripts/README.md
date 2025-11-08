# Database Management Scripts

## Session Management Scripts

### Check Active Sessions
View all currently active patient sessions (onboarded, in_transit, or active status).

```bash
node scripts/check-active-sessions.js
```

This will show:
- Session code and status
- Patient name
- Ambulance details
- Onboarding timestamp
- Warning for sessions older than 24 hours

### Offboard a Session
Manually offboard a specific session by its ID.

```bash
node scripts/offboard-session.js <sessionId>
```

Example:
```bash
node scripts/offboard-session.js 1
```

This will:
- Update session status to 'offboarded'
- Set offboarded timestamp
- Add treatment notes
- Update ambulance status to 'available'
- Clear ambulance's current_hospital_id

## Other Available Scripts

### Database Setup
```bash
npm run db:setup      # Reset, migrate, and seed database
npm run migrate       # Run migrations only
npm run seed          # Seed data only
```

### Testing Scripts
```bash
./test-apis.sh        # Test all API endpoints
./test-rbac.sh        # Test role-based access control
./verify-data.sh      # Verify database data integrity
```

## Common Issues & Solutions

### "Ambulance already has an active patient session" Error

**Cause:** The ambulance has an existing session with status 'onboarded', 'in_transit', or 'active'.

**Solution:**
1. Check active sessions: `node scripts/check-active-sessions.js`
2. If the session should be completed, offboard it: `node scripts/offboard-session.js <sessionId>`
3. Or use the frontend "View" button to access the session detail page and offboard from there

### Session Not Appearing in Frontend

**Cause:** Frontend was checking for `status: 'active'` only, but backend creates sessions with `status: 'onboarded'`.

**Fix Applied:** Frontend now checks for all active statuses: `['active', 'onboarded', 'in_transit']`

### Detail Page Not Loading

**Verify:**
1. Session exists: `node scripts/check-active-sessions.js`
2. Frontend routing is correct: `/onboarding/:sessionId`
3. API endpoint works: `GET /api/v1/patients/sessions/:sessionId`
4. Browser console for errors

## Best Practices

1. **Regular Cleanup:** Run `check-active-sessions.js` periodically to find sessions that should be offboarded
2. **Proper Flow:** Always offboard sessions when transport is complete
3. **Data Integrity:** Use the verification scripts before major releases
4. **Backup:** Always backup database before running manual scripts

## Notes

- Session IDs are auto-increment integers from the database
- Session codes are unique strings (e.g., "SES-1762619174299-CM69S7QCB")
- Use session ID (not code) for the offboard script
- All scripts require proper `.env` configuration
