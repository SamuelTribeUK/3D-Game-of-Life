// workerFakeDOM.js is from StackOverflow to allow jQuery in web worker. See file for more info
import "./workerFakeDOM.js";
let $ = require('jquery/src/core');

let xSize,ySize,zSize;
let gameArray;

onmessage = function(e) {
	let changed = false;
	// 3D array passed as e.data[0], process each cell within this array
	gameArray = e.data[0];
	let newGameArray = $.extend(true, [], gameArray);

	xSize = e.data[1];
	ySize = e.data[2];
	zSize = e.data[3];
	let ruleset = e.data[4];

	for (let i = 0; i < xSize; i++) {
		for (let j = 0; j < ySize; j++) {
			for (let k = 0; k < zSize; k++) {
				let liveNum = liveCount(i, j, k);

				switch (ruleset) {
					case "Standard": {
						// B3/S23 (Standard 2D GoL)
						if ((liveNum === 3) && gameArray[i][j][k] === 0) {
							changed = true;
							newGameArray[i][j][k] = 1;
						} else if (!(liveNum === 2 || liveNum === 3) && gameArray[i][j][k] === 1) {
							changed = true;
							newGameArray[i][j][k] = 0;
						}
						break;
					} case "B45/S5": {
						// B45/S5
						if ((liveNum === 4 || liveNum === 5) && gameArray[i][j][k] === 0) {
							changed = true;
							newGameArray[i][j][k] = 1;
						} else if (!(liveNum === 5) && gameArray[i][j][k] === 1) {
							newGameArray[i][j][k] = 0;
						}
						break;
					} case "B36/S23": {
						// B36/S23 (2D Highlife)
						if ((liveNum === 3 || liveNum === 6) && gameArray[i][j][k] === 0) {
							changed = true;
							newGameArray[i][j][k] = 1;
						} else if (!(liveNum === 2 || liveNum === 3) && gameArray[i][j][k] === 1) {
							changed = true;
							newGameArray[i][j][k] = 0;
						}
						break;
					} case "B6/S567": {
						if (liveNum === 6 && gameArray[i][j][k] === 0) {
							changed = true;
							newGameArray[i][j][k] = 1;
						} else if (!((liveNum > 4) && (liveNum < 8)) && gameArray[i][j][k] === 1) {
							changed = true;
							newGameArray[i][j][k] = 0;
						}
					}
				}
			}
		}
	}
	postMessage([newGameArray,changed]);
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

/* checkCell takes an x, y and z value and checks the game board if the cell at that location is alive or dead and returns
 * 1 if it is alive and 0 if dead. Out of bound cells are handled by returning 0 */
function checkCell(currX, currY, currZ) {
	if (currX < 0 || currX >= xSize) {
		return 0;
	} else if (currY < 0 || currY >= ySize) {
		return 0;
	} else if (currZ < 0 || currZ >= zSize) {
		return 0;
	} else if (gameArray[currX][currY][currZ] === 1) {
		return 1;
	} else {
		return 0;
	}
}
