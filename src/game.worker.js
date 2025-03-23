import workerOnMessage from './workerOnMessage.js';

self.onmessage = function (message) {
	let result = workerOnMessage(message);
	postMessage(result);
}

export default workerOnMessage;