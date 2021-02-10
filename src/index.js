import {
	AmbientLight,
	BoxGeometry,
	Mesh,
	MeshLambertMaterial,
	PerspectiveCamera,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
let $ = require('jquery/src/core');
import './main.css';
import './settingsPanel.js';
import {notify} from './notification.js';

let xSize = 10;
let ySize = 10;
let zSize = 10;
let timeout = 200;
let orbitToggle = true;
let warning = false;
let orbitCheckbox;
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
let light = new AmbientLight(0xFFFFFF,1);

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
		notify("Game has ended","success",10000);
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
	let geometry = new BoxGeometry(0.5, 0.5, 0.5);
	let material = new MeshLambertMaterial({color: colour, opacity: opacity, transparent: true});
	let mesh = new Mesh(geometry, material);
	mesh.position.set(i,j,k);
	gameBoard[i][j][k] = {box: mesh, state: state};
	scene.add(gameBoard[i][j][k].box);
}

/* The functions that handle all buttons and inputs on the side panel are attached in this function, as well as the
 * resize event function and the arrow key camera controls. The input fields are populated with the start values */
let attachClickEvents = function() {
	let element = document.getElementById("stopStart");
	element.addEventListener("click", stopStart);

	element = document.querySelector("#submit");
	element.addEventListener("click", newGameBoard);

	element = document.getElementById("step");
	element.addEventListener("click", step);

	orbitCheckbox.addEventListener("change", toggleOrbitControls);

	element = document.getElementById("xSizeInput");
	element.value = xSize;

	element = document.getElementById("ySizeInput");
	element.value = ySize;

	element = document.getElementById("zSizeInput");
	element.value = zSize;

	element = document.getElementById("timeoutInput");
	let rate = 1000 / timeout;
	element.value = rate.toFixed(1);

	// Window resize lag fix function below adapted from StackOverflow: https://bit.ly/2MNbfy8 answer by theftprevention
	window.addEventListener("resize", () => {
		if (resizeTimer) {
			clearTimeout(resizeTimer);
		}
		resizeTimer = setTimeout(resizeWindow, 100);
	});

	document.addEventListener("keydown", arrowKeyCameraControls);
}

// Window resize lag fix function below adapted from StackOverflow: https://bit.ly/2MNbfy8 answer by theftprevention
let resizeWindow = function() {
	resizeTimer = false;
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	requestAnimationFrame(render);
}

/* When the user clicks the stop/start button, this function handles the stopping and starting of the game using
 * setInterval nad clearInterval, updating the sidebar and button text in the process */
let stopStart = function() {
	if (status === "stopped") {
		interval = setInterval(simulateStep, timeout);
		document.getElementById("stopStart").innerText = "Stop";
		status = "playing";
		updateSidebar();
	} else {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		updateSidebar();
	}
	if (!(orbitToggle)) requestAnimationFrame(render);
}

// When the user clicks the step button, this function stops the game if it's running and simulates one step
let step = function() {
	if (status === "stopped") {
		simulateStep();
	} else {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		simulateStep();
		updateSidebar();
	}
}

/* The orbit controls can be disabled using this function. It sets controls.enabled and orbitToggle to false and adds
 * arrow key event listeners for the standard camera controls */
let disableOrbit = function() {
	controls.enabled = false;
	orbitToggle = false;
	document.addEventListener("keydown", arrowKeyCameraControls);
}

/* toggleOrbitControls handles the orbit camera controls being enabled/disabled and configures the target of the camera.
 * The arrow key event listeners for the standard camera controls are disabled when enabling orbit controls to avoid
 * conflicts with the existing event listeners included with orbit controls */
let toggleOrbitControls = function() {
	if (orbitCheckbox.checked) {
		// Enable orbit controls
		document.removeEventListener("keydown", arrowKeyCameraControls);
		controls.enabled = true;
		controls.target = (new Vector3((xSize - 1) / 2, (ySize - 1) / 2, 0));
		orbitToggle = true;
		notify("Orbit controls enabled","success",5000);
		render();
	} else {
		// Disable orbit controls
		disableOrbit();
	}
}

/* arrowKeyCameraControls manages the camera location movement, requesting an animation frame after camera movement to
 * render the changes on the canvas */
let arrowKeyCameraControls = function(event) {
	let direction = new Vector3;
	camera.getWorldDirection(direction);

	if (direction.z < 0) {
		switch (event.key) {
			case 'ArrowUp' || 'Up':
				camera.position.y += 1;
				break;
			case 'ArrowLeft' || 'Left':
				camera.position.x -= 1;
				break;
			case 'ArrowRight' || 'Right':
				camera.position.x += 1;
				break;
			case 'ArrowDown' || 'Down':
				camera.position.y -= 1;
		}
	} else {
		switch (event.key) {
			case 'ArrowUp' || 'Up':
				camera.position.y += 1;
				break;
			case 'ArrowLeft' || 'Left':
				camera.position.x += 1;
				break;
			case 'ArrowRight' || 'Right':
				camera.position.x -= 1;
				break;
			case 'ArrowDown' || 'Down':
				camera.position.y -= 1;
		}
	}

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

/* newGameBoard is called when the user clicks the update button on the side bar. First the inputs are validated and if
 * all values are valid then the scene is disposed using doDispose and the new values are used to create a new scene. */
let newGameBoard = function(event) {
	event.preventDefault(); // This stops the form from submitting and refreshing the page
	let inputX = document.getElementById("xSizeInput").value;
	let inputY = document.getElementById("ySizeInput").value;
	let inputZ = document.getElementById("zSizeInput").value;
	let timeInput = document.getElementById("timeoutInput").value;

	if (inputX === "" || inputY === "" || timeInput === "") {
		notify("Dimensions or rate cannot be empty", "error", 5000);
		return false;
	}

	if (inputX < 1 || inputY < 1 || inputZ < 1) {
		notify("Dimensions must be 1 or more", "error", 5000);
		return false;
	}


	if (timeInput < 0.1) {
		notify("speed must be 0.1 or more", "error", 5000);
		return false;
	}

	if (timeInput > 10) {
		notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
	}

	if ((inputX * inputY * inputZ) > 1000)  {
		if (!warning) {
			notify("WARNING: Large dimensions can use a lot of resources! Click update again if you are sure", "error", 5000);
			warning = true;
			return false;
		}
	}

	xSize = inputX;
	ySize = inputY;
	zSize = inputZ;
	timeout = 1000 / timeInput;

	doDispose(scene);


	if (status === "playing") {
		stopStart();
	}

	gameBoard = null;
	iterations = 0;

	scene = new Scene();

	setupScene();

	initialiseBoard();

	camera.position.x = (xSize - 1) / 2;
	camera.position.y = (ySize - 1) / 2;
	camera.lookAt(new Vector3((xSize - 1) / 2, (ySize - 1) / 2, 0))

	camera.updateProjectionMatrix();

	updateSidebar();

	// if (orbitToggle) {
	// 	orbitCheckbox.checked = false;
	// 	disableOrbit();
	// } else {
	// 	render();
	// }
	render();
}

/* doDispose is a thorough deep dispose of the scene and it's children. This is called when a new game board is made to
 * avoid memory leaks. The code was taken from: https://github.com/mrdoob/three.js/issues/5175 */
let doDispose = function(obj) {
	if (obj !== null)
	{
		for (let i = 0; i < obj.children.length; i++)
		{
			doDispose(obj.children[i]);
		}
		if (obj.geometry)
		{
			obj.geometry.dispose();
			obj.geometry = undefined;
		}
		if (obj.material)
		{
			if (obj.material.map)
			{
				obj.material.map.dispose();
				obj.material.map = undefined;
			}
			obj.material.dispose();
			obj.material = undefined;
		}
	}
	obj = undefined;
}

setupScene();
initialiseBoard();


let existingOnload = window.onload;
window.onload = function(){
	// If a function is already assigned to window.onload then execute that first, then run code below
	// This ensures no conflicts with settingsPanel onload function
	if(typeof(existingOnload) == "function"){ existingOnload(); }
	orbitCheckbox = document.getElementById("orbitControls");
	orbitCheckbox.checked = true;
	attachClickEvents();

	interval = setInterval(simulateStep, timeout);
	document.getElementById("stopStart").innerText = "Stop";
	status = "playing";
	updateSidebar();
};

render();