
import { TimeoutPromise } from './timeoutpromise.js';

export { TimeoutPromise } from './timeoutpromise.js';

const debug = ()=>{};
//const debug = console.debug.bind(console, "[debug]");

class LockError extends Error {
	constructor(timeout) {
		super("Promise Lock: Could not get lock (Timeout)");
		this.code = "ETIMEOUT_LOCK";
		this.timeout = timeout;
	}
};
class ReleaseError extends Error {
	constructor(timeout) {
		super("Promise Lock: Timeout released lock");
		this.code = "ETIMEOUT_RELEASE";
		this.timeout = timeout;
	}
};
class UnlockError extends Error {
	constructor() {
		super("Promise Lock: Already unlocked by Timeout");
		this.code = "ETIMEOUT_UNLOCK";
	}
};
class InvalidOptionsError extends Error {
	constructor() {
		super("Promise Lock: Argument options invalid");
		this.code = "EINVALID_OPTIONS";
	}
};

/**
 * Promise Lock Initialisation
 *
 * @param {object} global_options - Configuration
 * @returns {function} - prolock function
 * @example
 * var prolock = new PromiseLock();
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
			throw new InvalidOptionsError;
		}
		return {...global_options, ...options};
	}

	async function do_action(callback, options) {
		try {
			// do not do (we want to fail, if it is not a promise)
			//return await Promise.resolve(callback());
			var p = callback();
			p = new TimeoutPromise(p, options.release_lock,
					ReleaseError);
			return await p;
		} catch(err) {
			throw err;
		}
	}

	async function get_lock_timeout(lock, options) {
		lock = new TimeoutPromise(lock, options.timeout_lock,
					LockError);
		try {
			await lock;
		} catch (err) {
			//unless NO FAIL ON TIMEOUT
			if (err.code === "ETIMEOUT_LOCK" &&
					!options.no_fail_on_timeout) {
				debug("lock: timed out");
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
					ReleaseError);
			var timed_out = false;
			p.catch(()=>{ timed_out = true; });
			debug("unlock: init");
			return function unlock() {
				debug("unlock: unlock");
				resolve_cb();
				if (timed_out) {
					throw new UnlockError;
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
	 * var result = await prolock(async ()=>{
	 *     // ...;
	 *     return "result";
	 * });
	 */
	return function prolock(callback, options) {
		if (typeof callback !== "function") {
			return usage_direct_lock(callback);
		}
		options = parse_options(options);

		return wait_and_run(callback, current, options);
	};
};

