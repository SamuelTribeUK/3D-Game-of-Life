// This code is for the opening and closing of the settings panel on the left side of the webpage

/* SETTINGS PANEL FIELDS DO NOT FUNCTION YET */

function openNav() {
	document.getElementById("settingsPanel").style.width = "250px";
	document.getElementById("settingsPanel").style.paddingLeft = "20px";

}

function closeNav() {
	document.getElementById("settingsPanel").style.width = "0";
	document.getElementById("settingsPanel").style.paddingLeft = "0";
}

window.onload = function(){
	console.log("loaded");
	document.getElementById("closebtn").onclick = closeNav;
	document.getElementById("openbtn").onclick = openNav;
}