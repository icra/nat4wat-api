#!/bin/bash

# check are in branch main
if [ $(git branch --show-current) != 'main' ]
then
  echo 'You are not in main branch'
  exit 1
fi

# check uncommited changes
if [ $(git status --porcelain | wc -l) -gt 0 ]
then
  echo 'There are uncommited changes'
  exit 1
fi

npm run test

if [ $? -eq 1 ]
then
  echo 'Some unit test failed'
  exit 1
fi

echo 'Running endpoint tests against local server...'
newman run ./postman/local.json --bail --silent
if [ $? -eq 1 ]
then
  echo 'Some endpoint test failed in local server'
  exit 1
fi

bash ./build_postman_server.sh

#echo 'Copying .env file to server...'
#scp ./.env root@icra.loading.net:/var/www/vhosts/icradev.cat/snappAPI-v2.icradev.cat/snappAPI-v2

echo 'Connecting to server...'
ssh root@icra.loading.net "
cd /var/www/vhosts/icradev.cat/nat4wat-API.icradev.cat/nat4wat-api ;
sudo -u icradev git pull --allow-unrelated-histories ;
sudo -u icradev npm install ;
sudo -u icradev find . -type f -exec chmod 644 {} \; ;
sudo -u icradev find . -type d -exec chmod 755 {} \; ;
touch ./tmp/restart.txt ;
echo 'Deployment done!'
"

newman run ./postman/server.json