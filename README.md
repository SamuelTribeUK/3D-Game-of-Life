# 3D-Game-of-Life version 1.5
A Web-Based 3D Implementation of John Conway’s Game of Life Cellular Automaton (Final Year Project)

This is the git repository for my final year university project. This project aims to create a web-based 3D version of the game of life cellular automaton (https://www.conwaylife.com/)

Version 1.0 allows users to create custom grid sizes and game speeds, stop and start the game, and step through a single iteration. Notifications are displayed using toastify-js when settings are invalid or if the settings might cause lag.

Version 1.1 added JSON functionality allowing the game grid to be exported to text in the settings panel and custom game states in JSON Array format can be loaded by pasting it in the JSON textarea on the settings panel.

Version 1.2 added Presets and Rules selection boxes (see heading Presets and Rules below for more info).

Version 1.3 added a toggle box to hide dead cells. This can dramatically improve performance if the majority of cells in the game are dead. Also added a basic wireframe box to represent the boundaries of the grid.

Version 1.4 provided a back-end update that moved the live neighbour checking part of the code into a web worker so it runs on its own thread. This should help with CPU usage with low powered machines and big grid sizes. A modern browser that supports web workers is now required.

Version 1.5 added a glider preset based on a glider shown by Carter Bays in the Complex systems 1 Journal in 1987 (373-400). New rules have also been implemented for this preset, B6/S567. The journal pages by Carter Bays can be found here: https://wpmedia.wolfram.com/uploads/sites/13/2018/02/01-3-1.pdf

## How to deploy to the webserver
After the new configuration changes and new files added in wip-core-server, the project can now be deployed to a web server. For this project, I am using an IONOS VPS running Ubuntu 20.04, I use Nginx configured to use port 3000 as this is the node application port for my project and it is fully configured with SSL and a domain (gol.samueltribe.com).

When I want to deploy to the server (usually after merging a feature branch with dev or dev with master) I clone the git repo on the webserver, change to the desired branch and use npm install (ensure you have installed node js and npm), then run 'npm run build-production'. This will generate the production build of the project within the dist folder. I have a server.js file using express to use the dist folder for the application and to listen on port 3000 (for Nginx). I then use 'forever' to start server.js forever in the background (helpful when using SSH like me), then try to connect to the website.

Hopefully, if all is completed correctly, you should see the 3D Game of Life webpage!

## Font: Cascadia Code
The preferred font used for the site is Cascadia Code (https://github.com/microsoft/cascadia-code) and is free to use under the SIL Open Font Licence 1.1 (https://scripts.sil.org/cms/scripts/page.php?item_id=OFL).

## Presets and Rules
As of v 1.5, there are 4 pre-set options:
1. Custom (This is the standard random starting config with dimensions and speed user specified)
2. Blinker B45/S5 (This was implemented based on http://rbeaulieu.github.io/3DGameOfLife/)
3. Accordion Replicator B45/S5 (This was implemented based on http://rbeaulieu.github.io/3DGameOfLife/)
4. Carter Bays Glider B6/S567 (This was implemented based on "Candidates for the Game of Life in Three Dimensions" by Carter Bays, published in the first edition of the Complex Systems Journal 1987 (373-400))

I want it to be clear that The Blinker and Accordion pre-set configurations were not discovered by me, I found them from Raphael Beaulieu's and Elliot Coy's 3D Game of life linked above. The Carter Bays Glider was implemented based on the journal publication linked above.
