const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
	entry: {
		app: ['./src/index.js','./src/settingsPanel.js', './src/notification.js'],
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
			{
				test: /\.(ttf)$/,
				use: {
					loader: 'file-loader',
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: '3D Game of Life - Samuel Tribe',
			version: '1.3 hide-dead',
			template: path.resolve(__dirname, './src/template.html'),
			filename: 'index.html',
			favicon: 'src/assets/images/favicon.ico'
		}),
		new CleanWebpackPlugin(),
	],
};
