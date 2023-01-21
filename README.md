# Promise Lock for Node.js

Simple execution lock based on Promises.

## Install & Usage

```sh
npm install plock
```

## Usage: plock

The following code allows to lock a execution:

```js
import { PromiseLock } from "plock";

var plock = PromiseLock();

// in function
var result = await plock(async ()=>{
	// execution to lock
	return "result";
});
```

and/or:

```js
// in function
var unlock = await plock();
// execution to lock
// ...
unlock();
```


## Usage: plock with Timeout:

Use the following code to lock a execution but with Timeout if we do not get
a lock. 

```js
import { PromiseLock } from "plock";

var plock = PromiseLock({ // global options:
	"timeout_lock": 3000,
	"release_lock": 4000
});

// in function
var result = await plock(async ()=>{
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
var unlock = await plock({
	"timeout_lock": 1000,
	"release_lock": 2000
});
// execution to lock
// ...
unlock();
```

## Functions

Usage: **plock**(callback: *function*, options: *object*) -> *Promise*

Usage: **plock**(options: *object*) -> *unlock function*

Usage: **PromiseLock**(options: *object*) -> **plock** *function*

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
| Argument options invalid | `EINVALID_OPTIONS` | Given argument options is invalid |
| Promise Lock: Already unlocked by Timeout | `ETIMEOUT_UNLOCK` | Unlock function was called, but lock was already timed out |
| Promise Timeout: RELEASE | `ETIMEOUT_RELEASE` | Timed out on execution. See param *release_lock* |
| Promise Timeout: LOCK | `ETIMEOUT_LOCK` | Timed out on getting Lock. See param *timeout_lock* |


## License

This software is released under the MIT license.

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
