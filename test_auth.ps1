# Test authentication endpoints

# Test login
$loginBody = "username=testuser@gmail.com&password=testpass123"
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $loginBody
    Write-Host "Login successful!"
    Write-Host "Access Token: $($loginResponse.access_token)"
    Write-Host "User: $($loginResponse.user.first_name) $($loginResponse.user.last_name)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
}

# Test protected endpoint (if available)
# $headers = @{Authorization = "Bearer $($loginResponse.access_token)"}
# $userResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/me" -Method GET -Headers $headers
