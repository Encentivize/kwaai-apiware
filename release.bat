echo off

cd dist

echo "--------------------------------------------------------------------------------"
echo "Commit changes"
for /f "delims=" %%a in ('version.exe package.json') do @set version=%%a
echo New version = %version%
git commit -a -m "Incremented version to %version% for release"

git push origin master
echo "--------------------------------------------------------------------------------"