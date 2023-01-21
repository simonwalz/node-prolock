# Promise Lock for Node.js

Simple execution lock based on Promises.

## Install & Usage

```sh
npm install prolock
```

## Usage: prolock

The following code allows to lock a execution:

```js
import { PromiseLock } from "prolock";

var prolock = PromiseLock();

// in function
var result = await prolock(async ()=>{
	// execution to lock
	return "result";
});
```

and/or:

```js
// in function
var unlock = await prolock();
// execution to lock
// ...
unlock();
```

To create multiple locks just create an other instance of `PromiseLock`.

## Usage: prolock with Timeout:

Use the following code to lock a execution but with Timeout if we do not get
a lock.

```js
import { PromiseLock } from "prolock";

var prolock = PromiseLock({ // global options:
	"timeout_lock": 3000,
	"release_lock": 4000
});

// in function
var result = await prolock(async ()=>{
	// execution to lock
	return "result";
}, {
	"timeout_lock": 1000,
	"release_lock": 2000
});
```


and/or:

```js
// in function
var unlock = await prolock({
	"timeout_lock": 1000,
	"release_lock": 2000
});
// execution to lock
// ...
unlock();
```

## Functions

Usage: **prolock**(callback: *function*, options: *object*) -> *Promise*

Usage: **prolock**(options: *object*) -> *unlock function*

Usage: **PromiseLock**(options: *object*) -> **prolock** *function*

### Parameter

| Param | Type | Description |
|---|----|---|
| callback | `function` | Async Function for locked execution |
| options | `object` | Options |
| options.timeout_lock | `number` | Timeout in ms for getting lock  |
| options.release_lock | `number` | Timeout in ms for release of own execution to release lock |
| options.no\_fail\_on\_timeout | `boolean` | Continue execution after failed getting lock |

### Exceptions

| Message | Code | Description |
|---|----|---|
| Promise Lock: Could not get lock (Timeout) | `ETIMEOUT_LOCK` | Timed out on getting Lock. See param *timeout_lock* |
| Promise Lock: Timeout released lock | `ETIMEOUT_RELEASE` | Timed out on execution. See param *release_lock* |
| Promise Lock: Argument options invalid | `EINVALID_OPTIONS` | Given argument options is invalid |
| Promise Lock: Already unlocked by Timeout | `ETIMEOUT_UNLOCK` | Unlock function was called, but lock was already timed out |


## License

This software is released under the MIT license.

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
