'use strict';

var child_process = require('child_process'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

/**
 * Initializes a new instance of respawner.
 * @class
 * @classdesc Spawns a child process at a set interval.
 * @param {String} path The child process command.
 * @param {String} args The arguments to the spawned process.
 */
function Respawner(path, args) {
    var that = this,
        spawning,
        spawner;
    
    /**
     * Starts spawning the child process.
     * @param {Number} [interval=60000] The spawn interval in milliseconds.
     */
    Respawner.prototype.start = function (interval) {
        if (spawning) {
            return;
        }
        
        interval = interval || 60000;
        spawning = true;
        
        (function spawn() {
            var process = child_process.spawn(path, args.split(' '));
            handleSpawnEvents(process);
            
            if (spawning) {
                spawner = setTimeout(spawn, interval);
            }
        }());
    };
    
    /**
     * Stops spawning the child process.
     * @param {Boolean} [stopNow=true] True to stop spawning immediately, false to stop after the next spawn.
     */
    Respawner.prototype.stop = function (stopNow) {
        stopNow = (stopNow !== false) ? true : false;
        
        if (spawning) {
            if (stopNow && spawner) {
                clearTimeout(spawner);
            }
            
            spawning = false;
            spawner = null;
        }
    };
    
    function handleSpawnEvents(process) {
        var output = '';
        
        process.on('error', function (err) {
            /** 'error' event. Is emitted if the child process cannot be spawned.
             * @event Respawner#error
             */
            that.emit('error', err);
        });
        
        process.on('exit', function () {
            /** 'exit' event. Is emitted when the child process exits. All concatenated data from the
             * child process's stdout is returned.
             * @event Respawner#exit
             */
            that.emit('exit', output);
        });
        
        process.stdout.on('data', function (data) {
            output += data;
            /** 'data' event. Is emitted when data is received from the child process's stdout.
             * @event Respawner#data
             */
            that.emit('data', data);
        });
    }
}

util.inherits(Respawner, EventEmitter);

module.exports = Respawner;