"use strict";
/** Created by ge on 3/28/16. */
const Sym_1 = require("../util/Sym");
exports.EFFECT = Sym_1.Sym("EFFECT");
exports.TAKE = Sym_1.Sym("TAKE");
function take(actionType) {
    return { type: exports.TAKE, actionType: actionType };
}
exports.take = take;
function takeHandler(effect, _this) {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        _this
            .first((saga) => (saga.action.type && saga.action.type === effect.actionType))
            .subscribe((saga) => {
            isResolved = true;
            resolve(saga);
        }, (err) => {
            isResolved = true;
            reject(err);
        }, () => {
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
    return new Promise((resolve, reject) => {
        let isResolved = false;
        /* the actions should be synchronous, however race condition need to be tested. */
        _this.take(1)
            .subscribe((saga) => {
            isResolved = true;
            if (saga.action.type !== effect.action.type) {
                reject(`dispatch effect race condition error: ${JSON.stringify(saga.action)}, ${JSON.stringify(effect.action)}`);
            }
            else {
                resolve(saga);
            }
        }, (err) => {
            isResolved = true;
            reject(err);
        }, () => {
            // can add flag <Effect>.noCompletionWarning
            if (!isResolved)
                reject("dispatch effect stream ended without getting updated state");
        });
        _this.action$.next(effect.action);
    });
}
exports.dispatchHandler = dispatchHandler;
exports.CALL = Sym_1.Sym("CALL");
function call(fn, ...args) {
    var context;
    if (typeof fn === 'function') {
        return { type: exports.CALL, fn: fn, args: args };
    }
    else {
        [context, fn] = fn;
        return { type: exports.CALL, fn: fn, args: args, context: context };
    }
}
exports.call = call;
function callHandler(effect, _this) {
    let { fn, args, context } = effect;
    try {
        let result = fn.apply(context, args);
        return Promise.resolve(result);
    }
    catch (e) {
        return Promise.reject(e);
    }
}
exports.callHandler = callHandler;
/* apply is call's alias with context */
function apply(context, fn, ...args) {
    return { type: exports.CALL, fn: fn, args: args, context: context };
}
exports.apply = apply;
exports.SELECT = Sym_1.Sym("SELECT");
function select(selector) {
    return { type: exports.SELECT, selector: selector };
}
exports.select = select;
function selectHandler(effect, _this) {
    let selector = effect.selector;
    return new Promise((resolve, reject) => {
        let isResolved = false;
        /* the actions should be synchronous, however race condition need to be tested. */
        /** todo: take(1) at the beginning before any update happens causes select effect hang
         until an update$ is received. #issue */
        _this.replay$.take(1)
            .map((update) => {
            if (typeof selector === "undefined") {
                return update.state;
            }
            else if (typeof selector === "string") {
                return update.state[selector];
            }
        })
            .subscribe((value) => {
            isResolved = true;
            resolve(value);
        }, (err) => {
            isResolved = true;
            reject(err);
        }, () => {
            if (!isResolved)
                reject("dispatch effect stream ended without getting updated state");
        });
    });
}
exports.selectHandler = selectHandler;
