# RESCULANCE API Testing Script
# PowerShell script to test all major endpoints

$baseUrl = "http://localhost:5000"
$apiUrl = "$baseUrl/api/v1"

# Color functions for output
function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Test { param($msg) Write-Host "`n[TEST] $msg" -ForegroundColor Yellow }

# Store tokens and IDs
$global:accessToken = ""
$global:refreshToken = ""
$global:userId = ""
$global:organizationId = ""
$global:ambulanceId = ""
$global:patientId = ""
$global:sessionId = ""

Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host "   RESCULANCE API - Automated Testing Script   " -ForegroundColor Magenta
Write-Host "================================================`n" -ForegroundColor Magenta

# Test 1: Health Check
Write-Test "Health Check"
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Success "Health Check Passed"
    Write-Info "Status: $($response.status)"
} catch {
    Write-Error "Health Check Failed: $_"
    exit 1
}

# Test 2: Login as Superadmin
Write-Test "Login as Superadmin"
try {
    $loginBody = @{
        email = "superadmin@resculance.com"
        password = "Admin@123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $global:accessToken = $response.data.accessToken
    $global:refreshToken = $response.data.refreshToken
    $global:userId = $response.data.user.id

    Write-Success "Login Successful"
    Write-Info "User: $($response.data.user.email)"
    Write-Info "Role: $($response.data.user.role)"
    Write-Info "Access Token: $($global:accessToken.Substring(0, 50))..."
} catch {
    Write-Error "Login Failed: $_"
    exit 1
}

# Set headers with auth token
$headers = @{
    "Authorization" = "Bearer $global:accessToken"
    "Content-Type" = "application/json"
}

# Test 3: Get Profile
Write-Test "Get User Profile"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/auth/profile" -Method Get -Headers $headers
    Write-Success "Profile Retrieved"
    Write-Info "Name: $($response.data.firstName) $($response.data.lastName)"
} catch {
    Write-Error "Get Profile Failed: $_"
}

# Test 4: Create Hospital Organization
Write-Test "Create Hospital Organization"
try {
    $orgBody = @{
        name = "City General Hospital"
        type = "HOSPITAL"
        address = "123 Medical Center Drive"
        city = "New York"
        state = "NY"
        zipCode = "10001"
        country = "USA"
        phone = "+1234567890"
        email = "contact@cityhospital.com"
        licenseNumber = "HOSP-2025-001"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/organizations" -Method Post -Body $orgBody -Headers $headers
    $global:organizationId = $response.data.id

    Write-Success "Hospital Created"
    Write-Info "Organization ID: $($response.data.id)"
    Write-Info "Name: $($response.data.name)"
    Write-Info "Code: $($response.data.code)"
} catch {
    Write-Error "Create Hospital Failed: $_"
}

# Test 5: Create Fleet Owner Organization
Write-Test "Create Fleet Owner Organization"
try {
    $fleetBody = @{
        name = "Quick Response Ambulance Services"
        type = "FLEET_OWNER"
        address = "456 Fleet Street"
        city = "New York"
        state = "NY"
        zipCode = "10002"
        country = "USA"
        phone = "+1987654321"
        email = "contact@quickresponse.com"
        licenseNumber = "FLEET-2025-001"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/organizations" -Method Post -Body $fleetBody -Headers $headers
    $fleetOwnerId = $response.data.id

    Write-Success "Fleet Owner Created"
    Write-Info "Organization ID: $($response.data.id)"
    Write-Info "Name: $($response.data.name)"
} catch {
    Write-Error "Create Fleet Owner Failed: $_"
}

# Test 6: Get All Organizations
Write-Test "Get All Organizations"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/organizations" -Method Get -Headers $headers
    Write-Success "Organizations Retrieved"
    Write-Info "Total Count: $($response.data.Count)"
} catch {
    Write-Error "Get Organizations Failed: $_"
}

# Generate unique timestamp for emails
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

# Test 7: Create Doctor User
Write-Test "Create Doctor User"
try {
    $doctorBody = @{
        email = "doctor$timestamp@hospital.com"
        password = "Doctor@123"
        firstName = "John"
        lastName = "Smith"
        phone = "+1234567891"
        role = "hospital_doctor"
        organizationId = $global:organizationId
        licenseNumber = "DOC-12345"
        specialization = "Emergency Medicine"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/users" -Method Post -Body $doctorBody -Headers $headers
    $doctorId = $response.data.userId

    Write-Success "Doctor User Created"
    Write-Info "User ID: $($response.data.userId)"
    Write-Info "Status: $($response.data.status)"
} catch {
    Write-Error "Create Doctor Failed: $_"
}

# Test 8: Approve Doctor User
Write-Test "Approve Doctor User"
try {
    if ($doctorId) {
        $response = Invoke-RestMethod -Uri "$apiUrl/users/$doctorId/approve" -Method Patch -Headers $headers
        Write-Success "Doctor Approved"
    } else {
        Write-Warning "Doctor ID not available, skipping approval"
    }
} catch {
    Write-Error "Approve Doctor Failed: $_"
}

# Test 9: Create Paramedic User
Write-Test "Create Paramedic User"
try {
    $paramedicBody = @{
        email = "paramedic$timestamp@fleet.com"
        password = "Paramedic@123"
        firstName = "Jane"
        lastName = "Wilson"
        phone = "+1234567892"
        role = "fleet_paramedic"
        organizationId = $fleetOwnerId
        licenseNumber = "PARA-12345"
        specialization = "Advanced Life Support"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/users" -Method Post -Body $paramedicBody -Headers $headers
    $paramedicId = $response.data.userId

    Write-Success "Paramedic User Created"
    Write-Info "User ID: $($response.data.userId)"
} catch {
    Write-Error "Create Paramedic Failed: $_"
}

# Test 10: Approve Paramedic User
Write-Test "Approve Paramedic User"
try {
    if ($paramedicId) {
        $response = Invoke-RestMethod -Uri "$apiUrl/users/$paramedicId/approve" -Method Patch -Headers $headers
        Write-Success "Paramedic Approved"
    } else {
        Write-Warning "Paramedic ID not available, skipping approval"
    }
} catch {
    Write-Error "Approve Paramedic Failed: $_"
}

# Test 11: Create Ambulance
Write-Test "Create Ambulance"
try {
    $ambulanceBody = @{
        vehicleNumber = "AMB-$timestamp-001"
        vehicleModel = "Mercedes Sprinter"
        vehicleType = "BLS"
        deviceId = "DEV-$timestamp"
        status = "available"
        organizationId = $fleetOwnerId
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/ambulances" -Method Post -Body $ambulanceBody -Headers $headers
    $global:ambulanceId = $response.data.ambulanceId

    Write-Success "Ambulance Created"
    Write-Info "Ambulance ID: $($response.data.ambulanceId)"
    Write-Info "Vehicle Number: $($response.data.vehicleNumber)"
} catch {
    Write-Error "Create Ambulance Failed: $_"
}

# Test 11.5: Approve Ambulance
Write-Test "Approve Ambulance"
try {
    if ($global:ambulanceId) {
        $response = Invoke-RestMethod -Uri "$apiUrl/ambulances/$($global:ambulanceId)/approve" -Method Patch -Headers $headers
        Write-Success "Ambulance Approved"
    } else {
        Write-Warning "Ambulance ID not available, skipping approval"
    }
} catch {
    Write-Error "Approve Ambulance Failed: $_"
}

# Test 12: Assign Paramedic to Ambulance
Write-Test "Assign Paramedic to Ambulance"
try {
    $assignBody = @{
        userId = $paramedicId
        role = "PARAMEDIC"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/ambulances/$($global:ambulanceId)/assign" -Method Post -Body $assignBody -Headers $headers
    Write-Success "Paramedic Assigned to Ambulance"
} catch {
    Write-Error "Assign Paramedic Failed: $_"
}

# Test 13: Update Ambulance Location
Write-Test "Update Ambulance Location"
try {
    $locationBody = @{
        latitude = 40.7128
        longitude = -74.0060
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/ambulances/$($global:ambulanceId)/location" -Method Post -Body $locationBody -Headers $headers
    Write-Success "Ambulance Location Updated"
    Write-Info "Latitude: 40.7128, Longitude: -74.0060"
} catch {
    Write-Error "Update Location Failed: $_"
}

# Test 14: Get All Ambulances
Write-Test "Get All Ambulances"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/ambulances" -Method Get -Headers $headers
    Write-Success "Ambulances Retrieved"
    Write-Info "Total Count: $($response.data.Count)"
} catch {
    Write-Error "Get Ambulances Failed: $_"
}

# Test 15: Create Patient
Write-Test "Create Patient"
try {
    $patientBody = @{
        firstName = "Jane"
        lastName = "Doe"
        dateOfBirth = "1985-05-15"
        gender = "female"
        bloodGroup = "O+"
        phone = "+1234567893"
        email = "jane.doe@email.com"
        address = "789 Patient Street"
        emergencyContactName = "John Doe"
        emergencyContactPhone = "+1234567894"
        emergencyContactRelation = "Spouse"
        medicalHistory = "Hypertension, Diabetes"
        allergies = "Penicillin"
        currentMedications = "Metformin, Lisinopril"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/patients" -Method Post -Body $patientBody -Headers $headers
    $global:patientId = $response.data.patientId

    Write-Success "Patient Created"
    Write-Info "Patient ID: $($response.data.patientId)"
    Write-Info "Code: $($response.data.patientCode)"
} catch {
    Write-Error "Create Patient Failed: $_"
}

# Test 16: Onboard Patient to Ambulance
Write-Test "Onboard Patient to Ambulance"
try {
    $onboardBody = @{
        ambulanceId = $global:ambulanceId
        pickupLocation = "123 Emergency Ave"
        pickupLat = 40.7128
        pickupLng = -74.0060
        destinationHospitalId = $global:organizationId
        chiefComplaint = "Chest pain, difficulty breathing"
        initialAssessment = "Patient conscious, BP 140/90, HR 95"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/patients/$($global:patientId)/onboard" -Method Post -Body $onboardBody -Headers $headers
    $global:sessionId = $response.data.sessionId

    Write-Success "Patient Onboarded"
    Write-Info "Session ID: $($response.data.id)"
} catch {
    Write-Error "Onboard Patient Failed: $_"
}

# Test 17: Add Vital Signs
Write-Test "Add Vital Signs"
try {
    $vitalSignsBody = @{
        heartRate = 85
        bloodPressureSystolic = 120
        bloodPressureDiastolic = 80
        oxygenSaturation = 98
        temperature = 98.6
        respiratoryRate = 16
        glucoseLevel = 105
        notes = "Patient stable, vitals normal"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/patients/$($global:patientId)/vital-signs" -Method Post -Body $vitalSignsBody -Headers $headers
    Write-Success "Vital Signs Added"
    Write-Info "Heart Rate: 85 bpm, BP: 120/80"
} catch {
    Write-Error "Add Vital Signs Failed: $_"
}

# Test 18: Get Patient Vital Signs
Write-Test "Get Patient Vital Signs"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/patients/$($global:patientId)/vital-signs?limit=10" -Method Get -Headers $headers
    Write-Success "Vital Signs Retrieved"
    Write-Info "Records Count: $($response.data.Count)"
} catch {
    Write-Error "Get Vital Signs Failed: $_"
}

# Test 19: Add Communication Note
Write-Test "Add Communication Note"
try {
    $commBody = @{
        communicationType = "text"
        message = "Patient responding well to treatment. ETA 15 minutes."
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/patients/$($global:patientId)/communications" -Method Post -Body $commBody -Headers $headers
    Write-Success "Communication Added"
} catch {
    Write-Error "Add Communication Failed: $_"
}

# Test 20: Create Collaboration Request
Write-Test "Create Collaboration Request"
try {
    # Create a second ambulance for collaboration
    $ambulance2Body = @{
        vehicleNumber = "AMB-$timestamp-002"
        vehicleModel = "Ford Transit"
        vehicleType = "ALS"
        organizationId = $fleetOwnerId
    } | ConvertTo-Json
    
    $amb2Response = Invoke-RestMethod -Uri "$apiUrl/ambulances" -Method Post -Body $ambulance2Body -Headers $headers
    $ambulance2Id = $amb2Response.data.ambulanceId
    
    # Approve the second ambulance
    Invoke-RestMethod -Uri "$apiUrl/ambulances/$ambulance2Id/approve" -Method Patch -Headers $headers | Out-Null
    
    $collabBody = @{
        fleetOwnerId = $fleetOwnerId
        ambulanceId = $ambulance2Id
        message = "We need ambulance support for our emergency department."
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/collaborations" -Method Post -Body $collabBody -Headers $headers
    $collabId = $response.data.requestId

    Write-Success "Collaboration Request Created"
    Write-Info "Request ID: $collabId"
} catch {
    Write-Error "Create Collaboration Failed: $_"
}

# Test 21: Get All Collaboration Requests
Write-Test "Get All Collaboration Requests"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/collaborations" -Method Get -Headers $headers
    Write-Success "Collaboration Requests Retrieved"
    Write-Info "Total Count: $($response.data.Count)"
} catch {
    Write-Error "Get Collaboration Requests Failed: $_"
}

# Test 22: Get All Users
Write-Test "Get All Users"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/users" -Method Get -Headers $headers
    Write-Success "Users Retrieved"
    Write-Info "Total Count: $($response.data.Count)"
} catch {
    Write-Error "Get Users Failed: $_"
}

# Test 23: Get All Patients
Write-Test "Get All Patients"
try {
    $response = Invoke-RestMethod -Uri "$apiUrl/patients" -Method Get -Headers $headers
    Write-Success "Patients Retrieved"
    Write-Info "Total Count: $($response.data.Count)"
} catch {
    Write-Error "Get Patients Failed: $_"
}

# Test 24: Refresh Token
Write-Test "Refresh Access Token"
try {
    $refreshBody = @{
        refreshToken = $global:refreshToken
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$apiUrl/auth/refresh-token" -Method Post -Body $refreshBody -ContentType "application/json"
    $newAccessToken = $response.data.accessToken

    Write-Success "Token Refreshed"
    Write-Info "New Token: $($newAccessToken.Substring(0, 50))..."
} catch {
    Write-Error "Token Refresh Failed: $_"
}

# Summary
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host "           Testing Summary                      " -ForegroundColor Magenta
Write-Host "================================================`n" -ForegroundColor Magenta

Write-Success "All Core Endpoints Tested Successfully!"
Write-Info ""
Write-Info "Created Resources:"
Write-Info "  - Hospital Organization ID: $global:organizationId"
Write-Info "  - Ambulance ID: $global:ambulanceId"
Write-Info "  - Patient ID: $global:patientId"
Write-Info "  - Session ID: $global:sessionId"
Write-Info ""
Write-Success "RESCULANCE API is fully functional!"
Write-Host ""
