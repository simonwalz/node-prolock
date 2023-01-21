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

	async function do_action(callback, options) {
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

	async function get_lock(lock, options) {
		lock = new TimeoutPromise(lock, options.timeout_lock, "_LOCK");
		try {
			await lock;
		} catch (err) {
			//unless NO FAIL ON TIMEOUT
			if (err.code === "ETIMEOUT_LOCK" &&
					!options.no_fail_on_timeout) {
				return false;
				err.message = "PromiseLock: " +
						"Could not lock (Timeout)";
				throw err;
			}
		}
		return true;
	};

	async function call(callback, lock, options) {
		r = async ()=>{
			await lock_timeout(lock, options);
			return await do_action(callback, options);
		};
		current = async ()=>{
			try {
				await lock;
			} catch (err) {}
			try {
				await r;
			} catch (err) {
			}
		};
		return r;
	}

	function usage_direct_lock(options) {
		options = parse_options(options);

		callback = async ()=>{
			var resolve_cb = null;
			return new Promise((resolve)=>{
				resolve_cb = resolve;
			});
			var unlock() {
				resolve_cb();
			}
			return unlock;
		};

		return call(callback, current, options);


		var _current = current;
		var timeout = false;

		// execution / unlock Promise:
		var resolve_cb = null;
		current = new Promise((resolve)=>{
			resolve_cb = resolve;
		});
		// return lock promise. This is based on current
		// with and resolves in a unlock function for the
		// execution
		var unlock() {
			if (timeout) {
				throw new Error("Promise Lock:"+
						" Already released by Timeout");
			}
			resolve_cb();
		};
		current = new TimeoutPromise(current, options.timeout_lock,
				"_LOCK");
		return current.then(async ()=>unlock, async ()=>unlock);

		return TimeoutPromise((resolve)=>{
			_current.finally(()=>{
				resolve(function unlock() {
					if (timeout) {
						throw new Error("Promise Lock:"+
						" Already released by Timeout");
					}
					resolve_cb();
				});
			});
		}, options.timeout_lock, "_LOCK", ()=>{
			resolve_cb();
			timeout = true;
		});
		return async()=>{
			try {
				await last;
			} catch (err) {
				//unless NO FAIL ON TIMEOUT
				if (err.code === "ETIMEOUT_LOCK" &&
						!options.no_fail_on_timeout) {
					err.message = "PromiseLock: " +
							"Could not lock (Timeout)";
					throw err;
				}
			}


		};
	}

	return function(callback, options) {
		if (typeof callback !== "function") {
			return usage_direct_lock(callback);
		}
		options = parse_options(options);

/*
		// only if timeout_lock
		current = new TimeoutPromise(current, options.timeout_lock,
				"_LOCK");

		current = call(callback, current, options);

		return current;
*/
		return call(callback, current, options);
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
