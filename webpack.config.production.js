const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
	mode: "production",
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
	plugins: [
		new HtmlWebpackPlugin({
			title: '3D Game of Life - Samuel Tribe',
			template: path.resolve(__dirname, './src/template.html'),
			filename: 'index.html'
		}),
		new CleanWebpackPlugin(),
	],
};