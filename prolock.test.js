#!/bin/bash

import test from "tape";
import { PromiseLock, TimeoutPromise } from "./prolock.js";

// scale sleep times:
var sc = 0.02;
//sc = 1;

function sleep(ms) {
	return new Promise((resolve)=>{
		setTimeout(resolve, ms);
	});
};

var prolock = PromiseLock({
	"release_lock": 1000*sc,
	"timeout_lock": 5000*sc,
});

test("Execution", async function(t) {
	t.plan(2);

	t.ok(await prolock(async ()=>{
		t.ok(true, "inner");
		return true;
	}), "outer");
});

test("Locking", async function(t) {
	t.plan(6);

	var i = 0;
	var p1 = prolock(async ()=>{
		t.equal(++i, 1);
		await sleep(100*sc);
		t.equal(++i, 2);
		return true;
	});
	var p2 = prolock(async ()=>{
		t.equal(++i, 3);
		await sleep(100*sc);
		t.equal(++i, 4);
		return true;
	});
	var p3 = prolock(async ()=>{
		t.equal(++i, 5);
		await sleep(100*sc);
		t.equal(++i, 6);
		return true;
	});
	await p3;
	await p2;
	await p1;
});
test("Check Error forwarding", async function(t) {
	t.plan(1);
	try {
		await prolock(async ()=>{
			throw new Error("TEST ERROR 2");
		});
	} catch(err) {
		t.equal(err.message, "TEST ERROR 2", "forward error message");
	}
});
test("Argument check: callback", async function(t) {
	t.plan(1);
	try {
		await prolock("invalid");
	} catch(err) {
		t.equal(err.message, "argument options invalid", "error message");
	}
});
test("Argument check: callback return", async function(t) {
	t.plan(2);
	try {
		var v = await prolock(() => {
			return 5;
		});
		t.equal(v, 5, "if not a promise: return return value");
	} catch(err) {
		t.fail();
	}

	try {
		var v = await prolock(() => {
			return undefined;
		});
		t.equal(v, undefined, "if not a promise: return return value");
	} catch(err) {
		t.fail();
	}
});
test("direct lock", async function(t) {
	t.plan(6);

	var i=0;
	(async ()=>{
		var unlock = await prolock({
			"timeout_lock": 1000*sc
		});
		t.equal(++i, 1);
		await sleep(100*sc);
		t.equal(++i, 2);
		unlock();
	})();
	(async ()=>{
		var unlock = await prolock({
			"timeout_lock": 2000*sc
		});
		t.equal(++i, 3);
		await sleep(100*sc);
		t.equal(++i, 4);
		unlock();
	})();
	(async ()=>{
		var unlock = await prolock();
		t.equal(++i, 5);
		await sleep(100*sc);
		t.equal(++i, 6);
		unlock();
	})();

	(await prolock())();
});

test("direct lock with timeout", async function(t) {
	t.plan(4);

	var i=0;
	var unlock_1;
	var p1 = (async ()=>{
		unlock_1 = await prolock();
		t.equal(++i, 1, "1");
		// do not release here
	})();
	var p2 = (async ()=>{
		try {
			var unlock = await prolock({
				"timeout_lock": 100*sc
			});
			t.fail();
		} catch(err) {
			t.equal(err.code, "ETIMEOUT_LOCK", "exception");
		}
		unlock_1();
	})();
	var p3 = (async ()=>{
		try {
			var unlock = await prolock();
			t.equal(++i, 2, "2");
			await sleep(100*sc);
			t.equal(++i, 3, "3");
			unlock();
		} catch(err) {
			t.fail();
		}
	})();

	await p3;
	await p2;
	await p1;
});
test("timeout lock, no timeout", async function(t) {
	t.plan(1);

	t.ok(await prolock(async ()=>{ return true; }, {
		"release_lock": 1000*sc,
	}));
});
test("timeout lock, timeout", async function(t) {
	t.plan(1);

	try {
		await prolock(()=>new Promise(()=>{}), {
			"release_lock": 100*sc
		});
	} catch (err) {
		t.equal(err.code, "ETIMEOUT_RELEASE", "exception");
	}
});

test("Base function, again", async function(t) {
	t.plan(1);

	t.ok(await prolock(async ()=>{ return true; }));
});


test("Release Timeout", async function(t) {
	t.plan(3);
	var prolock = PromiseLock({
		"release_lock": 100*sc,
		"timeout_lock": 500*sc,
	});

	var p1 = prolock(()=>new Promise(()=>{}));
	p1.then(()=>console.log("close p1"),(err)=>{
		t.equal(err.code, "ETIMEOUT_RELEASE", "error message release");
	});

	t.ok(await prolock(async ()=>{
		t.ok(true, "inner");
		return true;
	}), "outer");
});

test("Lock Timeout", async function(t) {
	t.plan(2);
	var prolock = PromiseLock({
		"release_lock": 500*sc,
		"timeout_lock": 100*sc,
	});

	var p1 = prolock(()=>new Promise(()=>{}));
	p1.then(()=>console.log("close p1"),(err)=>{
		t.equal(err.code, "ETIMEOUT_RELEASE", "error message release");
	});

	try {
		await prolock(async ()=>{
			t.fail();
			return true;
		});
	} catch(err) {
		t.equal(err.code, "ETIMEOUT_LOCK", "error message lock");
	}
	try { await p1; } catch(err) {}
});

test("Release Timeout of direct mode", async function(t) {
	t.plan(4);
	var prolock = PromiseLock({
		"release_lock": 1000*sc,
		"timeout_lock": 5000*sc,
	});

	var unlock_1;
	var p1 = (async ()=>{
		unlock_1 = await prolock();
		t.ok(1, "step 1");
		// do not release here
	})();

	t.ok(await prolock(async ()=>{
		t.ok(true, "inner");
		return true;
	}), "outer");

	await p1;
	try {
		unlock_1();
	} catch (err) {
		t.equal(err.code, "ETIMEOUT_UNLOCK", "error message");
	}
});



/* Tests for Timeout Promise */

test("Timeout Promise - No Timeout", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise((async ()=>{
		await sleep(10*sc);
		return 8;
	})());
	t.equal(v, 8);
});

test("Timeout Promise - Base", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise((async ()=>{
		await sleep(10*sc);
		return 8;
	})(), 100*sc);
	t.equal(v, 8);
});
test("Timeout Promise - Base 2", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise(new Promise((resolve)=>{
		resolve(8);
	}), 100*sc);
	t.equal(v, 8);
});
test("Timeout Promise - Exception", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(10*sc);
			throw new Error("ERROR 3");
		})(), 100*sc);
	} catch(err) {
		t.equal(err.message, "ERROR 3");
	}
});

test("Timeout Promise - Timeout", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(200*sc);
			return 8;
		})(), 20*sc);
	} catch(err) {
		t.equal(err.message, "Promise Timeout");
	}
});
test("Timeout Promise - Timeout Exception", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(200*sc);
			throw new Error("ERROR 3");
		})(), 20*sc);
	} catch(err) {
		t.equal(err.message, "Promise Timeout");
	}
});

