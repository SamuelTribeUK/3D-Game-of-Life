import {AmbientLight, BoxGeometry, Mesh, MeshLambertMaterial, PerspectiveCamera, Scene, WebGLRenderer,} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
let $ = require('jquery/src/core');
// import Toastify from "toastify-js";
import './main.css';
import './settingsPanel.js';

// TODO all values below are copied from the prototype 2d game of life, adapt these to a 3d implementation

let xSize = 10;
let ySize = 10;
let zSize = 10;
let timeout = 200;
let orbitToggle = true;
let resizeTimer = false;

let gameBoard;

let liveCellColour = "#c24d2c";
let deadCellColour = "#d9dad7";
let backgroundColour = "#1a2639";

let iterations = 0;
let status="stopped";

let interval;

const canvas = document.querySelector('canvas');

let scene = new Scene();
let camera = new PerspectiveCamera(75, (window.innerWidth)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true, canvas: canvas});
let controls = new OrbitControls(camera, canvas);
// controls.enabled = true;
let geometry = new BoxGeometry(0.5, 0.5, 0.5);
let light = new AmbientLight(0xFFFFFF,1);

// TODO all functions below at the moment are copied over from the 2d prototype code, adapt these for 3D

/* simulateStep creates a deep copy of the game board to iterate over each cell and check for living neighbours to check
 * against the rules of the Game of Life. The new game board is required so there aren't conflicts with changes. After
 * the board has been checked, if no cells have changed then the game is stopped. The side bar and cube colours are then
 * updated with their respective functions */
let simulateStep = function() {
	console.log("simulate step called");
	let newGameBoard = $.extend(true, [], gameBoard);

	let changed = false;

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				let liveNum = 0;
				for (let l = -1; l < 2; l++) {
					for (let m = -1; m < 2; m++) {
						for (let n = -1; n < 2; n++) {
							if (!((l === 0) && (m === 0) && (n === 0))) {
								liveNum += checkCell(i+l, j+m, k+n);
							}
						}
					}
				}
				// B3/S23 (Standard 2D GoL)
				if ((liveNum === 3) && gameBoard[i][j][k].state === 0) {
					changed = true;
					newGameBoard[i][j][k].state = 1;
				} else if (!(liveNum === 2 || liveNum === 3) && gameBoard[i][j][k].state === 1) {
					changed = true;
					newGameBoard[i][j][k].state = 0;
				}

				// B45/S5
				// if ((liveNum === 4 || liveNum === 5) && gameBoard[i][j][k].state === 0) {
				// 	changed = true;
				// 	newGameBoard[i][j][k].state = 1;
				// } else if (!(liveNum === 5) && gameBoard[i][j][k].state === 1) {
				// 	newGameBoard[i][j][k].state = 0;
				// }

				// B36/S23 (2D Highlife)
				// if ((liveNum === 3 || liveNum === 6) && gameBoard[i][j][k].state === 0) {
				// 	changed = true;
				// 	newGameBoard[i][j][k].state = 1;
				// } else if (!(liveNum === 2 || liveNum === 3) && gameBoard[i][j][k].state === 1) {
				// 	changed = true;
				// 	newGameBoard[i][j][k].state = 0;
				// }
			}
		}
	}
	gameBoard = $.extend(true, [], newGameBoard);

	iterations += 1;

	if (!changed) {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		updateSidebar();
	}

	updateSidebar();
	updateColours();

	if (!(orbitToggle)) requestAnimationFrame(render);
}

/* checkCell takes an x, y and z value and checks the game board if the cell at that location is alive or dead and returns
 * 1 if it is alive and 0 if dead. Out of bound cells are handled by returning 0 */
let checkCell = function(currX, currY, currZ) {
	if (currX < 0 || currX >= xSize) {
		return 0;
	} else if (currY < 0 || currY >= ySize) {
		return 0;
 	} else if (currZ < 0 || currZ >= zSize) {
		return 0;
	} else if (gameBoard[currX][currY][currZ].state === 1) {
		return 1;
	} else {
		return 0;
	}
}

/* The camera z location is the largest of the x and y sizes with the x and y values being the centre of the grid. The
 * background colour is set to white. The canvas size is set to the window inner sizes with the width - 250 to account
 * for the side panel. The addLights function is called to add 2 PointLights */
let setupScene = function() {
	camera.position.z = Math.max(xSize,ySize,zSize) * 2;

	camera.position.x = (xSize - 1) / 2;
	camera.position.y = (ySize - 1) / 2;

	renderer.setClearColor(backgroundColour);
	renderer.setSize(window.innerWidth, window.innerHeight);

	scene.add(light);
}

// Initialise the 3D array game board with the specified x, y and z sizes and populate it with random cells
let initialiseBoard = function() {
	document.getElementById("stopStart").innerText = "Start";
	gameBoard = new Array(xSize);
	for (let i = 0; i < xSize; i++) {
		gameBoard[i] = new Array(ySize);
		for (let j = 0; j < ySize; j++) {
			gameBoard[i][j] = new Array(zSize);
		}
	}

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				let state = Math.floor(Math.random() * 2);
				addMesh(state, i, j, k);
			}
		}
	}
}


let addMesh = function(state, i, j, k) {
	let opacity = 1;
	let colour = liveCellColour;
	if (state === 0) {
		opacity = 0.1;
		colour = deadCellColour;
	}
	let material = new MeshLambertMaterial({color: colour, opacity: opacity, transparent: true});
	let mesh = new Mesh(geometry, material);
	mesh.position.set(i,j,k);
	gameBoard[i][j][k] = {box: mesh, state: state};
	scene.add(gameBoard[i][j][k].box);
}

/* The functions that handle all buttons and inputs on the side panel are attached in this function, as well as the
 * resize event function and the arrow key camera controls. The input fields are populated with the start values */
let attachClickEvents = function() {
	// element.addEventListener("click", stopStart);
	//
	// element = document.querySelector("#submit");
	// element.addEventListener("click", newGameBoard);

	let element = document.getElementById("xSizeInput");
	element.value = xSize;

	element = document.getElementById("ySizeInput");
	element.value = ySize;

	element = document.getElementById("timeoutInput");
	let rate = 1000 / timeout;
	element.value = rate.toFixed(1);

	// Window resize lag fix function below adapted from StackOverflow: https://bit.ly/2MNbfy8 answer by theftprevention
	window.addEventListener("resize", () => {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
		}
		resizeTimer = setTimeout(resizeWindow, 300);
	});

	// document.addEventListener("keydown", arrowKeyCameraControls);
	// document.addEventListener('mousedown', onDocumentMouseDown, false);
}

// Window resize lag fix function below adapted from StackOverflow: https://bit.ly/2MNbfy8 answer by theftprevention
let resizeWindow = function() {
	resizeTimer = false;
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	requestAnimationFrame(render);
}

/* updateColours iterates over the game board and updates the colours of the cubes on the canvas to represent the living
 * and dead cells with green and white respectively */
let updateColours = function() {
	let state;
	let opacity = 1;
	let colour = liveCellColour;
	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				state = gameBoard[i][j][k].state;
				opacity = 1;
				colour = liveCellColour;
				if (state === 0) {
					opacity = 0.1;
					colour = deadCellColour;
				}
				gameBoard[i][j][k].box.material.opacity = (opacity);
				gameBoard[i][j][k].box.material.color.set(colour);
			}
		}
	}
}

// The game status and number of iterations on the side bar are updated using the updateSidebar function
let updateSidebar = function() {
	document.getElementById("status").innerText = "Status: " + status;
	document.getElementById("iterations").innerText = "Iterations: " + iterations;
}

/* render renders the objects in the scene in accordance to the camera location. If orbit controls are enabled then an
 * animation frame is requested too */
let render = function() {
	if (orbitToggle) {
		requestAnimationFrame(render);
	}
	renderer.render(scene, camera);
}


/* TODO Develop the code to set up the canvas after the window has loaded, all code after this are functions used for
 *  the game of life */

setupScene();
initialiseBoard();

let existingOnload = window.onload;
window.onload = function(){
	// If a function is already assigned to window.onload then execute that first, then run code below
	// This ensures no conflicts with settingsPanel onload function
	if(typeof(existingOnload) == "function"){ existingOnload(); }

	attachClickEvents();
	interval = setInterval(simulateStep, timeout);
	document.getElementById("stopStart").innerText = "Stop";
	status = "playing";
	updateSidebar();
};

render();