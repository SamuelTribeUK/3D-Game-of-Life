// This code is for the opening and closing of the settings panel on the left side of the webpage
function openNav() {
	document.getElementById("mySidepanel").style.width = "250px";
	document.getElementById("mySidepanel").style.paddingLeft = "20px";

}

function closeNav() {
	document.getElementById("mySidepanel").style.width = "0";
	document.getElementById("mySidepanel").style.paddingLeft = "0";
}

window.onload = function(){
	console.log("loaded");
	document.getElementById("closebtn").onclick = closeNav;
	document.getElementById("openbtn").onclick = openNav;
}