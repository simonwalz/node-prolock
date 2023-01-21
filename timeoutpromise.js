
class TimeoutPromiseError extends Error {
	constructor(timeout) {
		super("Promise Timeout");
		this.code = "ETIMEOUT";
		this.timeout = timeout;
	}
};

/**
 * Timeout Promise
 *
 * @param {Promise|function} promise - Promise to add Timeout or callback to create promise
 * @param {number} timeout - Timeout in ms
 * @param {class} error - Error object to create on Timeout
 * @param {function} cancel - Callback to call on Timeout
 * @returns {Promise}
 * @example
 * var promise = new TimeoutPromise(new Promise.resolve(), 1000);
 */
export function TimeoutPromise(promise, timeout, error, cancel) {
	if (typeof promise === "function") {
		promise = new Promise(promise);
	} else {
		// make sure the promise is valid:
		promise = Promise.resolve(promise);
	}
	if (typeof timeout !== "number") {
		return promise;
	}
	if (typeof error !== "function") {
		error = TimeoutPromiseError;
	}

	return new Promise((resolve, reject)=>{
		let t = setTimeout(()=>{
			t = null;
			const e = new error(timeout);
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
