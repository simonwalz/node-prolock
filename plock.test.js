#!/bin/bash

import { PromiseLock, TimeoutPromise } from "./plock.js";
import test from "tape";

function sleep(ms) {
	return new Promise((resolve)=>{
		setTimeout(resolve, ms);
	});
};

const plock = PromiseLock();

test("Execution", async function(t) {
	t.plan(2);

	t.ok(await plock(async ()=>{
		t.ok(true);
		return true;
	}));
});
test("Locking", async function(t) {
	t.plan(6);

	var i = 0;
	var p1 = plock(async ()=>{
		t.equal(++i, 1);
		await sleep(100);
		t.equal(++i, 2);
		return true;
	});
	var p2 = plock(async ()=>{
		t.equal(++i, 3);
		await sleep(100);
		t.equal(++i, 4);
		return true;
	});
	var p3 = plock(async ()=>{
		t.equal(++i, 5);
		await sleep(100);
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
		await plock(async ()=>{
			throw new Error("TEST ERROR 2");
		});
	} catch(err) {
		t.equal(err.message, "TEST ERROR 2", "forward error message");
	}
});
test("Argument check: callback", async function(t) {
	t.plan(1);
	try {
		await plock("invalid");
	} catch(err) {
		t.equal(err.message, "callback is not a function", "error message");
	}
});
test("Argument check: callback return", async function(t) {
	t.plan(2);
	try {
		var v = await plock(() => {
			return 5;
		});
		t.equal(v, 5, "if not a promise: return return value");
	} catch(err) {
		t.fail();
	}

	try {
		var v = await plock(() => {
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
		var unlock = await plock(1000);
		t.equal(++i, 1);
		await sleep(100);
		t.equal(++i, 2);
		unlock();
	})();
	(async ()=>{
		var unlock = await plock(2000);
		t.equal(++i, 3);
		await sleep(100);
		t.equal(++i, 4);
		unlock();
	})();
	(async ()=>{
		var unlock = await plock();
		t.equal(++i, 5);
		await sleep(100);
		t.equal(++i, 6);
		unlock();
	})();

	(await plock())();
});

test("direct lock with timeout", async function(t) {
	t.plan(4);

	var i=0;
	var p1 = (async ()=>{
		var unlock = await plock();
		t.equal(++i, 1, "1");
	})();
	var p2 = (async ()=>{
		try {
			var unlock = await plock(100);
			t.fail();
		} catch(err) {
			t.equal(err.message, "Promise Timeout", "exception");
		}
	})();
	var p3 = (async ()=>{
		try {
			var unlock = await plock();
			t.equal(++i, 2, "2");
			await sleep(100);
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

	t.ok(await plock(async ()=>{ return true; }, 1000));
});
test("timeout lock, timeout", async function(t) {
	t.plan(1);

	try {
		await plock(()=>new Promise(()=>{}), 100);
	} catch (err) {
		t.equal(err.message, "Promise Timeout");
	}
});

test("Base function, again", async function(t) {
	t.plan(1);

	t.ok(await plock(async ()=>{ return true; }));
});

test("Timeout Promise - No Timeout", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise((async ()=>{
		await sleep(10);
		return 8;
	})());
	t.equal(v, 8);
});

test("Timeout Promise - Base", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise((async ()=>{
		await sleep(10);
		return 8;
	})(), 100);
	t.equal(v, 8);
});
test("Timeout Promise - Base 2", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise(new Promise((resolve)=>{
		resolve(8);
	}), 100);
	t.equal(v, 8);
});
test("Timeout Promise - Exception", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(10);
			throw new Error("ERROR 3");
		})(), 100);
	} catch(err) {
		t.equal(err.message, "ERROR 3");
	}
});

test("Timeout Promise - Timeout", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(120);
			return 8;
		})(), 100);
	} catch(err) {
		t.equal(err.message, "Promise Timeout");
	}
});
test("Timeout Promise - Timeout Exception", async function(t) {
	t.plan(1);

	try {
		var v = await TimeoutPromise((async ()=>{
			await sleep(120);
			throw new Error("ERROR 3");
		})(), 100);
	} catch(err) {
		t.equal(err.message, "Promise Timeout");
	}
});

test("Combination", async function(t) {
	t.plan(1);

	var v = await TimeoutPromise(plock(async ()=>{
		return 8;
	}), 100);
	t.equal(v, 8);
});