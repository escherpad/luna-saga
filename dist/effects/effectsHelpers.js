/** Created by ge on 3/28/16.
 * These effect handling logic are not intended to be pure functions. They are
 * supposed to be aware of the parent thread via the `_this` parameter that is
 * passed in, and are free to call methods of the parent.
 *
 * Spinning up a new process however, is a bit tricky.
 *
 * ### Effect API Todo List
 * done: take,
 * todo: takeEvery,
 * todo: takeLatest,
 * done: select,
 * done: call, SYNC: run generators synchronously, continue after complete.
 * done: apply,
 * done: dispatch (same as `put` in redux-saga. We call `put` `dispatch` instead.),
 * todo: fork, ASYNC: fork out a new process without waiting for it's completion.
 * todo: fork(fn, ...args)
 * todo: fork([context, fn], ...args)
 * todo: takem,
 * todo: all, SYNC: `yield all([gen1, gen2, ...])` starts all generators at the same time, then wait for all to finish.
 * todo: race, SYNC: `yield race([gen1, gen2, ...])` starts all, wait for one to finish and cancel the others.
 * todo: cps,
 * todo: spawn,
 * todo: join,
 * todo: cancel,
 * todo: actionChannel,
 * todo: cancelled,
 * todo: flush,
 * todo: getContext,
 * todo: setContext,
 * todo: throttle,
 * todo: cps(fn, ...args)
 * todo: cps([context, fn], ...args)
 * todo: join(task)
 * todo: cancel(task)
 */
"use strict";
var Sym_1 = require("../util/Sym");
var isArray_1 = require("../util/isArray");
var isIterator_1 = require("../util/isIterator");
var Saga_1 = require("../Saga");
var isPromise_1 = require("../util/isPromise");
exports.EFFECT = Sym_1.Sym("EFFECT");
exports.TAKE = Sym_1.Sym("TAKE");
function take(actionType) {
    return { type: exports.TAKE, actionType: actionType };
}
exports.take = take;
function takeHandler(parameters) {
    var effect = parameters.effect, _this = parameters._this;
    return new Promise(function (resolve, reject) {
        var isResolved = false;
        _this
            .first(function (saga) {
            if (!saga.action.type) {
                return false;
            }
            else if (saga.action.type === effect.actionType) {
                return true;
            }
            else if (isArray_1.isArray(effect.actionType)) {
                return effect.actionType.indexOf(saga.action.type) > -1;
            }
            else
                return (typeof effect.actionType !== 'string' && !!saga.action.type.match(effect.actionType));
        })
            .subscribe(function (saga) {
            isResolved = true;
            resolve(saga);
        }, function (err) {
            isResolved = true;
            reject(err);
        }, function () {
            if (!isResolved)
                reject("take effect stream ended without finding match");
        });
    });
}
exports.takeHandler = takeHandler;
exports.DISPATCH = Sym_1.Sym("DISPATCH");
function dispatch(action) {
    return { type: exports.DISPATCH, action: action };
}
exports.dispatch = dispatch;
function dispatchHandler(effect, _this) {
    return new Promise(function (resolve, reject) {
        var isResolved = false;
        /* the actions should be synchronous, however race condition need to be tested. */
        _this
            .take(1) // do NOT use replay here b/c you want to wait for the next event.
            .subscribe(function (saga) {
            isResolved = true;
            if (saga.action.type !== effect.action.type) {
                reject("dispatch effect race condition error: " + JSON.stringify(saga.action) + ", " + JSON.stringify(effect.action));
            }
            else {
                resolve(saga);
            }
        }, function (err) {
            isResolved = true;
            reject(err);
        }, function () {
            // can add flag <Effect>.noCompletionWarning
            if (!isResolved)
                reject("dispatch effect stream ended without getting updated state");
        });
        _this.action$.next(effect.action);
    });
}
exports.dispatchHandler = dispatchHandler;
exports.CALL = Sym_1.Sym("CALL");
/** `call` starts another child process synchronously. The main process will restart after the new child process
 * or promise has already been resolved. */
function call(fn) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var context;
    if (typeof fn === 'function') {
        return { type: exports.CALL, fn: fn, args: args };
    }
    else {
        _a = fn, context = _a[0], fn = _a[1];
        return { type: exports.CALL, fn: fn, args: args, context: context };
    }
    var _a;
}
exports.call = call;
function callHandler(effect, _this) {
    var fn = effect.fn, args = effect.args, context = effect.context;
    try {
        var result_1 = fn.apply(context, args);
        // cast iterator `result` to iterable, and use Promise.all to process it.
        if (isIterator_1.isIterator(result_1)) {
            // done: add generator handling logic
            // done: add error handling
            _this.halt();
            return new Promise(function (resolve, reject) { return _this.forkChildProcess(new Saga_1.default(result_1), reject, // how to handle error?
            function () {
                _this.resume();
                resolve();
            }); });
        }
        else if (isPromise_1.isPromise(result_1)) {
            return result_1;
        }
        else {
            return Promise.resolve(result_1);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.callHandler = callHandler;
exports.FORK = Sym_1.Sym("FORK");
/** `fork` starts a child process asynchronously. The main process will not block.
 * */
function fork(fn) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var context;
    if (typeof fn === 'function') {
        return { type: exports.FORK, fn: fn, args: args };
    }
    else {
        _a = fn, context = _a[0], fn = _a[1];
        return { type: exports.FORK, fn: fn, args: args, context: context };
    }
    var _a;
}
exports.fork = fork;
function forkHandler(effect, _this) {
    var fn = effect.fn, args = effect.args, context = effect.context;
    try {
        var result = fn.apply(context, args);
        // cast iterator `result` to iterable, and use Promise.all to process it.
        if (isIterator_1.isIterator(result)) {
            var childProcess = new Saga_1.default(result);
            _this.forkChildProcess(childProcess);
            // todo: return a process id to allow process cancellation
            return Promise.resolve(childProcess);
        }
        else if (isPromise_1.isPromise(result)) {
            return result;
        }
        else {
            return Promise.resolve(result);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.forkHandler = forkHandler;
exports.SPAWN = Sym_1.Sym("SPAWN");
/** `spawn` starts a child process asynchronously. without bubbling up the errors. This way the parent won't terminate
 * on child unintercepted errors. */
function spawn(fn) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    var context;
    if (typeof fn === 'function') {
        return { type: exports.SPAWN, fn: fn, args: args };
    }
    else {
        _a = fn, context = _a[0], fn = _a[1];
        return { type: exports.SPAWN, fn: fn, args: args, context: context };
    }
    var _a;
}
exports.spawn = spawn;
function spawnHandler(effect, _this) {
    var fn = effect.fn, args = effect.args, context = effect.context;
    try {
        var result = fn.apply(context, args);
        // cast iterator `result` to iterable, and use Promise.all to process it.
        if (isIterator_1.isIterator(result)) {
            var childProcess = new Saga_1.default(result);
            _this.forkChildProcess(childProcess, null, null, true);
            // todo: return a process id to allow process cancellation
            return Promise.resolve(childProcess);
        }
        else if (isPromise_1.isPromise(result)) {
            return result;
        }
        else {
            return Promise.resolve(result);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.spawnHandler = spawnHandler;
/* apply is call's alias with context */
function apply(context, fn) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    return { type: exports.CALL, fn: fn, args: args, context: context };
}
exports.apply = apply;
exports.SELECT = Sym_1.Sym("SELECT");
function select(selector) {
    return { type: exports.SELECT, selector: selector };
}
exports.select = select;
function selectHandler(effect, _this) {
    var selector = effect.selector;
    return new Promise(function (resolve, reject) {
        var isResolved = false;
        // [DONE] to populate the replay$ subject, use sagaConnect's SAGA_CONNECT_ACTION update bundle.
        _this.replay$.take(1)
            .map(function (update) {
            if (typeof selector === "undefined") {
                return update.state;
            }
            else if (typeof selector === "string") {
                return update.state[selector];
            }
        })
            .subscribe(function (value) {
            isResolved = true;
            resolve(value);
        }, function (err) {
            isResolved = true;
            reject(err);
        }, function () {
            if (!isResolved)
                reject("dispatch effect stream ended without getting updated state");
        });
    });
}
exports.selectHandler = selectHandler;
