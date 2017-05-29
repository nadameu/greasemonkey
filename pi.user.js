// ==UserScript==
// @name        Pi
// @namespace   http://nadameu.com.br/pi
// @description Altera a imagem de fundo do e-Proc V2
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\//
// @version     4
// @grant       none
// ==/UserScript==

const TEXTO = 'π';
const SIDE = 48;
const FONT_SIZE = getFontSize(SIDE);
const FOREGROUND_RATIO = 0.95;

const ROTATION = Math.PI / 4;
const TEXT_PARAMETERS = [
	[1, 0, -1],
	[0, 1, 1],
	[2, 1, 1],
	[1, 2, -1]
].map(([x, y, r]) => createTextParameters(SIDE * x / 2, SIDE * y / 2, ROTATION * r));

Reader(app).run(IO(getEnvironment).performUnsafeIO(document));

function app({ doc, addStyles, createCanvas }) {
	const bgColor = getBodyBgColor(doc);
	const bgColorAlpha = addAlpha(bgColor, 0.5);
	const fgColor = applyRatio(bgColor, FOREGROUND_RATIO);
	const canvas = createCanvas(SIDE);
	const context = getContext(canvas);
	drawText(context, {
		size: FONT_SIZE,
		color: fgColor,
		text: TEXTO
	}, drawText => TEXT_PARAMETERS.forEach(({ x, y, rotation }) => drawText(x, y, rotation)));
	const dataURL = getURL(canvas);
	addStyles(dataURL, bgColorAlpha);
}

function IO(performUnsafeIO) {
	return { performUnsafeIO };
}
function Reader(run) {
	return { run };
}

function addAlpha(rgb, alpha) {
	return 'rgba(' + rgbToArray(rgb).concat([alpha.toString()]).join(', ') + ')';
}
function applyRatio(rgb, ratio) {
	return 'rgb(' + rgbToArray(rgb).map(color => Math.round(color * ratio)).join(', ') + ')';
}
function createTextParameters(x, y, rotation) {
	return { x, y, rotation };
}
function drawText(context, { size, color, text }, callback) {
	context.save();
	context.font = `${size}px Times New Roman`;
	context.textAlign = 'center';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.fillStyle = color;
	callback((x, y, rotation) => {
		context.save();
		context.translate(x, y);
		context.rotate(rotation);
		context.fillText(text, 0, 0);
		context.restore();
	});
	context.restore();
}
function getBodyBgColor(doc) {
	return getComputedStyle(doc.body).backgroundColor;
}
function getContext(canvas) {
	return canvas.getContext('2d');
}
function getEnvironment(doc) {
	return { doc, addStyles, createCanvas };
	function addStyles(url, color) {
		const style = createElement([
			'<style>',
			`body { background-image: url('${url}'); }`,
			'div.infraAreaTelaD, div.infraBarraComandos, div.infraAreaDados, div.infraAviso { border-color: transparent; }',
			`div.infraAreaTelaD { background-color: ${color}; }`,
			'</style>'
		].join('\n'));
		doc.querySelector('head').appendChild(style);
	}
	function createCanvas(side) {
		return createElement(`<canvas width="${side}" height="${side}"></canvas>`);
	}
	function createElement(html) {
		const div = doc.createElement('div');
		div.innerHTML = html;
		return div.firstElementChild;
	}
}
function getFontSize(side) {
	return side * 0.75;
}
function getURL(canvas) {
	return canvas.toDataURL();
}
function rgbToArray(rgb) {
	return rgb.match(/rgb\((\d+), (\d+), (\d+)\)/).slice(1);
}
