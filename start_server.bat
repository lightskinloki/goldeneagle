@echo off
start /MIN "" py -m http.server 8000
timeout /t 2 >nul
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "http://localhost:8000"
exit