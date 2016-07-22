echo "Cleaning up files left over from previous packaging..."
rm -rf pkg_tmp
echo "Copying files..."
mkdir pkg_tmp
cp window.html pkg_tmp/
cp LICENSE pkg_tmp/
cp README.md pkg_tmp/
cp content_start.js pkg_tmp/
cp icon.png pkg_tmp/
cp icon-16.png pkg_tmp/
cp background.js pkg_tmp/
cp icon-128.png pkg_tmp/
cp manifest.json pkg_tmp/
cp window.js pkg_tmp/
cp content.js pkg_tmp/
cp error.png pkg_tmp/
cp -R icon pkg_tmp/
echo "Zipping files..."
cd pkg_tmp
zip -r ../ChromeSkype-packaged.zip *
echo "Cleaning up..."
cd ..
rm -rf pkg_tmp
echo "All done!"
