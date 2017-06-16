const Task = (() => {
	function Task(fork) {
		if (! (this instanceof Task)) return new Task(fork);
		this.fork = fork;
	}
	Task.prototype = {
		constructor: Task,
		ap(a) {
			return Task.all([a, this]).map(([f, x]) => f(x));
		},
		chain(f) {
			return Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res)));
		},
		map(f) {
			return Task((rej, res) => this.fork(rej, x => res(f(x))));
		}
	};
	Task.all = ts => Task((rej, res) => {
		const state = new Array(ts.length);
		const go = i => x => {
			state[i] = x;
			if (Array.from(state.keys()).every(i => i in state)) res(state);
		};
		ts.forEach((t, i) => t.fork(rej, go(i)));
	});
	Task.of = x => Task((rej, res) => res(x));
	Task.rejected = e => Task(rej => rej(e));

	return Task;
})();
