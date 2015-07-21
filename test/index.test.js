/*global describe, it, before, beforeEach, after, afterEach */
'use strict';

var sinon = require('sinon'),
    assert = require('assert'),
    rewire = require('rewire'),
    Respawner = rewire('../index.js'),
    EventEmitter = require('events').EventEmitter;

describe('Respawner', function () {
    var respawner,
        spawnEmitter,
        spawnStdoutEmitter,
        processMock = {},
        spawnTestPath = 'testpath',
        spawnTestArgs = '-testarg1 -testarg2';
    
    beforeEach(function () {
        respawner = new Respawner(spawnTestPath, spawnTestArgs);
        
        spawnEmitter = replaceEmitterOn(new EventEmitter());
        spawnStdoutEmitter = replaceEmitterOn(new EventEmitter());
        
        processMock.spawn = sinon.stub().returns(spawnEmitter);
        spawnEmitter.stdout = spawnStdoutEmitter;
        
        Respawner.__set__('child_process', processMock);
    });
    
    describe('start()', function () {
        it('should call spawn with correct arguments', function (done) {
            emitImmediately(spawnEmitter, 'exit');
            
            respawner.on('exit', function () {
                assert.equal(processMock.spawn.args[0][0], spawnTestPath, 'Incorrect spawn path');
                assert(arraysEqual(processMock.spawn.args[0][1], spawnTestArgs.split(' ')));
                done();
            });
            
            respawner.start();
        });
    });
});

function replaceEmitterOn(emitter) {
    var on = function (event, listener) {
        emitter.addListener(event, listener);
        if (event !== 'listenerAdded') {
            emitter.emit('listenerAdded', event, listener);
        }
    };

    emitter.on = on;
    return emitter;
}

function emitImmediately(emitter, event) {
    var args = arguments;
    
    emitter.on('listenerAdded', function (listenerEvent) {
        var emitArguments = [],
            i;
        
        if (listenerEvent === event) {
            for (i = 1; i < args.length; i++) {
                emitArguments.push(args[i]);
            }
            
            emitter.emit.apply(emitter, emitArguments);
        }
    });
}

function arraysEqual(a, b) {
    if (a === b) { return true; }
    if (a == null || b == null) { return false; }
    if (a.length != b.length) { return false; }

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    
    return true;
}