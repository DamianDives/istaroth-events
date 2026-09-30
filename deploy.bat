@echo off
echo ========================================================
echo   UPDATING & DEPLOYING TO LIVE SITE (DamianDives/istaroth-events)
echo ========================================================
git add .
git commit -m "Update Istaroth Events platform"
echo Pushing to main branch...
git push origin main
echo Syncing to gh-pages branch for instant live deployment...
git checkout gh-pages
git merge main
git push origin gh-pages
git checkout main
echo.
echo ========================================================
echo   DEPLOYMENT COMPLETE!
echo   Live URL: https://damiandives.github.io/istaroth-events/
echo ========================================================
pause
