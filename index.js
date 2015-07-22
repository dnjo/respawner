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
            spawning = false;
            
            if (stopNow && spawner) {
                clearTimeout(spawner);
                spawner = null;
            }
        }
    };
    
    function handleSpawnEvents(process) {
        var output = '';
        
        process.on('error', function (err) {
            that.emit('error', err);
        });
        
        process.on('exit', function () {
            that.emit('exit', output);
        });
        
        process.stdout.on('data', function (data) {
            output += data;
            that.emit('data', data);
        });
    }
}

util.inherits(Respawner, EventEmitter);

module.exports = Respawner;