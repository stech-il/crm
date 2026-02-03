@echo off
chcp 65001 >nul
cd /d "%~dp0"

for %%I in ("%~dp0.") do set "CURRENT_FOLDER=%%~nxI"
echo Current folder: %CURRENT_FOLDER%
echo Renaming to crm...

cd ..
if exist "crm" (
    echo Folder crm already exists! Skipping rename.
    cd crm
) else (
    ren "%CURRENT_FOLDER%" crm
    if errorlevel 1 (
        echo Rename failed. Manually rename: %CURRENT_FOLDER% -^> crm
        pause
        exit /b 1
    )
    echo Folder renamed successfully.
    cd crm
)

echo Pushing to GitHub...
git add .
git status
git commit -m "Rename project to crm" 2>nul || echo No changes to commit
git push

echo Done!
pause
