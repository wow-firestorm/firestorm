#!/bin/bash
set -eu
set -o pipefail
IFS=$'\n\t'

mkdir -p build
rm -rf ./build/firestorm.app
cp -r ./firestorm/node-webkit.app ./build/firestorm.app
cp -r ./firestorm ./build/firestorm.app/Contents/Resources/app.nw
rm -r ./build/firestorm.app/Contents/Resources/app.nw/node-webkit.app
cp ./firestorm/images/icon.icns ./build/firestorm.app/Contents/Resources/nw.icns

OLD='"toolbar": true,'
NEW='"toolbar": false,'
sed -i.bak "s/$OLD/$NEW/g" ./build/firestorm.app/Contents/Resources/app.nw/package.json
rm ./build/firestorm.app/Contents/Resources/app.nw/package.json.bak

cd ./build
tar -cvzf firestorm.tar.gz firestorm.app
cd -
