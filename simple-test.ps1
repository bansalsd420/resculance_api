# Simple API Test
Write-Host "Testing API..." -ForegroundColor Yellow

# Test 1: Health Check
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -UseBasicParsing
    Write-Host "[PASS] Health Check - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "[FAIL] Health Check - $_" -ForegroundColor Red
}

Write-Host "`nDone!"
