@echo off
echo ================================
echo TON Connect React Application
echo ================================
echo.

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server...
echo Application will open at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

