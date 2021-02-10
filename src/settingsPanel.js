// This code is for the opening and closing of the settings panel on the left side of the webpage

function openNav() {
	document.getElementById("settingsPanel").style.width = "200px";
	document.getElementById("settingsPanel").style.paddingLeft = "15px";
	document.getElementById("settingsPanel").style.paddingRight = "15px";

}

function closeNav() {
	document.getElementById("settingsPanel").style.width = "0";
	document.getElementById("settingsPanel").style.paddingLeft = "0";
	document.getElementById("settingsPanel").style.paddingRight = "0";
}

window.onload = function(){
	document.getElementById("closebtn").onclick = closeNav;
	document.getElementById("openbtn").onclick = openNav;
	// Settings are shown on window load automatically
	openNav();
}