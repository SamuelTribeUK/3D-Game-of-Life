import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	BoxGeometry,
	MeshLambertMaterial,
	Mesh,
	AmbientLight,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import $ from "jquery";
// import Toastify from "toastify-js";
import './main.css';
import './settingsPanel.js';

// TODO all values below are copied from the prototype 2d game of life, adapt these to a 3d implementation

let xSize = 10;
let ySize = 10;
let zSize = 10;
let timeout = 100;
let orbitToggle = false;

let gameBoard;

let liveCellColour = "#c24d2c";
let deadCellColour = "#d9dad7";
let backgroundColour = "#1a2639";

let iterations = 0;
let status="stopped";

const canvas = document.querySelector('canvas');

let scene = new Scene();
let camera = new PerspectiveCamera(75, (window.innerWidth)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true, canvas: canvas});
let controls = new OrbitControls(camera, canvas);
controls.enabled = false;
let geometry = new BoxGeometry(0.9, 0.9, 0.9);
let light = new AmbientLight(0xFFFFFF,1);

// TODO all functions below at the moment are copied over from the 2d prototype code, adapt these for 3D

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

// Add mesh cubes for each element in the 2D array game board, with green cubes being live cells and white being dead
let addMesh = function(state, i, j, k) {
	let colour;
	if (state === 0) {
		colour = deadCellColour;
	} else {
		colour = liveCellColour;
	}
	let material = new MeshLambertMaterial({color: colour});
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

	window.addEventListener("resize", () => {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = (window.innerWidth) / (window.innerHeight);

		camera.updateProjectionMatrix();
		requestAnimationFrame(render);
	});

	// document.addEventListener("keydown", arrowKeyCameraControls);
	// document.addEventListener('mousedown', onDocumentMouseDown, false);
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
	updateSidebar();
};

render();