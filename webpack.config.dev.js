const path = require('path');
const webpack = require("webpack");
const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');

module.exports = merge(common, {
	mode: "development",
	devServer: {
		historyApiFallback: true,
		//path: path.resolve(__dirname, './dist'),
		open: true,
		compress: false,
		port: 8080,
	},
	devtool: 'inline-source-map',
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
	],
});