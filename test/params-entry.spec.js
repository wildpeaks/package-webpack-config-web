/* eslint-env node, jasmine */
'use strict';
const {join} = require('path');
const getConfig = require('..');


/**
 * @param {String} title
 * @param {Object} entry
 * @param {Boolean} expectThrows
 */
function testFixture(title, entry, expectThrows){
	it(title, () => {
		let actualThrows = false;
		try {
			getConfig({
				entry,
				rootFolder: __dirname,
				outputFolder: join(__dirname, 'dummy')
			});
		} catch(e){
			actualThrows = true;
		}
		expect(actualThrows).toBe(expectThrows);
	});
}

testFixture('Valid: {}', {}, false);
testFixture('Valid: {dummy: "./src/dummy.ts"}', {dummy: './src/dummy.ts'}, false);
testFixture('Invalid: NaN', NaN, true);
testFixture('Invalid: 123', 123, true);
testFixture('Invalid: ""', '', true);
testFixture('Invalid: []', [], true);
testFixture('Invalid: "hello"', 'hello', true);
testFixture('Invalid: null', null, true);
testFixture('Invalid: false', false, true);
testFixture('Invalid: true', true, true);
testFixture('Invalid: RegExp', /hello/, true);
testFixture('Invalid: Promise', Promise.resolve(), true);
testFixture('Invalid: Symbol', Symbol('hello'), true);