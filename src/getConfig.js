/* eslint-env node */
'use strict';
const {strictEqual} = require('assert');
const {basename, join, isAbsolute} = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const cssnext = require('postcss-cssnext');


/**
 * @param {String[]} extensions
 */
function getRegex(extensions){
	return new RegExp('\\.(' + extensions.join('|') + ')$'); // eslint-disable-line prefer-template
}


/**
 * @typedef GetConfigOptions
 * @property {Object} entry Webpack entries
 * @property {String} rootFolder Absolute path to the rroot context folder
 * @property {String} outputFolder Absolute path to the folder where files are emitted
 * @property {String} publicPath Path prepended to url references, e.g. `/` or `/mysite/`
 * @property {String} mode Use `production` to optimize the output, `development` for faster builds
 * @property {Number} port Port for Webpack Dev Server
 * @property {Object} cssVariables CSS Variables, e.g. `{themeBackground: 'rebeccapurple'}`
 * @property {String[]} browsers Target browsers for CSS Autoprefixer
 * @property {String[]} embedLimit Filesize limit to embed assets
 * @property {String[]} embedExtensions File extensions of files to embed as base64 (if small enough) or just copy as-is (if large)
 * @property {String[]} copyExtensions File extensions of files to just copy as-is
 * @property {String} assetsRelativePath File extensions of files to just copy as-is
 * @property {Boolean} sourcemaps `true` to generate sourcemaps for scripts & stylesheets, `false` to skip them
 * @property {Boolean} skipPostprocess `true` for the lightweight config (for tests), `false` for the whole config
 * @property {String[]} polyfills List of modules or files to automatically prepend to every entry
 * @property {String[]} webworkerPolyfills List of modules or files to automatically prepend to every webworker
 * @property {RegExp} webworkerPattern RegExp test for the Web Worker loader
 */

/**
 * Generates a Webpack 4 config for Web apps.
 * @param {GetConfigOptions} options
 * @returns {Object}
 */
module.exports = function getConfig({
	entry = {application: './src/index.ts'},
	rootFolder = '',
	outputFolder = '',
	publicPath = '/',
	mode = 'production',
	port = 8000,
	cssVariables = {},
	browsers = ['>0.25%', 'ie >= 11'],
	embedLimit = 5000,
	embedExtensions = ['jpg', 'png', 'gif', 'svg'],
	copyExtensions = ['woff'],
	assetsRelativePath = 'assets/',
	sourcemaps = true,
	skipPostprocess = false,
	polyfills = ['core-js/fn/promise'],
	webworkerPolyfills = ['core-js/fn/promise'],
	webworkerPattern = /\.webworker\.ts$/
} = {}){
	strictEqual(typeof rootFolder, 'string', '"rootFolder" should be a String');
	let actualRootFolder = rootFolder;
	if (actualRootFolder === ''){
		actualRootFolder = process.cwd();
	} else if (!isAbsolute(actualRootFolder)){
		throw new Error('"rootFolder" should be an absolute path');
	}

	strictEqual(typeof outputFolder, 'string', '"outputFolder" should be a String');
	let actualOutputFolder = outputFolder;
	if (!skipPostprocess){
		if (actualOutputFolder === ''){
			actualOutputFolder = join(actualRootFolder, 'dist');
		} else if (!isAbsolute(actualOutputFolder)){
			throw new Error('"outputFolder" should be an absolute path');
		}
	}

	strictEqual(typeof mode, 'string', '"mode" should be a String');
	if (mode === ''){
		throw new Error('"mode" should not be empty');
	}

	strictEqual(entry === null, false, '"entry" should not be null');
	strictEqual(Array.isArray(entry), false, '"entry" should not be an Array');
	strictEqual(entry instanceof Promise, false, '"entry" should not be a Promise');
	strictEqual(entry instanceof RegExp, false, '"entry" should not be a RegExp');
	strictEqual(entry instanceof Symbol, false, '"entry" should not be a Symbol');
	strictEqual(typeof entry, 'object', '"entry" should be an Object');

	strictEqual(typeof port, 'number', '"port" should be a Number');
	strictEqual(isNaN(port), false, '"port" must not be NaN');
	strictEqual(port > 0, true, '"port" should be a positive number');

	strictEqual(cssVariables === null, false, '"cssVariables" should not be null');
	strictEqual(Array.isArray(cssVariables), false, '"cssVariables" should not be an Array');
	strictEqual(cssVariables instanceof Promise, false, '"cssVariables" should not be a Promise');
	strictEqual(cssVariables instanceof RegExp, false, '"cssVariables" should not be a RegExp');
	strictEqual(cssVariables instanceof Symbol, false, '"cssVariables" should not be a Symbol');
	strictEqual(typeof cssVariables, 'object', '"cssVariables" should be an Object');

	strictEqual(Array.isArray(browsers), true, '"browsers" should be an Array');
	strictEqual(browsers.length > 0, true, '"browsers" should not be empty');

	strictEqual(typeof embedLimit, 'number', '"embedLimit" should be a Number');
	strictEqual(isNaN(embedLimit), false, '"embedLimit" must not be NaN');

	strictEqual(Array.isArray(embedExtensions), true, '"embedExtensions" should be an Array');
	strictEqual(Array.isArray(copyExtensions), true, '"copyExtensions" should be an Array');

	strictEqual(typeof publicPath, 'string', '"publicPath" should be a String');
	strictEqual(typeof sourcemaps, 'boolean', '"sourcemaps" should be a Boolean');
	strictEqual(typeof skipPostprocess, 'boolean', '"skipPostprocess" should be a Boolean');
	strictEqual(Array.isArray(polyfills), true, '"polyfills" should be an Array');
	strictEqual(Array.isArray(webworkerPolyfills), true, '"webworkerPolyfills" should be an Array');

	strictEqual(typeof assetsRelativePath, 'string', '"assetsRelativePath" should be a String');
	if ((assetsRelativePath !== '') && !assetsRelativePath.endsWith('/')){
		throw new Error('"assetsRelativePath" must end with "/" when not empty');
	}

	if (!(webworkerPattern instanceof RegExp)){
		throw new Error('"webworkerPattern" should be a RegExp');
	}

	//region Polyfills
	const entries = {};
	for (const key in entry){
		const filepath = entry[key];
		entries[key] = polyfills.concat(Array.isArray(filepath) ? filepath : [filepath]);
	}
	//endregion

	const minify = (mode === 'production');
	const loaders = [];
	const plugins = [];
	//region Base Config
	const config = {
		//region Input
		target: 'web',
		devtool: sourcemaps ? 'source-map' : false,
		mode,
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx']
		},
		context: actualRootFolder,
		entry: entries,
		//endregion
		//region Output
		output: {
			path: actualOutputFolder,
			publicPath,
			filename: minify ? '[hash].[name].js' : '[name].js',
			chunkFilename: minify ? '[hash].chunk.[id].js' : 'chunk.[id].js'
		}
		//endregion
	};
	//endregion

	//region Minification
	if (!skipPostprocess){
		config.optimization = {
			minimize: minify,
			nodeEnv: mode,
			concatenateModules: true
		};
	}
	//endregion

	//region Reset the output
	if (!skipPostprocess){
		plugins.push(
			new CleanWebpackPlugin([
				basename(actualOutputFolder)
			], {
				root: join(actualOutputFolder, '..'),
				verbose: false
			})
		);
	}
	//endregion

	//region HTML
	if (!skipPostprocess){
		const ids = Object.keys(entry);
		if (ids.length === 1){
			plugins.push(
				new HtmlWebpackPlugin({
					hash: !minify,
					filename: 'index.html'
				})
			);
		} else {
			ids.forEach(entryId => {
				plugins.push(
					new HtmlWebpackPlugin({
						hash: !minify,
						chunks: [entryId],
						filename: `${entryId}.html`
					})
				);
			});
		}
		//endregion
	}
	//endregion

	//region Subressource Integrity
	if (!skipPostprocess){
		config.output.crossOriginLoading = 'anonymous';
		plugins.push(
			new SriPlugin({
				hashFuncNames: ['sha256', 'sha384'],
				enabled: minify
			})
		);
	}
	//endregion

	//region Typescript
	if (sourcemaps){
		loaders.push({
			enforce: 'pre',
			test: /\.(ts|tsx|js|jsx)?$/,
			use: 'source-map-loader'
		});
	}
	loaders.push({
		enforce: 'pre',
		test: webworkerPattern,
		use: [
			{
				loader: join(__dirname, 'polyfills.loader.js'),
				options: {
					polyfills: webworkerPolyfills
				}
			}
		]
	});
	loaders.push({
		test: webworkerPattern,
		use: [
			// {
			// 	// enforce: 'pre',
			// 	loader: join(__dirname, 'polyfills.loader.js'),
			// 	options: {
			// 		polyfills: webworkerPolyfills
			// 	}
			// },
			{
				loader: 'ts-loader',
				options: {
					transpileOnly: true
				}
			},
			{
				loader: 'worker-loader',
				options: {
					inline: false,
					name: minify ? '[hash].[name].js' : '[name].js'
				}
			}
		]
	});
	loaders.push({
		test: /\.(ts|tsx|js|jsx)$/,
		use: [
			{
				loader: 'ts-loader',
				options: {
					transpileOnly: true
				}
			}
		]
	});
	//endregion

	//region CSS
	loaders.push({
		test: /\.css$/,
		use: [
			MiniCssExtractPlugin.loader,
			{
				loader: 'css-loader',
				options: {
					minimize: minify,
					modules: true
				}
			},
			{
				loader: 'postcss-loader',
				options: {
					plugins: [
						cssnext({
							browsers,
							features: {
								customProperties: {
									variables: cssVariables
								}
							}
						})
					]
				}
			}
		]
	});
	plugins.push(
		new MiniCssExtractPlugin({
			filename: minify ? '[hash].[name].css' : '[name].css',
			chunkFilename: '[id].css'
		})
	);
	//endregion

	//region Images
	if (embedExtensions.length > 0){
		loaders.push({
			test: getRegex(embedExtensions),
			use: {
				loader: 'url-loader',
				options: {
					limit: embedLimit,
					name: minify ? `${assetsRelativePath}[hash].[name].[ext]` : `${assetsRelativePath}[name].[ext]`
				}
			}
		});
	}
	//endregion

	//region Raw assets
	if (copyExtensions.length > 0){
		loaders.push({
			test: getRegex(copyExtensions),
			use: {
				loader: 'file-loader',
				options: {
					name: minify ? `${assetsRelativePath}[hash].[name].[ext]` : `${assetsRelativePath}[name].[ext]`
				}
			}
		});
	}
	//endregion

	//region Dev Server
	if (!skipPostprocess){
		config.devServer = {
			port,
			compress: true,
			contentBase: actualOutputFolder,
			publicPath,
			historyApiFallback: false,
			clientLogLevel: 'none',
			stats: 'errors-only'
		};
	}
	//endregion

	config.plugins = plugins;
	config.module = {
		rules: loaders
	};
	return config;
};
