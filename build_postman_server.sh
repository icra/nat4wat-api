#!/bin/bash

cp ./postman/local.json ./postman/server.json
sed -i -e 's,http://localhost:3001/,https://nat4wat-api.icradev.cat/,g' ./postman/server.json
sed -i -e 's,"http","https",g' ./postman/server.json
sed -i -e 's/"localhost"/"nat4wat-api","icradev","cat"/g' ./postman/server.json
sed -i -e 's/"port": "3001",//g' ./postman/server.json