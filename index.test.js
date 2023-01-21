#!/bin/bash

import test from "tape";
import { PromiseLock } from "./index.js";

test("PromiseLock is defined", async function(t) {
	t.plan(1);

	t.equal(typeof PromiseLock, "function");
});

