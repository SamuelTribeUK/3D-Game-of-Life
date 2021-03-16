// workerFakeDOM.js is from StackOverflow to allow jQuery in web worker. See file for more info
import "./workerFakeDOM.js";
import $ from "jquery";


let xSize,ySize,zSize;
let gameArray;

/**
 * The workerOnMessage function is executed when a message from the main script is received. It unpacks the message into
 * the gameArray (message.data[0]), xSize (message.data[1]), ySize (message.data[2]), zSize (message.data[3]) and
 * ruleset (message.data[4]). Each cell of the gameArray is iterated over, calculating the number of live (1)
 * neighbouring cell states using the liveCount function. A switch case statement is then used for the ruleset, with
 * each ruleset dictating how many live neighbours are required for birth or survival and the changes made to a new
 * deep-copy array of the gameArray (this ensures no conflicts). Once the newGameArray has been fully implemented it is
 * sent back to the main script along with the changed value (being false if no cells changed state and true otherwise)
 * using postMessage.
 * @param message - The message from the main script, containing the gameArray, dimensions of the grid and the ruleset.
 */
export function workerOnMessage(message) {
	let changed = false;
	// 3D array passed as message.data[0], process each cell within this array
	gameArray = message.data[0];
	let newGameArray = $.extend(true, [], gameArray);

	xSize = message.data[1];
	ySize = message.data[2];
	zSize = message.data[3];
	let ruleset = message.data[4];

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
	return [newGameArray,changed];
}

self.onmessage = function(message) {
	let result = workerOnMessage(message);
	postMessage(result);
}

/**
 * The liveCount function takes x, y and z coordinates and checks how many live neighbours that cell has using the
 * checkCell function. Once all of the neighbouring cells have been checked, the accumulated liveNum number value is
 * returned.
 * @param {number} x - The x coordinate of the current cell
 * @param {number} y - The y coordinate of the current cell
 * @param {number} z - The z coordinate of the current cell
 * @returns {number} - The number of live neighbouring cells to the cell at [x][y][z] in the gameArray
 */
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

/**
 * The checkCell function takes an x, y and z coordinate value and checks the game board if the cell at that location
 * is alive or dead and returns 1 if it is alive and 0 if dead. Out of bound cells are handled by returning 0
 * @param {number} x - The x coordinate of the cell being checked
 * @param {number} y - The y coordinate of the cell being checked
 * @param {number} z - The z coordinate of the cell being checked
 * @returns {number} - 1 is returned if the cell at [x][y][z] is alive (1) and 0 is returned if the cell is dead or out
 * of bounds of the game (This occurs with cells on the edge of the grid)
 */
function checkCell(x, y, z) {
	if (x < 0 || x >= xSize) {
		return 0;
	} else if (y < 0 || y >= ySize) {
		return 0;
	} else if (z < 0 || z >= zSize) {
		return 0;
	} else if (gameArray[x][y][z] === 1) {
		return 1;
	} else {
		return 0;
	}
}

export default workerOnMessage;