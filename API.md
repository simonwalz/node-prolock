## Classes

<dl>
<dt><a href="#LockError">LockError</a></dt>
<dd><p>LockError</p>
<p>Could not get lock (Timeout)</p>
</dd>
<dt><a href="#ReleaseError">ReleaseError</a></dt>
<dd><p>ReleaseError</p>
<p>Timeout released lock</p>
</dd>
<dt><a href="#UnlockError">UnlockError</a></dt>
<dd><p>UnlockError</p>
<p>Already unlocked by Timeout</p>
</dd>
<dt><a href="#InvalidOptionsError">InvalidOptionsError</a></dt>
<dd><p>InvalidOptionsError</p>
<p>Argument options invalid</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#prolock">prolock</a> ⇒ <code>Promise</code></dt>
<dd><p>Promise Lock</p>
</dd>
<dt><a href="#prolock">prolock</a> ⇒ <code><a href="#unlock">unlock</a></code></dt>
<dd><p>Promise Lock</p>
</dd>
<dt><a href="#unlock">unlock</a> : <code>function</code></dt>
<dd><p>Unlock function</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#PromiseLock">PromiseLock([global_options])</a> ⇒ <code><a href="#prolock">prolock</a></code></dt>
<dd><p>Promise Lock Initialisation</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p>Options</p>
</dd>
</dl>

<a name="LockError"></a>

## LockError
LockError

Could not get lock (Timeout)

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | is ETIMEOUTLOCK |
| timeout | <code>number</code> | Timeout in ms |

<a name="ReleaseError"></a>

## ReleaseError
ReleaseError

Timeout released lock

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | is ETIMEOUTRELEASE |
| timeout | <code>number</code> | Timeout in ms |

<a name="UnlockError"></a>

## UnlockError
UnlockError

Already unlocked by Timeout

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | is ETIMEOUTUNLOCK |

<a name="InvalidOptionsError"></a>

## InvalidOptionsError
InvalidOptionsError

Argument options invalid

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| code | <code>string</code> | is EINVALIDOPTIONS |

<a name="prolock"></a>

## prolock ⇒ <code>Promise</code>
Promise Lock

**Kind**: global variable  
**Throws**:

- [<code>LockError</code>](#LockError) Lock Error
- [<code>ReleaseError</code>](#ReleaseError) Release Error


| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Async work function to lock |
| [options] | [<code>Options</code>](#Options) | Configuration |

**Example**  
```js
var prolock = new PromiseLock();
var result = await prolock(async ()=>{
    // ...;
    return "result";
});
```
<a name="prolock"></a>

## prolock ⇒ [<code>unlock</code>](#unlock)
Promise Lock

**Kind**: global variable  
**Returns**: [<code>unlock</code>](#unlock) - Unlock function.  
**Throws**:

- [<code>LockError</code>](#LockError) Lock Error


| Param | Type | Description |
| --- | --- | --- |
| [options] | [<code>Options</code>](#Options) | Configuration |

**Example**  
```js
var prolock = new PromiseLock();
var unlock = await prolock();
// ...;
unlock();
```
<a name="unlock"></a>

## unlock : <code>function</code>
Unlock function

**Kind**: global variable  
**Throws**:

- [<code>UnlockError</code>](#UnlockError) Unlock Error

<a name="PromiseLock"></a>

## PromiseLock([global_options]) ⇒ [<code>prolock</code>](#prolock)
Promise Lock Initialisation

**Kind**: global function  
**Returns**: [<code>prolock</code>](#prolock) - prolock function  

| Param | Type | Description |
| --- | --- | --- |
| [global_options] | [<code>Options</code>](#Options) | Configuration |

**Example**  
```js
var prolock = new PromiseLock();
```
<a name="Options"></a>

## Options : <code>Object</code>
Options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [timeout_lock] | <code>number</code> | Timeout in ms for getting lock |
| [release_lock] | <code>number</code> | Timeout in ms for release of own execution to release lock |
| [no_fail_on_timeout] | <code>boolean</code> | Continue execution after failed getting lock |

