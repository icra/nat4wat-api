#!/bin/bash

cp ./postman/local.json ./postman/server.json
sed -i -e 's,http://localhost:3000/,https://snappapi-v2.icradev.cat/,g' ./postman/server.json
sed -i -e 's,"http","https",g' ./postman/server.json
sed -i -e 's/"localhost"/"snappapi-v2","icradev","cat"/g' ./postman/server.json
sed -i -e 's/"port": "3000",//g' ./postman/server.json