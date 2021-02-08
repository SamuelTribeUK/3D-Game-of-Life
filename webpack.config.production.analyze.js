const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const { merge } = require('webpack-merge');
const common = require('./webpack.config.production');

module.exports = merge(common, {
	plugins: [
		new BundleAnalyzerPlugin(),
	],
});