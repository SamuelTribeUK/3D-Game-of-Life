# 3D-Game-of-Life version 1.0
A Web-Based 3D Implementation of John Conway’s Game of Life Cellular Automaton (Final Year Project)
This is the git repository for my final year university project. This project aims to create a web-based 3D version of the game of life cellular automaton (https://www.conwaylife.com/)
This version allows users to create custom grid sizes and game speeds, stop and start the game, and step through a single iteration. Notifications are displayed using toastify-js when settings are invalid or if the settings might cause lag.

## How to deploy to the webserver
After the new configuration changes and new files added in wip-core-server, the project can now be deployed to a web server. For this project, I am using an IONOS VPS running Ubuntu 20.04, I use Nginx configured to use port 3000 as this is the node application port for my project and it is fully configured with SSL and a domain (gol.samueltribe.com).

When I want to deploy to the server (usually after merging a feature branch with dev or dev with master) I clone the git repo on the webserver, change to the desired branch and use npm install (ensure you've installed node js and npm), then run 'npm run build-production'. This will generate the production build of the project within the dist folder. I have a server.js file using express to use the dist folder for the application and to listen on port 3000 (for Nginx). I then use 'forever' to start server.js forever in the background (helpful when using SSL like me), then try to connect to the website.

Hopefully, if all is completed correctly, you should see the 3D Game of Life webpage!

## Font: Cascadia Code
The preferred font used for the site is Cascadia Code (https://github.com/microsoft/cascadia-code) and is free to use under the SIL Open Font Licence 1.1 (https://scripts.sil.org/cms/scripts/page.php?item_id=OFL). 