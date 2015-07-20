'use strict';

var child_process = require('child_process'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function Respawner(path, args) {
    var that = this,
        spawning,
        spawner;
    
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
    
    Respawner.prototype.stop = function (stopNow) {
        if (stopNow !== false) {
            stopNow = true;
        }
        
        if (spawning) {
            spawning = false;
            
            if (stopNow && spawner) {
                clearTimeout(spawner);
            }
        }
    };
}

util.inherits(Respawner, EventEmitter);

module.exports = Respawner;