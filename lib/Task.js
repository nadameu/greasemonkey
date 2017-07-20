const Task = (() => {
	function Task(fork) {
		if (! (this instanceof Task)) return new Task(fork);
		this.fork = fork;
	}
	Task.prototype = {
		constructor: Task,
		ap(a) {
			return new Task((rej, res) => {
				let rejected = false;
				let resolved = {};
				const guardRej = value => {
					if (rejected) return;
					rej(value);
					rejected = true;
				};
				this.fork(guardRej, x => {
					if ('f' in resolved) res(resolved.f(x));
					resolved.x = x;
				});
				a.fork(guardRej, f => {
					if ('x' in resolved) res(f(resolved.x));
					resolved.f = f;
				});
			});
		},
		chain(f) {
			return new Task((rej, res) => this.fork(rej, x => f(x).fork(rej, res)));
		},
		map(f) {
			return new Task((rej, res) => this.fork(rej, x => res(f(x))));
		}
	};
	Task.all = iterable => Array.from(iterable).reduce(
		(acc, x) => x.ap(acc.map(list => x => (list.push(x), list))),
		Task.of([])
	);
	Task.of = x => new Task((rej, res) => res(x));
	Task.rejected = e => new Task(rej => rej(e));

	return Task;
})();
