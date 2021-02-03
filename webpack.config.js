const path = require('path');

module.exports = {
	mode: "development",
	entry: {
		app: ['./src/index.js','./src/settingsPanel.js'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
};