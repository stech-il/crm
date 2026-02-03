@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Initializing Git...
if not exist .git git init

echo Adding remote...
git remote remove origin 2>nul
git remote add origin https://github.com/stech-il/crm.git

echo Adding files (node_modules excluded via .gitignore)...
git add .

echo Committing...
git commit -m "Initial commit: CRM Cloud - Next.js, Prisma, Render" 2>nul || git commit -m "Update: CRM Cloud"

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done!
pause
