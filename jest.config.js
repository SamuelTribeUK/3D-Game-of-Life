/**
 * Big thanks to smpeters on GitHub (https://github.com/smpeters) for providing instructions on getting jest working
 * with the style of imports I was using, the full page can be found here: https://github.com/facebook/jest/issues/9395
 *
 * Another big thanks to Andrea Stagi for making a package that transforms web workers into the correct format so they
 * can be tested using Jest. I found this at the bottom of the article they wrote here:
 * https://vuedose.tips/how-to-test-web-workers-with-jest/
 */
module.exports = {
	verbose: true,
	transform: {
		"^.+\\.jsx?$": "babel-jest",
		"^.+\\.worker.[t|j]sx?$": "workerloader-jest-transformer"
	},

};