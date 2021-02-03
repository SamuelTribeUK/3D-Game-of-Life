import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	BoxGeometry,
	PointLight,
	MeshLambertMaterial,
	Mesh,
	Raycaster, Vector2,
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
let warning = false;

let gameBoard;

let liveCellColour = "#c24d2c";
let deadCellColour = "#d9dad7";
let backgroundColour = "#1a2639";
let selectedColour = "#ab0000";

const canvas = document.querySelector('canvas');

let scene = new Scene();
let camera = new PerspectiveCamera(75, (window.innerWidth)/(window.innerHeight), 0.1, 1000);
let renderer = new WebGLRenderer({antialias: true, canvas: canvas});
let controls = new OrbitControls(camera, canvas);
controls.enabled = false;
let geometry = new BoxGeometry(0.9, 0.9, 0.9);
let light = new PointLight(0xFFFFFF, 1, 500);

let raycaster = new Raycaster();
let mouse = new Vector2();

/* TODO Develop the code to set up the canvas after the window has loaded, all code after this are functions used for
 *  the game of life */

let existingOnload = window.onload;
window.onload = function(){
	// If a function is already assigned to window.onload then execute that first, then run code below
	// This ensures no conflicts with settingsPanel onload function
	if(typeof(existingOnload) == "function"){ existingOnload(); }

	// attachClickEvents();
};



// TODO all functions below at the moment are copied over from the 2d prototype code, adapt these for 3D

// Initialise the 2D array game board with the specified x and y sizes and populate it with random cells
let initialiseBoard = function() {
	document.getElementById("stopStart").innerText = "Start";
	gameBoard = new Array(xSize);
	for (let i = 0; i < xSize; i++) {
		gameBoard[i] = new Array(ySize);
	}

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			let state = Math.floor(Math.random() * 2);
			addMesh(state, i, j);
		}
	}
}

// Add mesh cubes for each element in the 2D array game board, with green cubes being live cells and white being dead
let addMesh = function(state, i, j) {
	let colour;
	if (state === 0) {
		colour = deadCellColour;
	} else {
		colour = liveCellColour;
	}
	let material = new MeshLambertMaterial({color: colour});
	let mesh = new Mesh(geometry, material);
	mesh.position.set(i,j,0);
	gameBoard[i][j] = {box: mesh, state: state};
	scene.add(gameBoard[i][j].box);
}

/* The functions that handle all buttons and inputs on the side panel are attached in this function, as well as the
 * resize event function and the arrow key camera controls. The input fields are populated with the start values */
let attachClickEvents = function() {
	let element = document.querySelector("#stopStart");
	element.addEventListener("click", stopStart);

	element = document.querySelector("#submit");
	element.addEventListener("click", newGameBoard);

	orbitCheckbox.addEventListener("change", toggleOrbitControls);

	element = document.getElementById("xSizeInput");
	element.value = xSize;

	element = document.getElementById("ySizeInput");
	element.value = ySize;

	element = document.getElementById("timeoutInput");
	let rate = 1000 / timeout;
	element.value = rate.toFixed(1);

	window.addEventListener("resize", () => {
		renderer.setSize(window.innerWidth - 258, window.innerHeight);
		camera.aspect = (window.innerWidth - 258) / (window.innerHeight);

		camera.updateProjectionMatrix();
		requestAnimationFrame(render);
	});

	document.addEventListener("keydown", arrowKeyCameraControls);
	document.addEventListener('mousedown', onDocumentMouseDown, false);
}