//const debug = console.debug.bind(console, "[debug]");

export function PromiseLock(global_options) {
	//var requests = [];
	var current = Promise.resolve();
	if (typeof global_options !== "object" || global_options === null) {
		global_options = {};
	}

	function parse_options(options) {
		if (typeof options === "number") {
			options = { "timeout": options };
		} else if (options === undefined || options === null) {
			options = {};
		} else if (typeof options !== "object" ||
				options === null) {
			throw new Error("argument options invalid");
		}
		return {...global_options, ...options};
	}

	async function call(callback, last, options) {
		try {
			await last;
		} catch (err) {
			if (err.code === "ETIMEOUT_LOCK") {
				err.message = "PromiseLock: " +
						"Could not lock (Timeout)";
				//unless DONT FAIL ON TIMEOUT
				throw err;
			}
		}
		try {
			// do not do (we want to fail, if it is not a promise)
			//return await Promise.resolve(callback());
			var p = callback();
			p = new TimeoutPromise(p, options.release_lock, "_RELEASE");
			return await p;
		} catch(err) {
			throw err;
		}
	}

	return function(callback, options) {
		if (typeof callback !== "function") {
			options = parse_options(callback);
			var _current = current;

			// execution / unlock Promise:
			var resolve_cb = null;
			current = new Promise((resolve)=>{
				resolve_cb = resolve;
			});
			// return lock promise. This is based on current
			// with and resolves in a unlock function for the
			// execution
			return TimeoutPromise((resolve)=>{
				_current.finally(()=>{
					resolve(function unlock() {
						resolve_cb();
					});
				});
			}, options.timeout_lock, "_LOCK", resolve_cb);
		}
		options = parse_options(options);

		// only if timeout_lock
		current = new TimeoutPromise(current, options.timeout_lock,
				"_LOCK");

		current = call(callback, current, options),

		// only if total_timeout
		current = new TimeoutPromise(current, options.total_timeout,
				"_TOTAL");
		return current;
	};
};

export function TimeoutPromise(promise, timeout, code, cancel) {
	if (typeof promise === "function") {
		promise = new Promise(promise);
	} else {
		// make sure the promise is valid:
		promise = Promise.resolve(promise);
	}
	if (typeof timeout !== "number") {
		return promise;
	}
	if (typeof code !== "string") {
		code = "";
	}

	return new Promise((resolve, reject)=>{
		let t = setTimeout(()=>{
			t = null;
			const e = new Error('Promise Timeout' +
					code.replace(/_/, " "));
			e.code = 'ETIMEOUT'+code;
			e.timeout = timeout;
			if (typeof cancel === "function")
				cancel();
			reject(e);
		}, timeout);
		promise.then((value)=>{
			if (t) {
				clearTimeout(t);
				resolve(value);
			}
		}, (err)=>{
			if (t) {
				clearTimeout(t);
				reject(err);
			}
		});
	});
}
