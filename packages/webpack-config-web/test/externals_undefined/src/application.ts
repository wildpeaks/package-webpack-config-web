/* eslint-env browser */
let value1 = "INIT1";
try {
	value1 = require("fake1");
} catch(e) {
	value1 = "ERROR1";
}

let value2 = "INIT2";
try {
	value2 = require("fake2");
} catch(e) {
	value2 = "ERROR2";
}

const container = document.createElement("div");
container.setAttribute("id", "mocha");
container.innerText = `EXTERNALS UNDEFINED ${value1} ${value2}`;
document.body.appendChild(container);

export {};
