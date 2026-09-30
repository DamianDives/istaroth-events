@echo off
echo ========================================================
echo   PULLING & PUSHING TO GITHUB (KARTHIKREDDY05/istaroth-events)
echo ========================================================
git add .
git commit -m "Update Istaroth Events platform"
git push -u origin main
echo.
echo Deployment triggered! Check GitHub Actions tab:
echo https://github.com/KARTHIKREDDY05/istaroth-events/actions
pause
