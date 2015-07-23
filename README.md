respawner
=========

Description
-----------
respawner is a simple module that spawns a specified child process on a set interval.

Installation
------------
    npm install respawner

Example
-------
```javascript
var Respawner = require('respawner');

var respawner = new Respawner('/path/to/process', '-arg1 -arg2');

respawner.on('exit', function (data) {
    console.log('Process exited. Data returned: ' + data);
});

respawner.start(10000); // Spawns a new process every 10 seconds.
```

API
---

<a name="Respawner"></a>
## Respawner
Spawns a child process at a set interval.

**Kind**: global class  

* [Respawner](#Respawner)
  * [new Respawner(path, args)](#new_Respawner_new)
  * [.start([interval])](#Respawner+start)
  * [.stop([stopNow])](#Respawner+stop)
  * ["error"](#Respawner+event_error)
  * ["exit"](#Respawner+event_exit)
  * ["data"](#Respawner+event_data)

<a name="new_Respawner_new"></a>
### new Respawner(path, args)
Initializes a new instance of respawner.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | The child process command. |
| args | <code>String</code> | The arguments to the spawned process. |

<a name="Respawner+start"></a>
### respawner.start([interval])
Starts spawning the child process.

**Kind**: instance method of <code>[Respawner](#Respawner)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [interval] | <code>Number</code> | <code>60000</code> | The spawn interval in milliseconds. |

<a name="Respawner+stop"></a>
### respawner.stop([stopNow])
Stops spawning the child process.

**Kind**: instance method of <code>[Respawner](#Respawner)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [stopNow] | <code>Boolean</code> | <code>true</code> | True to stop spawning immediately, false to stop after the next spawn. |

<a name="Respawner+event_error"></a>
### "error"
'error' event. Is emitted if the child process cannot be spawned.

**Kind**: event emitted by <code>[Respawner](#Respawner)</code>  
<a name="Respawner+event_exit"></a>
### "exit"
'exit' event. Is emitted when the child process exits. All concatenated data from the
child process's stdout is returned.

**Kind**: event emitted by <code>[Respawner](#Respawner)</code>  
<a name="Respawner+event_data"></a>
### "data"
'data' event. Is emitted when data is received from the child process's stdout.

**Kind**: event emitted by <code>[Respawner](#Respawner)</code>