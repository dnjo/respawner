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
        spawnTestArgs = '-testarg1 -testarg2',
        setTimeoutStub,
        clearTimeoutStub;
    
    beforeEach(function () {
        respawner = new Respawner(spawnTestPath, spawnTestArgs);
        
        spawnEmitter = addListenerAddedEvent(new EventEmitter());
        spawnStdoutEmitter = addListenerAddedEvent(new EventEmitter());
        processMock.spawn = sinon.stub().returns(spawnEmitter);
        spawnEmitter.stdout = spawnStdoutEmitter;
        
        setTimeoutStub = sinon.stub();
        clearTimeoutStub = sinon.stub();
        
        Respawner.__set__('child_process', processMock);
        Respawner.__set__('setTimeout', setTimeoutStub);
        Respawner.__set__('clearTimeout', clearTimeoutStub);
    });
    
    it('should emit the data returned from stdout', function (done) {
        var testData = 'testdata';

        callbackImmediately(spawnStdoutEmitter, 'data', testData);

        respawner.on('data', function (data) {
            assert.equal(data, testData, 'Incorrect data emitted');
            done();
        });

        respawner.start();
    });

    it('should emit all stdout data when the process exits', function (done) {
        var subscribedEvents = [],
            emitterList,
            testData1 = 'testdata1',
            testData2 = 'testdata2';

        function eventSubscribed(event) {
            subscribedEvents.push(event);

            // Make sure both the data and exit events have been subscribed to.
            if (subscribedEvents.indexOf('data') != -1 && subscribedEvents.indexOf('exit') != -1) {
                emitData();
            }
        }

        function emitData() {
            spawnStdoutEmitter.emit('data', testData1);
            spawnStdoutEmitter.emit('data', testData2);
            spawnEmitter.emit('exit');
        }

        callbackOnListener(spawnEmitter, 'exit', function () {
            eventSubscribed('exit');
        });

        callbackOnListener(spawnStdoutEmitter, 'data', function () {
            eventSubscribed('data');
        });

        respawner.on('exit', function (output) {
            assert.equal(output, testData1 + testData2);
            done();
        });

        respawner.start();
    });
    
    it('should emit the correct error if the spawned process has an error', function (done) {
        var testError = 'testerror';

        callbackImmediately(spawnEmitter, 'error', testError);

        respawner.on('error', function (err) {
            assert.equal(err, testError, 'Incorrect error emitted');
            done();
        });

        respawner.start();
    });
    
    describe('start()', function () {
        it('should call spawn with correct arguments', function (done) {
            callbackImmediately(spawnEmitter, 'exit');
            
            respawner.on('exit', function () {
                assert.equal(processMock.spawn.args[0][0], spawnTestPath, 'Incorrect spawn path');
                assert(arraysEqual(processMock.spawn.args[0][1], spawnTestArgs.split(' ')), 'Incorrect spawn arguments');
                done();
            });
            
            respawner.start();
        });
        
        it('should call setTimeout with the correct interval', function (done) {
            var testInterval = 10000;
            
            setTimeoutStub = function (spawnFunction, interval) {
                assert.equal(interval, testInterval, 'Incorrect setTimeout interval');
                done();
            };
            Respawner.__set__('setTimeout', setTimeoutStub);
            
            respawner.start(testInterval);
        });
        
        it('should call setTimeout with the default interval if no interval is passed to it', function (done) {
            var defaultInterval = 60000;
            
            setTimeoutStub = function (spawnFunction, interval) {
                assert.equal(interval, defaultInterval, 'Incorrect setTimeout interval');
                done();
            };
            Respawner.__set__('setTimeout', setTimeoutStub);
            
            respawner.start();
        });
        
        it('should only start spawning a new process the first time it\'s called', function () {
            respawner.start();
            respawner.start();
            
            assert(setTimeoutStub.calledOnce, 'setTimeout was called more than once');
        });
            
    });
    
    describe('stop()', function () {
        it('should call clearTimeout when stopNow is true', function (done) {
            var callCount = 0;
            
            setTimeoutStub = function (spawnFunction) {
                if (++callCount < 2) {
                    // Make sure the return value isn't undefined, then call the spawn function as soon as possible.
                    setTimeout(spawnFunction, 0);
                    return 1;
                } else {
                    respawner.stop();
                    assert(clearTimeoutStub.called, 'clearTimeout was not called');
                    done();
                }
            };
            Respawner.__set__('setTimeout', setTimeoutStub);
            
            respawner.start();
        });
        
        it('should not call clearTimeout when stopNow is false', function (done) {
            var callCount = 0;
            
            setTimeoutStub = function (spawnFunction) {
                if (++callCount < 2) {
                    // Make sure the return value isn't undefined, then call the spawn function as soon as possible.
                    setTimeout(spawnFunction, 0);
                    return 1;
                } else {
                    respawner.stop(false);
                    assert(!clearTimeoutStub.called, 'clearTimeout was called');
                    done();
                }
            };
            Respawner.__set__('setTimeout', setTimeoutStub);
            
            respawner.start();
        });
    });
});

function addListenerAddedEvent(emitter) {
    emitter.on = function (event, listener) {
        emitter.addListener(event, listener);
        if (event !== 'listenerAdded') {
            emitter.emit('listenerAdded', event, listener);
        }
    };

    return emitter;
}

function callbackImmediately(emitter, event) {
    var args = arguments;
    
    emitter.on('listenerAdded', function (listenerEvent, listenerCallback) {
        var callbackArgs = [],
            i;
        
        if (listenerEvent === event) {
            if (args.length > 2) {
                for (i = 2; i < args.length; i++) {
                    callbackArgs.push(args[i]);
                }
                
                listenerCallback.apply(null, callbackArgs);
            } else {
                listenerCallback();
            }
        }
    });
}

function callbackOnListener(emitter, event, cb) {
    emitter.on('listenerAdded', function (listenerEvent) {
        if (event === listenerEvent) {
            cb();
        }
    });
}

function arraysEqual(a1, a2) {
    var i;
    
    if (a1 === a2) {
        return true;
    }
    if (a1 == null || a2 == null) {
        return false;
    }
    if (a1.length != a2.length) {
        return false;
    }

    for (i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) {
            return false;
        }
    }
    
    return true;
}