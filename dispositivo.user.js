// ==UserScript==
// @name         Dispositivo
// @namespace    http://nadameu.com.br/
// @version      1.0.0
// @description  Traz o foco da página para o dispositivo da sentença
// @author       nadameu
// @include      /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao=acessar_documento&/
// @run-at       document-idle
// ==/UserScript==

const easeOutCubic = t => --t * t * t + 1;
const lerp = (min, max) => {
	const range = max - min;
	return t => min + t * range;
};

const animateScroll = (target, duration) =>
	new Promise(done => {
		const rate = 1 / duration;
		const pctToPos = lerp(window.scrollY, target);
		let pct = 0,
			deduction;
		const animate = time => {
			pct = time * rate - deduction;
			if (pct < 1) {
				window.scrollTo(0, pctToPos(easeOutCubic(pct)));
				requestAnimationFrame(animate);
			} else {
				window.scrollTo(0, target);
				done();
			}
		};
		requestAnimationFrame(time => {
			deduction = time * rate;
			animate(time);
		});
	});

const getOffsetTop = el =>
	el === null ? 0 : el.offsetTop + getOffsetTop(el.offsetParent);

Promise.resolve(document.querySelector('.titulo'))
	.then(el => el || Promise.reject('Título não encontrado!'))
	.then(el => el.textContent === 'SENTENÇA' || Promise.reject('Não é sentença'))
	.then(() => document.querySelector('.dispositivo'))
	.then(el => el || Promise.reject('Dispositivo não encontrado!'))
	.then(getOffsetTop)
	.then(offset =>
		animateScroll(
			Math.min(offset, document.body.clientHeight - window.innerHeight),
			600
		)
	)
	.then(() => console.log('done'))
	.catch(e => console.error(e));
