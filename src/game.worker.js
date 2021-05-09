// workerFakeDOM.js is from StackOverflow to allow jQuery in web worker. See file for more info
import "./workerFakeDOM.js";
let $ = require('jquery/src/core');

let xSize,ySize,zSize;
let gameBoard;

onmessage = function(e) {
	//console.log('game.worker.js received message from main script');
	// 3D array passed as e.data, process each cell within this array
	gameBoard = e.data[0];
	let liveNum;
	let changed = false;
	xSize = e.data[1];
	ySize = e.data[2];
	zSize = e.data[3];
	let newGameBoard = new Array(xSize);
	let startingIndex = e.data[4];
	for (let i = 0; i < xSize; i++) {
		newGameBoard[i] = $.extend(true,[],gameBoard[i + startingIndex]);
	}
	for (let i = startingIndex; i < xSize + startingIndex; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				liveNum = liveCount(i,j,k);
				if ((liveNum === 3) && gameBoard[i][j][k] === 0) {
					newGameBoard[i - startingIndex][j][k] = 1;
					changed = true;
				} else if (!(liveNum === 2 || liveNum === 3) && gameBoard[i][j][k] === 1) {
					newGameBoard[i - startingIndex][j][k] = 0;
					changed = true;
				}
			}
		}
	}

	postMessage([newGameBoard,changed]);
}

function liveCount(x,y,z) {
	let liveNum = 0;
	for (let l = -1; l < 2; l++) {
		for (let m = -1; m < 2; m++) {
			for (let n = -1; n < 2; n++) {
				if (!((l === 0) && (m === 0) && (n === 0))) {
					liveNum += checkCell(x+l, y+m, z+n);
				}
			}
		}
	}
	return liveNum;
}

function checkCell(currX, currY, currZ) {
	try {
		if (gameBoard[currX][currY][currZ] === 1) {
			return 1;
		} else {
			return 0;
		}
	} catch (e) {
		return 0;
	}
}
