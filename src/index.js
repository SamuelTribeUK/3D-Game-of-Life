import {
	AmbientLight,
	BoxGeometry,
	EdgesGeometry,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshLambertMaterial,
	PerspectiveCamera,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import './main.css';
import './settingsPanel.js';
import {notify} from './notification.js';
import Worker from './game.worker.js';

let $ = require('jquery/src/core');

let xSize = 10;
let ySize = 10;
let zSize = 10;
let timeout = 200;
let orbitToggle = true;
let warning = false;
let orbitCheckbox;
let hideDead = false;
let resizeTimer = false;

let gameBoard;
let gameArray;
let startingArray;
let worker;

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
let controls;
let light = new AmbientLight(0xFFFFFF,1);

/**
 * The simulateStep function uses the game.worker.js web worker to deep copy the current gameArray and calculate the
 * gameArray values for the next iteration. After the board has been checked, if no cells have changed then the game is
 * stopped. The settings panel and cube colours are then updated with their respective functions.
 */
function simulateStep() {
	let ruleset = document.getElementById("presetRules").value;
	// If web workers are allowed in the browser then run code on game.worker.js
	if (window.Worker) {
		// This is just in case the web worker was terminated, a new web worker will be created
		if (!worker) {
			worker = new Worker();
		}
		worker.postMessage([gameArray,xSize,ySize,zSize,ruleset]);
	} else {
		console.log("Browser does not support web workers, cannot run");
		notify("Incompatible browser! please use a modern browser such as Chrome or Firefox","error",10000);
		window.alert("Your browser does not support Web Workers which are required by this website, please use modern browser such as Chrome or Firefox");
	}
}

/**
 * The setupScene function creates a new scene matching the dimensions of the window. A wire-frame cube is drawn using
 * LineSegments to represent the boundaries of the grid. An ambient light is added to the scene, this is so shadows
 * don't cause confusion over cell states.
 */
function setupScene() {

	renderer.setClearColor(backgroundColour);
	renderer.setSize(window.innerWidth, window.innerHeight);

	let geo = new EdgesGeometry(new BoxGeometry(xSize, ySize, zSize));
	let mat = new LineBasicMaterial( { color: deadCellColour, linewidth: 2 } );

	let wireframe = new LineSegments(geo,mat);

	wireframe.position.set((xSize/2.0) -0.5, (ySize/2.0) -0.5, (zSize/2.0)-0.5);

	scene.add(wireframe);

	scene.add(light);
}

/**
 * The newRandomBoard function generates a new gameBoard (array containing the mesh boxes), gameArray (containing the
 * states of the cells, and startingArray (a copy of the starting gameArray states so the game can be reset. Initial
 * game states are generated at random.
 */
function newRandomBoard() {
	document.getElementById("stopStart").innerText = "Start";
	gameBoard = new Array(xSize);
	gameArray = new Array(xSize);
	startingArray = new Array(xSize);
	for (let i = 0; i < xSize; i++) {
		gameBoard[i] = new Array(ySize);
		gameArray[i] = new Array(ySize);
		startingArray[i] = new Array(ySize);
		for (let j = 0; j < ySize; j++) {
			gameBoard[i][j] = new Array(zSize);
			gameArray[i][j] = new Array(zSize);
			startingArray[i][j] = new Array(zSize);
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

/**
 * The newBoardFromJSON function generates a new gameBoard (array containing the mesh objects) generated from the JSON
 * textarea.
 */
function newBoardFromJSON() {
	document.getElementById("stopStart").innerText = "Start";
	gameBoard = new Array(xSize);
	for (let i = 0; i < xSize; i++) {
		gameBoard[i] = new Array(ySize);
		for (let j = 0; j < ySize; j++) {
			gameBoard[i][j] = new Array(zSize);
			for (let k = 0; k < zSize; k++) {
				addMesh(gameArray[i][j][k],i,j,k);
			}
		}
	}
}

/**
 * The addMesh function takes a state (1 for alive and 0 for dead) and coordinates (i, j, k representing x, y and z) and
 * creates a geometry and material to make a mesh with the coordinates set to the i, j and k values. If the state is 0
 * (dead) then the opacity of the material is set to 0.1 (10%) and the colour is set to white. If the state is 1 (alive)
 * then the opacity of the material is set to 1 (100%) and the colour is set to #c24d2c (the orange used for the rest of
 * the website). The gameArray and startingArray are assigned the state values in the location [i][j][k]. The gameBoard
 * is assigned the mesh in the location [i][j][k] and this value is then added to the scene.
 *
 * @param {number} state - The state of the cell (either 1 for alive or 0 for dead)
 * @param {number} i - The x coordinate of the cell to be added (also corresponds to the i location in the
 * gameArray[i][j][k] commonly used throughout this project.
 * @param {number} j - The y coordinate of the cell to be added (also corresponds to the j location in the
 * gameArray[i][j][k] commonly used throughout this project.
 * @param {number} k - The z coordinate of the cell to be added (also corresponds to the k location in the
 * gameArray[i][j][k] commonly used throughout this project.
 */
function addMesh(state,i,j,k) {
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
	gameArray[i][j][k] = state;
	startingArray[i][j][k] = state;
	gameBoard[i][j][k] = mesh;
	scene.add(gameBoard[i][j][k]);
}

/**
 * The attachClickEvents function adds all of the appropriate functions as eventListeners for the settings Panel. The
 * input fields are populated with the initial values.
 * */
function attachClickEvents()  {
	let element = document.getElementById("stopStart");
	element.addEventListener("click", stopStart);

	element = document.getElementById("step");
	element.addEventListener("click", step);

	element = document.getElementById("reset");
	element.addEventListener("click", gameReset);

	element = document.querySelector("#submit");
	element.addEventListener("click", newGameBoard);

	orbitCheckbox.addEventListener("change", toggleOrbitControls);

	element = document.getElementById("hideDeadBox");
	element.addEventListener("click", showHideDeadCells);

	element = document.getElementById("presets");
	element.addEventListener("change", presetSelect);

	element = document.getElementById("xSizeInput");
	element.value = xSize;

	element = document.getElementById("ySizeInput");
	element.value = ySize;

	element = document.getElementById("zSizeInput");
	element.value = zSize;

	element = document.getElementById("timeoutInput");
	let rate = 1000 / timeout;
	element.value = rate.toFixed(1);

	document.getElementById("jsonBtn").onclick = showHideJSON;
	document.getElementById("jsonLoadBtn").onclick = loadJSON;

	//
	window.addEventListener("resize", resizeListener);
}

/**
 * The resizeListener function is used as an eventListener for when the window resizes. A setTimeout is used to call the
 * resizeWindow function after 100ms, and if the window is resized within that time, the timer is reset. This prevents
 * the renderer and camera from updating too many times when resizing. This was implemented thanks to a StackOverflow
 * answer by theftprevention: https://bit.ly/2MNbfy8
 */
function resizeListener() {
	if (resizeTimer) {
		clearTimeout(resizeTimer);
	}
	resizeTimer = setTimeout(resizeWindow, 100);
}

/**
 * The resizeWindow function updates the renderer size and camera aspect to match the dimensions of the window (after
 * resizing). RequestAnimationFrame is called to ensure the scene is updated to the user.
 */
function resizeWindow() {
	resizeTimer = false;
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	requestAnimationFrame(render);
}

/**
 * The stopStart function is called when the user clicks the stop/start button, this function handles the stopping and
 * starting of the game using setInterval and clearInterval, updating the sidebar and button text in the process. The
 * timeInput value is also updated. If orbit controls are disabled requestAnimationFrame is then also called.
 */
function stopStart() {
	if (status === "stopped") {
		let timeInput = document.getElementById("timeoutInput").value;

		if (timeInput < 0.1) {
			notify("speed must be 0.1 or more", "error", 5000);
			return false;
		}

		if (timeInput > 10) {
			notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
		}
		timeout = 1000 / timeInput;
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

/**
 * The step function is called when the step button is clicked and it runs one iteration of simulateStep. If the game is
 * already running then clearInterval is used to stop the game first before calling simulateStep.
 */
function step() {
	if (status === "stopped") {
		simulateStep();
	} else {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		simulateStep();
	}
}

let gameReset = function() {
	let timeInput = document.getElementById("timeoutInput").value;

	if (timeInput < 0.1) {
		notify("speed must be 0.1 or more", "error", 5000);
		return false;
	}

	if (timeInput > 10) {
		notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
	}

	newGameFromJSON(startingArray,timeInput);
}

// When the game ends due to no changed cells, this code is executed to update the settings panel and stop timeout for the game.
let endGame = function() {
	clearInterval(interval);
	document.getElementById("stopStart").innerText = "Start";
	status = "stopped";
	notify("Game has ended","success",10000);
	updateSidebar();
}

/* The orbit controls can be disabled using this function. It sets controls.enabled and orbitToggle to false and adds
 * arrow key event listeners for the standard camera controls */
let disableOrbit = function() {
	controls.enabled = false;
	orbitToggle = false;
	document.addEventListener("keydown", arrowKeyCameraControls);
}

let enableOrbit = function() {
	// Enable orbit controls
	document.removeEventListener("keydown", arrowKeyCameraControls);
	controls.enabled = true;
	controls.target = (new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2));
	orbitToggle = true;
	// notify("Orbit controls enabled","success",5000);
	render();
}

let showHideDeadCells = function() {
	hideDead = document.getElementById("hideDeadBox").value;
	updateColours();
}

/* toggleOrbitControls handles the orbit camera controls being enabled/disabled and configures the target of the camera.
 * The arrow key event listeners for the standard camera controls are disabled when enabling orbit controls to avoid
 * conflicts with the existing event listeners included with orbit controls */
let toggleOrbitControls = function() {
	if (orbitCheckbox.checked) {
		enableOrbit();
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
	let hideDead = document.getElementById("hideDeadBox").checked;
	let state;
	let opacity = 1;
	let colour = liveCellColour;
	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				state = gameArray[i][j][k];
				opacity = 1;
				colour = liveCellColour;
				gameBoard[i][j][k].visible = true;
				if (state === 0) {
					if (hideDead) {
						gameBoard[i][j][k].visible = false;
					} else {
						opacity = 0.1;
						colour = deadCellColour;
						gameBoard[i][j][k].visible = true;
					}
				}
				gameBoard[i][j][k].material.opacity = (opacity);
				gameBoard[i][j][k].material.color.set(colour);
			}
		}
	}
}

// The game status and number of iterations on the side bar are updated using the updateSidebar function
let updateSidebar = function() {
	document.getElementById("status").innerText = "Status: " + status;
	document.getElementById("iterations").innerText = "Iterations: " + iterations;
	document.getElementById("xSizeInput").value = xSize.toString();
	document.getElementById("ySizeInput").value = ySize.toString();
	document.getElementById("zSizeInput").value = zSize.toString();
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

	if (inputX === "" || inputY === "" || inputZ === "" || timeInput === "") {
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
	gameArray = null;
	iterations = 0;

	scene = new Scene();

	setupScene();

	newRandomBoard();

	updateSidebar();
	let jsonTextarea = document.getElementById("jsonTextInput");
	if (jsonTextarea.style.visibility === "visible") {
		jsonTextarea.value = JSON.stringify(gameArray);
	}

	camera.lookAt(new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2));

	if (orbitToggle) {
		// If orbitToggle is enabled then disable and wait 10ms before enabling, this removes the lag issue after update
		disableOrbit();
		setTimeout(enableOrbit, 10);
	} else {
		render();
	}
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

let presetSelect = function() {
	let preset = document.getElementById("presets").value;
	let updateBtn = document.getElementById("submit");
	let rules = document.getElementById("presetRules");

	let dimensionInputs = document.getElementsByClassName("inputField");

	switch (preset) {
		case "Random": {
			for (let i = 0; i < dimensionInputs.length; i++) {
				dimensionInputs[i].disabled = false;
			}
			updateBtn.disabled = false;

			break;
		}
		case "Blinker B45/S5": {
			for (let i = 0; i < dimensionInputs.length; i++) {
				dimensionInputs[i].disabled = true;
			}
			rules.value = "B45/S5";
			updateBtn.disabled = true;

			let blinkerArray = [[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,1,1,1,0,0],[0,0,0,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
													[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]];

			let timeInput = document.getElementById("timeoutInput").value;

			if (timeInput < 0.1) {
				notify("speed must be 0.1 or more", "error", 5000);
				break;
			}

			if (timeInput > 10) {
				notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
			}

			newGameFromJSON(blinkerArray,timeInput);
			break;
		}
		case "Accordion Replicator B45/S5": {
			for (let i = 0; i < dimensionInputs.length; i++) {
				dimensionInputs[i].disabled = true;
			}

			rules.value = "B45/S5";

			updateBtn.disabled = true;

			let accordionArray = [[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,1,0],[1,1,1],[0,1,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]],
														[[0,0,0],[0,0,0],[0,0,0]]];

			let timeInput = document.getElementById("timeoutInput").value;

			if (timeInput < 0.1) {
				notify("speed must be 0.1 or more", "error", 5000);
				break;
			}

			if (timeInput > 10) {
				notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
			}

			newGameFromJSON(accordionArray,timeInput);
			break;
		} case "Carter Bays Glider B6/S567": {
			for (let i = 0; i < dimensionInputs.length; i++) {
				dimensionInputs[i].disabled = true;
			}

			rules.value = "B6/S567";

			updateBtn.disabled = true;

			let gliderArray = new Array(30);

			for (let i = 0; i < 30; i++) {
				gliderArray[i] = new Array(30);
				for (let j = 0; j < 30; j++) {
					gliderArray[i][j] = new Array(2);
					if ((i === 0 && j === 27) || (i === 1) && (j === 27 || j===29) || (i === 2) && (j === 27 || j === 28)) {
						gliderArray[i][j][0] = 1;
						gliderArray[i][j][1] = 1;
					} else {
						for (let k = 0; k < 2; k++) {
							gliderArray[i][j][k] = 0;
						}
					}
				}
			}

			let timeInput = document.getElementById("timeoutInput").value;

			if (timeInput < 0.1) {
				notify("speed must be 0.1 or more", "error", 5000);
				break;
			}

			if (timeInput > 10) {
				notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
			}

			newGameFromJSON(gliderArray,timeInput);
			break;
		}
	}
}

function showHideJSON() {
	let jsonTextarea = document.getElementById("jsonTextInput");
	let jsonBtn = document.getElementById("jsonBtn");
	let jsonLoadBtn = document.getElementById("jsonLoadBtn");

	if (jsonBtn.innerText === "show JSON") {
		jsonTextarea.style.height = "200px";
		jsonTextarea.style.visibility = "visible";
		jsonBtn.innerText = "hide JSON";
		jsonLoadBtn.style.visibility = "visible";
		jsonLoadBtn.style.display = "block";
		jsonTextarea.value = JSON.stringify(gameArray);
	} else {
		jsonTextarea.style.height = "0px";
		jsonTextarea.style.visibility = "hidden";
		jsonBtn.innerText = "show JSON";
		jsonLoadBtn.style.visibility = "hidden";
		jsonLoadBtn.style.display = "none";
	}
}

let loadJSON = function() {
	let input = document.getElementById("jsonTextInput").value;
	try {
		let parsedInput = JSON.parse(input);
		let incorrectFormat = false;
		for (let i = 0; i < parsedInput.length; i++) {
			if (parsedInput[i].length !== parsedInput[0].length) {
				incorrectFormat = true;
			}
			for (let j = 0; j < parsedInput[0].length; j++) {
				if (parsedInput[i][j].length !== parsedInput[0][0].length) {
					incorrectFormat = true;
				}
			}
		}

		if (incorrectFormat) {
			notify("ERROR: incorrect JSON Array format","error",3000);
		}

		let timeInput = document.getElementById("timeoutInput").value;

		if (timeInput < 0.1) {
			notify("speed must be 0.1 or more", "error", 5000);
			return false;
		}

		if (timeInput > 10) {
			notify("WARNING: Rates higher than 10 can cause issues!", "error", 5000);
		}

		newGameFromJSON(parsedInput,timeInput);

	} catch (e) {
		notify("ERROR: incorrect JSON", "error", 3000);
	}
}

let newGameFromJSON = function(jsonArray,timeInput) {
	doDispose(scene);


	if (status === "playing") {
		stopStart();
	}

	gameBoard = undefined;
	gameArray = undefined;
	gameArray = $.extend(true, [], jsonArray);
	startingArray = $.extend(true, [], jsonArray);
	timeout = 1000 / timeInput;
	iterations = 0;

	xSize = gameArray.length;
	ySize = gameArray[0].length;
	zSize = gameArray[0][0].length;

	scene = new Scene();

	setupScene();

	newBoardFromJSON();

	updateSidebar();

	camera.lookAt(new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2));

	if (orbitToggle) {
		// If orbitToggle is enabled then disable and wait 10ms before enabling, this removes the lag issue after update
		disableOrbit();
		setTimeout(enableOrbit, 10);
	} else {
		render();
	}
	updateColours();
}

setupScene();
newRandomBoard();


let existingOnload = window.onload;
window.onload = function() {
	// If a function is already assigned to window.onload then execute that first, then run code below
	// This ensures no conflicts with settingsPanel onload function
	if(typeof(existingOnload) == "function"){ existingOnload(); }
	worker = new Worker();
	// When a message is received, the gameArray is updated with the new values, the
	worker.onmessage = function(e) {
		iterations += 1;
		if (!e.data[1]) endGame();

		gameArray = e.data[0];
		updateSidebar();
		updateColours();

		if (!(orbitToggle)) requestAnimationFrame(render);
	}
	camera.position.z = Math.max(xSize,ySize,zSize) * 1.5;

	camera.position.x = xSize * 1.5;
	camera.position.y = ySize * 1.5;

	controls = new OrbitControls(camera, canvas);

	controls.target = new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2);

	camera.updateProjectionMatrix();
	orbitCheckbox = document.getElementById("orbitControls");
	orbitCheckbox.checked = true;
	attachClickEvents();

	document.getElementById("stopStart").innerText = "Start";
	status = "stopped";
	updateSidebar();
};

render();