
scp -r /Users/graeme/Projects/BirdNET-Pi/scripts/server.js graeme@birdnet.local:/home/graeme/BirdNET-Pi/scripts/server.js
#scp -r /Users/graeme/Projects/BirdNET-Pi/scripts/package-lock.json graeme@birdnet.local:/home/graeme/BirdNET-Pi/scripts/package-lock.json
#scp -r /Users/graeme/Projects/BirdNET-Pi/scripts/package.json graeme@birdnet.local:/home/graeme/BirdNET-Pi/scripts/package.json

ssh graeme@birdnet.local
cd /home/graeme/BirdNET-Pi/scripts/
# npm install

#pm2 start your_main_script.js
#pm2 save
#pm2 startup

pm2 reload server.js
pm2 save