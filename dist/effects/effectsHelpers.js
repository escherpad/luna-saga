"use strict";
/** Created by ge on 3/28/16. */
var Sym_1 = require("../util/Sym");
exports.EFFECT = Sym_1.Sym("EFFECT");
exports.TAKE = Sym_1.Sym("TAKE");
function take(actionType) {
    return { type: exports.TAKE, actionType: actionType };
}
exports.take = take;
function takeHandler(effect, _this) {
    return new Promise(function (resolve, reject) {
        var isResolved = false;
        _this
            .first(function (saga) { return (saga.action.type && saga.action.type === effect.actionType); })
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
        _this.take(1)
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
        var result = fn.apply(context, args);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.callHandler = callHandler;
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
        /** DONE: to populate the replay$ subject, use sagaConnect's SAGA_CONNECT_ACTION update bundle. */
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
