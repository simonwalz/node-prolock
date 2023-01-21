#!/bin/bash

import test from "tape";
import { TimeoutPromise } from "./timeoutpromise.js";

// scale sleep times:
var sc = 0.02;
//sc = 1;

function sleep(ms) {
	return new Promise((resolve)=>{
		setTimeout(resolve, ms);
	});
};

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

