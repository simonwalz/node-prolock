
/*
	"maxConcurrentRequests": 1,
	"key": null,
	"timeout": 5*60*1000,
*/

export function PromiseLock(options) {
	//var requests = [];
	var current = Promise.resolve();

	async function call(callback, last) {
		try {
			await last;
		} catch (err) {
		}
		try {
			// do not do (we want to fail, if it is not a promise)
			//return await Promise.resolve(callback());
			return await callback();
		} catch(err) {
			throw err;
		}
	}

	return function(callback, timeout) {
		//options = {...global_options, ...options};
		if (typeof callback === "undefined" ||
				typeof callback === "number") {
			timeout = callback;
			var _current = current;
			var resolve_cb = null;
			// unlock Promise:
			current = new Promise((resolve)=>{
				resolve_cb = resolve;
			});
			// return Promise based on current with unlock function
			return new TimeoutPromise((resolve)=>{
				_current.finally(()=>{
					resolve(function unlock() {
						resolve_cb();
					});
				});
			}, timeout, resolve_cb);
		}
		//is implicit:
		//if (typeof callback !== "function")
		//	throw new Error("callback is not a function");
		/*
		if (typeof options.pre_timeout === "number") {
			current = new TimeoutPromise(current);
		}
		if (typeof options.exec_timeout === "number") {
		*/
		if (typeof timeout === "number") {
			//current = new TimeoutPromise(current);
			current = new TimeoutPromise(call(callback, current),
					timeout);
		} else {
			current = call(callback, current);
		}
		return current;
	};
};

export function TimeoutPromise(promise, timeout, cancel) {
	if (typeof promise === "function") {
		promise = new Promise(promise);
	}
	if (timeout === undefined) {
		return promise;
	}

	return new Promise((resolve, reject)=>{
		let t = setTimeout(()=>{
			t = null;
			const e = new Error('Promise Timeout');
			e.code = 'ETIMEOUT';
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
