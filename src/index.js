import {
	BoxGeometry,
	EdgesGeometry,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshLambertMaterial,
	PerspectiveCamera, PointLight,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import './main.css';
import './settingsPanel.js';
import {notify} from './notification.js';
import "toastify-js/src/toastify.css";
import Worker from './game.worker.js';

let $ = require('jquery/src/core');

let xSize = 10;
let ySize = 10;
let zSize = 10;
let timeout = 200;
let orbitToggle = true;
let warning = false;
let orbitCheckbox;
let hideDead = true;
let resizeTimer = false;

let gameBoard;
let gameArray;
let startingArray;
let worker;
let rules = {
	birth: [3],
	survive: [2,3],
	max: 3,
};

let liveCellColour = "#c24d2c";
let deadCellColour = "#d9dad7";
let backgroundColour = "#1a2639";

let iterations = 0;
let status="stopped";
let interval;

const canvas = document.querySelector('canvas');

let scene = new Scene();
let camera = new PerspectiveCamera(45, (window.innerWidth)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true, canvas: canvas});
let controls;
let light = new PointLight(0xFFFFFF,1);

/**
 * The simulateStep function uses the game.worker.js web worker to deep copy the current gameArray and calculate the
 * gameArray values for the next iteration. After the board has been checked, if no cells have changed then the game is
 * stopped. The settings panel and cube colours are then updated with their respective functions.
 */
function simulateStep() {
	// If web workers are allowed in the browser then run code on game.worker.js
	if (window.Worker) {
		// This is just in case the web worker was terminated, a new web worker will be created
		if (!worker) {
			worker = new Worker();
		}
		worker.postMessage([gameArray,xSize,ySize,zSize,rules.birth,rules.survive,rules.max]);
	} else {
		console.log("Browser does not support web workers, cannot run");
		notify("Incompatible browser! please use a modern browser such as Chrome or Firefox","error",10000);
		window.alert("Your browser does not support Web Workers which are required by this website, please use modern browser such as Chrome or Firefox");
	}
}

/**
 * The setupScene function creates a new scene matching the dimensions of the window. A wire-frame cube is drawn using
 * LineSegments to represent the boundaries of the grid. The camera is added to the scene, this contains the light
 * source for the scene (a PointLight) that moves with the camera.
 */
function setupScene() {

	renderer.setClearColor(backgroundColour);
	renderer.setSize(window.innerWidth, window.innerHeight);

	let geo = new EdgesGeometry(new BoxGeometry(xSize, ySize, zSize));
	let mat = new LineBasicMaterial( { color: deadCellColour, linewidth: 2 } );

	let wireframe = new LineSegments(geo,mat);

	wireframe.position.set((xSize/2.0) -0.5, (ySize/2.0) -0.5, (zSize/2.0)-0.5);

	scene.add(wireframe);

	scene.add(camera);
}

/**
 * The newRandomBoard function generates a new gameBoard (array containing the mesh boxes), gameArray (containing the
 * states of the cells, and startingArray (a copy of the starting gameArray states so the game can be reset. Initial
 * game states are generated at random.
 */
function newRandomBoard() {
	document.getElementById("stopStart").innerText = "Start";
	updateSettingsDimensions();
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
	updateSettingsDimensions();
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
 * The rulesetSelect function is executed when the ruleset drop-down selector is changed. The rules object is updated
 * with new birth, survive and max values representing the rules of the game. The birth and survive properties of the
 * rules object are arrays of integers, e.g. B45/S5 would have rules.birth = [4,5] and rules.survive = [5]. rules.max is
 * the highest value from these arrays.
 */
function rulesetSelect() {
	let ruleset = document.getElementById("presetRules").value;
	let birthConditions = document.getElementById("birthInput");
	let surviveConditions = document.getElementById("surviveInput");
	let updateRulesButton = document.getElementById("updateCustomRulesButton");
	let customText = document.getElementById("presetRules");
	switch (ruleset) {
		case "Standard": {
			birthConditions.readOnly = true;
			surviveConditions.readOnly = true;
			updateRulesButton.disabled = true;
			customText.options[customText.length - 1].text = "custom";
			rules.birth = [3];
			birthConditions.value = "3";
			rules.survive = [2, 3];
			surviveConditions.value = "2,3";
			rules.max = 3;
			break;
		}
		case "B45/S5": {
			birthConditions.readOnly = true;
			surviveConditions.readOnly = true;
			updateRulesButton.disabled = true;
			customText.options[customText.length - 1].text = "custom";
			rules.birth = [4, 5];
			birthConditions.value = "4,5";
			rules.survive = [5];
			surviveConditions.value = "5";
			rules.max = 5;
			break;
		}
		case "B36/S23": {
			birthConditions.readOnly = true;
			surviveConditions.readOnly = true;
			updateRulesButton.disabled = true;
			customText.options[customText.length - 1].text = "custom";
			rules.birth = [3, 6];
			birthConditions.value = "3,6";
			rules.survive = [2, 3];
			surviveConditions.value = "2,3";
			rules.max = 6;
			break;
		}
		case "B6/S567": {
			birthConditions.readOnly = true;
			surviveConditions.readOnly = true;
			updateRulesButton.disabled = true;
			customText.options[customText.length - 1].text = "custom";
			rules.birth = [6];
			birthConditions.value = "6";
			rules.survive = [5, 6, 7];
			surviveConditions.value = "5,6,7";
			rules.max = 7;
			break;
		}
		case "custom": {
			birthConditions.readOnly = false;
			surviveConditions.readOnly = false;
			updateRulesButton.disabled = false;
			customText.options[customText.length - 1].text = "custom *";
		}
	}
}

/**
 * The updateCustomRules function executes when the custom rules preset is selected and the update custom rules button
 * is clicked. The birth and survive inputs are parsed to ensure they are integers separated by commas. The only
 * input validation besides the integer parsing is that all numbers must be >=0. The rules object is updated with the
 * new values and a success notification is shown.
 * @returns {boolean} - false is returned if the inputted values are not valid numbers or if the format is unrecognised.
 */
function updateCustomRules() {
	event.preventDefault(); // This stops the form from submitting and refreshing the page
	let birthInput = document.getElementById("birthInput");
	let surviveInput = document.getElementById("surviveInput");
	try {

		let tempBirth = birthInput.value.split(",");
		for (const a in tempBirth) {
			tempBirth[a] = parseInt(tempBirth[a],10);
			if (isNaN(tempBirth[a])) {
				notify("Invalid rule format!","error",3000);
				return false;
			} else if (tempBirth[a] < 0) {
				notify("Rule values must be positive","error",3000);
				return false;
			}
		}

		let tempSurvive = surviveInput.value.split(",");
		for (const a in tempSurvive) {
			tempSurvive[a] = parseInt(tempSurvive[a],10);
			if (isNaN(tempSurvive[a])) {
				notify("Invalid rule format!","error",3000);
				return false;
			} else if (tempSurvive[a] < 0) {
				notify("Rule values must be positive","error",3000);
				return false;
			}
		}

		rules.birth = tempBirth;
		rules.survive = tempSurvive;
		rules.max = Math.max(...rules.birth,...rules.survive);

		birthInput.value = rules.birth.toString();
		surviveInput.value = rules.survive.toString();

		notify("Rules updated","success",3000);

		let customOption = document.getElementById("presetRules");
		customOption.options[customOption.length-1].text = "custom";
	} catch (e) {
		notify("Rules update failed!","error",3000);
	}
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

	element = document.getElementById("presetRules");
	element.addEventListener("change", rulesetSelect);

	element = document.getElementById("updateCustomRulesButton");
	element.addEventListener("click", updateCustomRules);

	element = document.getElementById("birthInput");
	element.value = "3";
	element = document.getElementById("surviveInput");
	element.value = "2,3";

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
		updateSettingsPanel();
	} else {
		clearInterval(interval);
		document.getElementById("stopStart").innerText = "Start";
		status = "stopped";
		updateSettingsPanel();
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

/**
 * The gameReset function resets the grid to the startingArray states using the newGameFromJSON function. The
 * timeoutInput is also updated with notifications being displayed if the input is less than 0.1, then false is returned
 * indicating that the function did not successfully reset the game.
 * @returns {boolean} - false is returned if the timeInput value is less than 0.1
 */
function gameReset() {
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

/**
 * The endGame function handles the end of the game when no changes have been made to any cells after an iteration.
 * clearInterval is used to stop the game and the settings panel information is updated. A notification is also shown
 * using the notify function to show the user that the game has ended.
 */
function endGame() {
	clearInterval(interval);
	document.getElementById("stopStart").innerText = "Start";
	status = "stopped";
	notify("Game has ended","success",10000);
	updateSettingsPanel();
}

/**
 * The disableOrbit function disables the orbit controls and adds the arrowKeyCameraControls function as an event
 * listener on keydown so the user has some form of camera control.
 */
function disableOrbit() {
	controls.enabled = false;
	orbitToggle = false;
	document.addEventListener("keydown", arrowKeyCameraControls);
}

/**
 * The enableOrbit function enables the orbit controls and removes the arrowKeyCameraControls event listener from
 * keydown so there are no conflicts with the orbit controls. The target of the controls is also reset to the centre of
 * the game grid.
 */
function enableOrbit() {
	document.removeEventListener("keydown", arrowKeyCameraControls);
	controls.enabled = true;
	controls.target = (new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2));
	orbitToggle = true;
	render();
}

/**
 * The showHideDeadCells function assigns the hideDead variable with the value of the hideDeadBox checkbox on the
 * settings panel. The updateColours function is then called so the dead cells are hidden immediately.
 */
function showHideDeadCells() {
	hideDead = document.getElementById("hideDeadBox").checked;
	updateColours();
}

/**
 * The toggleOrbitControls function checks if the orbit controls checkbox on the settings panel is checked, if so then
 * the enableOrbit function is called, if not then the disableOrbit function is called.
 */
function toggleOrbitControls() {
	if (orbitCheckbox.checked) {
		enableOrbit();
	} else {
		disableOrbit();
	}
}

/**
 * The arrowKeyCameraControls function handles movement of the camera according to arrow key inputs. This function is
 * attached as an event listener to keydown when orbit controls are disabled. The world direction from the camera is
 * retrieved so the arrow keys work even if the camera was rotated around the object. The camera position is moved by 1
 * in the dimension specified in relation to the camera direction. Only up, down, left and right are currently supported
 * so the z position of the camera cannot be changed with arrow key controls.
 */
function arrowKeyCameraControls(event) {
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

/**
 * The updateColours function updates all of the cell colours for the game. The state is retrieved from the gameArray
 * and the visibility of the mesh is changed if the hideDead option is true, with the dead cells visibility being
 * assigned false. If hideDead is false then the opacity is set to 0.1 (10%) for dead cells and 1 (100%) for live cells.
 * The colour of the cells is updated according to their states, they are white if dead and orange if alive.
 */
function updateColours() {
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

/**
 * The updateSettingsPanel function updates the information on the settings panel to the current values of the game. The
 * status innerText is updated (either "stopped" or "playing"), as well as the number of iterations.
 */
function updateSettingsPanel() {
	document.getElementById("status").innerText = "Status: " + status;
	document.getElementById("iterations").innerText = "Iterations: " + iterations;
}

/**
 * The updateSettingsDimensions function updates the dimensions values on the settings panel to the current values used
 * in code. This is used after any new game is created so the user knows how big the game grid is.
 */
function updateSettingsDimensions() {
	document.getElementById("xSizeInput").value = xSize.toString();
	document.getElementById("ySizeInput").value = ySize.toString();
	document.getElementById("zSizeInput").value = zSize.toString();
}

/**
 * The render function handles the rendering of the three.js scene, if orbit controls are enabled then
 * requestAnimationFrame is also called so the canvas updates.
 */
function render() {
	if (orbitToggle) {
		requestAnimationFrame(render);
	}
	renderer.render(scene, camera);
}

/**
 * The newGameBoard function is called when the user clicks the update button on the side bar. First the inputs are
 * validated and if all values are valid then the game is stopped (if it was running) and the scene is disposed using
 * the doDispose function and the new values are used to create a new scene. The setupScene and newRandomBoard functions
 * are used to create this new scene and a new random game board. If the JSON textarea is opened then the new random
 * game array is shown in there. The camera.lookAt function is used to reset the camera to target the centre of the new
 * game grid. Finally, if orbit controls are enabled then they are disabled for 10ms and enabled again, this is because
 * with them enabled there is significant lag after the new game board has been generated, re-enabling them seems to fix
 * this.
 */
function newGameBoard(event) {
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

	gameBoard = undefined;
	gameArray = undefined;
	iterations = 0;

	scene = new Scene();

	setupScene();

	newRandomBoard();

	updateSettingsPanel();
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
	updateColours();
}

/**
 * The doDispose function is a thorough deep dispose of the scene and it's children. This is called when a new game
 * board is made to avoid memory leaks.
 *
 * The code is by stevensanborn on github: https://github.com/mrdoob/three.js/issues/5175
 */
function doDispose(obj) {
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

/**
 * The presetSelect function is called when the preset drop-down selector value is changed. A switch case statement is
 * used to handle the preset options, with the preset gameGrids being used for the new game array. This code could be
 * improved by not storing entire gameArrays for each preset like for the glider I have that produced programmatically.
 */
function presetSelect() {
	let preset = document.getElementById("presets").value;
	let updateBtn = document.getElementById("submit");
	let ruleset = document.getElementById("presetRules");

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
			ruleset.value = "B45/S5";
			rules.birth = [4,5];
			rules.survive = [5];
			rules.max = [5];
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

			ruleset.value = "B45/S5";

			rules.birth = [4,5];
			rules.survive = [5];
			rules.max = 5;

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

			ruleset.value = "B6/S567";

			rules.birth = [6];
			rules.survive = [5,6,7];
			rules.max = 7;

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

/**
 * The showHideJSON function handles the visibility of the JSON textarea input by changing the height and visibility
 * style values. When the JSON input is shown, the current JSON.stringify version of the gameArray is shown in the
 * textarea.
 */
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

/**
 * The loadJSON function is used to read the input from the jsonTextInput textarea and parse it to a usable gameArray.
 * JSON.parse is used and then the lengths of the array values are checked to be consistent, if they are not then a
 * notification is displayed using the notify function and false is returned. If the format is incorrect then JSON.parse
 * often throws an error so I have a try catch block around this code, with a notify function call in the catch to tell
 * the user their JSON input is incorrect.
 * @returns {boolean} - false is returned if the input JSON is not valid
 */
function loadJSON() {
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
				for (let k = 0; k < parsedInput[0][0].length; k++) {
					if (!(parsedInput[i][j][k] === 1 || parsedInput[i][j][k] === 0)) {
						incorrectFormat = true;
					}
				}
			}
		}

		if (incorrectFormat) {
			notify("ERROR: incorrect JSON Array format","error",3000);
			return false;
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
		notify("ERROR: incorrect JSON Array format", "error", 3000);
	}
}

/**
 * The newGameFromJSON function takes a json parsed array and the timeInput and creates a new game from the jsonArray.
 * This code is similar to the newRandomGame function, however the xSize, ySize and zSize are determined from the length
 * of each dimension in the jsonArray.
 * @param {number[][][]} jsonArray - The new gameArray taken from the JSON input textarea
 * @param {number} timeInput - The updated timeInput value from the settings panel
 */
function newGameFromJSON(jsonArray,timeInput) {
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

	updateSettingsPanel();

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

/**
 * The onMessage function is called when a message is received from the game.worker.js web worker. The number of
 * iterations is incremented, if the changed value returned in message.data[1] is false then the endGame function is
 * called. If changed is true then gameArray is assigned the value of message.data[0] and the updateSettingsPanel and
 * updateColours functions are called. If orbit controls are disabled then requestAnimationFrame is called to ensure the
 * canvas updates.
 * @param message - the message received from the game.worker.js web worker. message.data[0] contains the new gameArray
 * and message.data[1] is the changed boolean, being false if no changes occurred (meaning the end of the game).
 */
function onMessage(message) {
	iterations += 1;
	if (!message.data[1]) endGame();

	gameArray = message.data[0];
	updateSettingsPanel();
	updateColours();

	if (!(orbitToggle)) requestAnimationFrame(render);
}

/**
 * The onload function is all of the code that is executed on window load. This includes camera positioning, web worker
 * creation and calling attachClickEvents. These can be optimised in the future as the camera code may not require the
 * window to be loaded. If there is an existing onload function then that code is executed first and the rest of this
 * function is executed afterwards.
 */
function onload() {
	// If a function is already assigned to window.onload then execute that first, then run code below
	// This ensures no conflicts with settingsPanel onload function
	if(typeof(existingOnload) == "function"){ existingOnload(); }
	updateSettingsDimensions();
	worker = new Worker();

	worker.onmessage = onMessage;

	camera.position.z = Math.max(xSize,ySize,zSize) * 2;

	camera.position.x = xSize * 2;
	camera.position.y = ySize * 2;

	controls = new OrbitControls(camera, canvas);

	controls.target = new Vector3((xSize - 1) / 2, (ySize - 1) / 2, (zSize - 1) / 2);

	camera.updateProjectionMatrix();
	orbitCheckbox = document.getElementById("orbitControls");
	orbitCheckbox.checked = true;
	let hideDeadCheckbox = document.getElementById("hideDeadBox");
	hideDeadCheckbox.checked = true;
	updateColours();
	attachClickEvents();

	document.getElementById("stopStart").innerText = "Start";
	status = "stopped";
	updateSettingsPanel();
}

let existingOnload = window.onload;
window.onload = onload;
camera.add(light);
setupScene();
newRandomBoard();

render();