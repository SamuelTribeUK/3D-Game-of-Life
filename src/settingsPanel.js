// This code is for the opening and closing of the settings panel on the left side of the webpage
function openNav(e) {
	document.getElementById("mySidepanel").style.width = "250px";
	console.log(document.getElementById("mySidepanel").style.width);
}

function closeNav(e) {
	document.getElementById("mySidepanel").style.width = "0";
}

window.onload = function(){
	console.log("loaded");
	document.getElementById("closebtn").onclick = closeNav;
	document.getElementById("openbtn").onclick = openNav;
}