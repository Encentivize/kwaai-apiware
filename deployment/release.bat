echo off
set "dataPath=%~1"

echo "--------------------------------------------------------------------------------"
echo "Commit changes"
for /f "delims=" %%a in ('version.exe package.json') do @set version=%%a
echo New version = %version%

# Run git commands as the SSH identity provided by the keyfile ~/.ssh/admin
git config alias.admin \!"git-as.sh %dataPath%/GitareHero"

echo "commit version change"
git commit -a -m "Incremented version to %version% for release"

echo "--------------------------------------------------------------------------------"
echo "Tag this release and push to origin"
git admin tag %version%
git admin push origin master --tags
echo "--------------------------------------------------------------------------------"
