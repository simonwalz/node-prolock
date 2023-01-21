
const debug = ()=>{};
//const debug = console.debug.bind(console, "[debug]");

/**
 * Promise Lock Initialisation
 *
 * @param {object} global_options - Configuration
 * @returns {function} - plock function
 * @example
 * var plock = new PromiseLock();
 */
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

	async function get_lock_timeout(lock, options) {
		lock = new TimeoutPromise(lock, options.timeout_lock, "_LOCK");
		try {
			await lock;
		} catch (err) {
			//unless NO FAIL ON TIMEOUT
			if (err.code === "ETIMEOUT_LOCK" &&
					!options.no_fail_on_timeout) {
				debug("lock: timed out");
				err.message = "PromiseLock: " +
						"Could not lock (Timeout)";
				throw err;
			}
		}
		return true;
	};

	function wait_and_run(callback, lock, options, extra) {
		var r = (async ()=>{
			await get_lock_timeout(lock, options);
			debug("return: got lock");
			var a = await do_action(callback, options);
			debug("return: got result", a);
			return a;
		})();
		current = (async ()=>{
			try {
				await lock;
			} catch (err) {}
			debug("current: got lock");
			try {
				await r;
			} catch (err) {
				if (err.code === "ETIMEOUT_LOCK") {
					debug("timed out");
					return false;
				}
			}
			debug("current: got result");
			try {
				if (extra) {
					debug("current: await extra");
					await extra();
					debug("current: got extra");
				}
			} catch (err) {
				debug("current: got extra - catch");
			}
			return true;
		})();

		return r;
	}

	function usage_direct_lock(options) {
		options = parse_options(options);

		// Unlock Promise
		var resolve_cb = null;
		var p = new Promise((resolve)=>{
			resolve_cb = resolve;
		});

		// Return unlock function
		var r;
		var callback = async ()=>{
			// start execution. Start timeout for release lock:
			p = new TimeoutPromise(p, options.release_lock,
					"_RELEASE");
			var timed_out = false;
			p.catch(()=>{ timed_out = true; });
			debug("unlock: init");
			return function unlock() {
				debug("unlock: unlock");
				resolve_cb();
				if (timed_out) {
					const e = new Error("Promise Lock:"+
						" Already released by Timeout");
					e.code = "ETIMEOUT_RELEASE_ALREADY";
					throw e;
				}
			};
		};

		// get lock, return callback und wait for unlock promise:
		r = wait_and_run(callback, current, options, ()=>p);
		return r;
	}

	/**
	 * Promise Lock
	 *
	 * @param {function} [callback] - Async work function to lock
	 * @param {object} options - Configuration
	 * @returns {Promise}
	 * @example
	 * var result = await plock(async ()=>{
	 *     // ...;
	 *     return "result";
	 * });
	 */
	return function plock(callback, options) {
		if (typeof callback !== "function") {
			return usage_direct_lock(callback);
		}
		options = parse_options(options);

		return wait_and_run(callback, current, options);
	};
};

/**
 * Timeout Promise
 *
 * @param {Promise|function} promise - Promise to add Timeout or callback to create promise
 * @param {number} timeout - Timeout in ms
 * @param {string} code - Text to add to Error Message
 * @param {function} cancel - Callback to call on Timeout
 * @returns {Promise}
 * @example
 * var promise = new TimeoutPromise(new Promise.resolve(), 1000);
 */
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
