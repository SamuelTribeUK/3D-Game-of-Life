import Toastify from "toastify-js";

/**
 * The notify function handles toastify-js notifications with custom text, colour and duration.
 * @param {string} text - The text to be displayed in the notification
 * @param {string} type - The type of notification (either success or error). This dictates the colour of the
 * notification, with "success" having a green gradient and "error" having an orange gradient
 * @param {number} duration - The duration in milliseconds that the notification will be displayed for
 */
export function notify(text, type, duration) {
	let backgroundColor;
	if (type === "success") {
		backgroundColor = "linear-gradient(to left, #11998E, #27A656)";
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