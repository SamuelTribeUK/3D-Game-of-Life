import Toastify from "toastify-js";

export function notify(text, type, duration) {
	let backgroundColor;
	if (type === "success") {
		backgroundColor = "linear-gradient(to left, #8A261C, #B2482E)";
	} else if (type === "error") {
		backgroundColor = "linear-gradient(to left, #8A261C, #B2482E)";
	}
	Toastify({
		text: text,
		duration: duration,
		close: true,
		gravity: "top", // `top` or `bottom`
		position: 'right', // `left`, `center` or `right`
		backgroundColor: backgroundColor,
		stopOnFocus: true, // Prevents dismissing of toast on hover
	}).showToast();
}