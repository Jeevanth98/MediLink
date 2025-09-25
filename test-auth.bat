@echo off
echo =========================
echo  MediLink Auth Test Script
echo =========================
echo.

echo Testing Backend Health Check...
curl -s http://localhost:5000/api/health
echo.
echo.

echo Testing Signup...
curl -X POST http://localhost:5000/api/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123\",\"phone\":\"1234567890\",\"age\":25}"
echo.
echo.

echo Waiting 2 seconds...
timeout /t 2 > nul

echo Testing Login...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
echo.
echo.

echo Test completed!
pause