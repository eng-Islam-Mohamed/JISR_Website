@echo off
rem Lance le site JISR en local puis ouvre le navigateur.
cd /d "%~dp0"
where node >/dev/null 2>/dev/null || (echo Node.js est introuvable. Installez-le depuis https://nodejs.org puis relancez. & pause & exit /b 1)
start "" cmd /c "timeout /t 2 >/dev/null & start http://127.0.0.1:4173"
echo Site JISR : http://127.0.0.1:4173  (fermez cette fenetre pour arreter)
node scripts\serve.mjs
pause
