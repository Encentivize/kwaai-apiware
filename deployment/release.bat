echo off

echo "--------------------------------------------------------------------------------"
echo "Commit changes"
for /f "delims=" %%a in ('./version.exe ../package.json') do @set version=%%a
echo New version = %version%

git config alias.admin \!"git-as.sh %env.TEAMCITY_DATA_PATH%/GitareHero"

echo "commit version change"
git commit -a -m "Incremented version to %version% for release"

echo "--------------------------------------------------------------------------------"
echo "Tag this release and push to origin"
git admin tag %version%
git admin push origin master --tags
