ssh root@icra.loading.net "
cd /var/www/vhosts/icradev.cat/snappAPI-v2.icradev.cat/snappAPI-v2 ;
sudo -u icradev git pull ;
sudo -u icradev find . -type f -exec chmod 644 {} \; ;
sudo -u icradev find . -type d -exec chmod 755 {} \; ;
touch ./tmp/restart.txt ;
"