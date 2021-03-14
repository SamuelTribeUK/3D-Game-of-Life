// This code is for the opening and closing of the settings panel on the left side of the webpage
/**
 * The openSettings function handles the width and padding changes to open the settings panel. The settings panel width
 * is set to 200px, and the left and right padding is set to 15px.
 * */
function openSettings() {
	document.getElementById("settingsPanel").style.width = "200px";
	document.getElementById("settingsPanel").style.paddingLeft = "15px";
	document.getElementById("settingsPanel").style.paddingRight = "15px";

}

/**
 * The closeSettings function handles the width and padding changes to close the settings panel, all values are set to 0.
 */
function closeSettings() {
	document.getElementById("settingsPanel").style.width = "0";
	document.getElementById("settingsPanel").style.paddingLeft = "0";
	document.getElementById("settingsPanel").style.paddingRight = "0";
}

/**
 * The settingsOnload function attaches the closeSettings and openSettings functions as onclick events for their
 * respective elements. Additionally, the JSON text input textarea is hidden with a height of 0 by default.
 */
function settingsOnload() {
	document.getElementById("closebtn").onclick = closeSettings;
	document.getElementById("openbtn").onclick = openSettings;
	document.getElementById("jsonTextInput").style.height = "0px";
	document.getElementById("jsonTextInput").style.visibility = "hidden";
	// Settings are shown on window load automatically
	openSettings();
}

window.onload = settingsOnload;