"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var isCallback_1 = require("./util/isCallback");
var isPromise_1 = require("./util/isPromise");
var isAction_1 = require("./util/isAction");
var isEffect_1 = require("./effects/isEffect");
var isFunction_1 = require("./util/isFunction");
var rxjs_1 = require("rxjs");
require("rxjs/add/observable/of");
require("rxjs/add/operator/takeUntil");
require("rxjs/add/operator/take");
var isUndefined_1 = require("./util/isUndefined");
require("setimmediate"); // refer to https://github.com/YuzuJS/setImmediate/issues/48
var Sym_1 = require("./util/Sym");
var effectsHelpers_1 = require("./effects/effectsHelpers");
var isCallback_2 = require("./util/isCallback");
var isNull_1 = require("./util/isNull");
exports.SAGA_CONNECT_ACTION = Sym_1.Sym('SAGA_CONNECT_ACTION');
var AutoBindSubject = /** @class */ (function (_super) {
    __extends(AutoBindSubject, _super);
    function AutoBindSubject() {
        var _this = _super.call(this) || this;
        /* bind next method */
        _this.next = _this.next.bind(_this);
        return _this;
    }
    return AutoBindSubject;
}(rxjs_1.Subject));
exports.AutoBindSubject = AutoBindSubject;
/** ProcessSubject
 * Subject emits a termination signal via `this.term$` when completed, then completes
 * the stream and then removes all subscribers.
 */
var ProcessSubject = /** @class */ (function (_super) {
    __extends(ProcessSubject, _super);
    function ProcessSubject() {
        var _this = _super.call(this) || this;
        _this.subscriptions = [];
        _this._term$ = new rxjs_1.Subject();
        /* term$ is used to signal other observers of the end of ProcessSubject */
        _this.term$ = _this._term$.concat(rxjs_1.Observable.of(true));
        _this.destroy = _this.destroy.bind(_this);
        /* call this.distroy on complete and error */
        _this.subscribe(null, _this.destroy, _this.destroy);
        return _this;
    }
    ProcessSubject.prototype.subscribeTo = function ($) {
        this.subscriptions.push($.takeUntil(this.term$).subscribe(this.next));
    };
    /* finally is an operator not a handle. Destroy doesn't exist on Sujects, so it is safe to use it here. */
    ProcessSubject.prototype.destroy = function () {
        this.subscriptions.forEach(function (s) { return s.unsubscribe(); });
        this.subscriptions.length = 0;
        this._term$ = null;
        this.term$ = null;
    };
    return ProcessSubject;
}(AutoBindSubject));
exports.ProcessSubject = ProcessSubject;
exports.CHILD_ERROR = Sym_1.Sym("CHILD_ERROR");
var ChildErr = /** @class */ (function () {
    function ChildErr(err) {
        this.type = exports.CHILD_ERROR;
        this.err = err;
    }
    ;
    return ChildErr;
}());
var NO_PROCESS_ITERATOR = /** @class */ (function (_super) {
    __extends(NO_PROCESS_ITERATOR, _super);
    function NO_PROCESS_ITERATOR() {
        return _super.call(this, "Saga requires a process iterator as the constructor input.") || this;
    }
    return NO_PROCESS_ITERATOR;
}(Error));
var Saga = /** @class */ (function (_super) {
    __extends(Saga, _super);
    function Saga(proc) {
        var _this = _super.call(this) || this;
        _this.isHalted = false;
        _this.childProcesses = [];
        _this.nextYield = _this._nextYield.bind(_this);
        _this.evaluateYield = _this._evaluateYield.bind(_this);
        _this.nextResult = _this._next.bind(_this);
        _this.nextThrow = _this._throw.bind(_this);
        /* this is just the process generator */
        _this.process = proc;
        /* Various signal streams. OUTPUT ONLY. Use internal error/complete handle for signaling. */
        _this.log$ = new AutoBindSubject();
        _this.action$ = new AutoBindSubject();
        _this.thunk$ = new AutoBindSubject();
        /* use a replay subject to maintain state for `select` operator.*/
        _this.replay$ = new rxjs_1.ReplaySubject(1);
        _this.subscribe(_this.replay$);
        return _this;
    }
    Saga.prototype.next = function (value) {
        // proper behavior: play main thread,
        this.value = value;
        // route the bundles into child processes.
        if (!this.isHalted)
            _super.prototype.next.call(this, value); // notifies the super Subject Object.
        if (this.childProcesses) {
            this.childProcesses.forEach(function (proc) { return proc.next(value); });
        }
    };
    Saga.prototype.run = function () {
        if (typeof this.process === "undefined")
            throw new NO_PROCESS_ITERATOR();
        this.nextYield();
        return this;
    };
    Saga.prototype.halt = function () {
        this.isHalted = true;
    };
    Saga.prototype.resume = function () {
        this.isHalted = false;
    };
    Saga.prototype.removeChildProcess = function (childProc) {
        if (this.isStopped)
            return;
        var ind = this.childProcesses.indexOf(childProc);
        if (ind == -1)
            console.warn('child process does not exist');
        else
            this.childProcesses.splice(ind);
    };
    Saga.prototype.destroy = function () {
        /* called by binding in ProcessSubject. destroy all references to release from memory */
        this.process = null;
        this.replay$ = null;
        this.log$ = null;
        this.thunk$ = null;
        this.action$ = null;
        this.childProcesses = null;
        _super.prototype.destroy.call(this);
    };
    Saga.prototype.error = function (err) {
        this.log$.complete();
        /* when termination is triggered by error$ stream, error$.complete double call raise exception. */
        this.thunk$.complete();
        this.action$.complete();
        /* Complete the parent first, to make sure that `this.term$` signals termination. */
        _super.prototype.error.call(this, err);
    };
    Saga.prototype.complete = function () {
        this.log$.complete();
        /* when termination is triggered by error$ stream, error$.complete double call raise exception. */
        this.thunk$.complete();
        this.action$.complete();
        /* Complete the parent first, to make sure that `this.term$` signals termination. */
        _super.prototype.complete.call(this);
    };
    Saga.prototype._next = function (res) {
        //todo: refactor _nextYield
        return this.nextYield(res);
    };
    Saga.prototype._throw = function (err) {
        //todo: refactor _nextYield
        return this.nextYield(null, err);
    };
    /* Topologically a glorified wrapper for this.process.next and this.process.throw. */
    Saga.prototype._nextYield = function (res, err) {
        var yielded;
        if (this.isStopped)
            return console.warn('Saga: yield call back occurs after process termination.');
        /* Handle Errors */
        if (typeof err !== "undefined" && !isNull_1.isNull(err)) {
            /* [DONE] we need to raise from Saga to the generator.*/
            try {
                /* Do NOT terminate, since this error handling happens INSIDE SAGA, eg. for callback functions */
                yielded = this.process.throw(err);
            }
            catch (e) {
                /* print error, which automatically completes the process.*/
                this.error(e);
                /* break the callback stack. */
                throw new Error('THIS SHOULD NEVER BE HIT');
            }
        }
        else {
            /* if an error occur not through `yield`, we will need to intercept it here.*/
            try {
                yielded = this.process.next(res);
            }
            catch (e) {
                /* The process has raised an exception */
                var process = this.process; // maintain a copy of the process b/c this.error removes it.
                this.error(e); // we need to terminate this saga before throwing the error back to the process.
                /* we throw this error back, which terminates the generator. */
                process.throw(e);
                process = null;
                /* the Generator is already running error usually means multiple recursive next() calls happened */
                throw new Error('THIS SHOULD NEVER SHOW B/C OF THROW');
            }
        }
        /* Now evaluate the yielded result... */
        this.evaluateYield(yielded);
    };
    Saga.prototype._evaluateYield = function (yielded) {
        var _this = this;
        if (!yielded) {
            /* should never hit here. Also <saga> should be completed at this point
             * already, so we can't log to error$ because it is already `null`.
             * We log to console instead.
             * If this is hit, something is wrong.
             */
            console.error('`yielded` is undefined. This is likely a problem with `luna-saga`.');
            throw "`yielded` need to exist";
        }
        if (!!yielded.done) {
            // todo: take care of return calls, change logic flow.
            /* Done results *always* have value undefined. */
            this.complete();
            return;
        }
        this.log$.next(yielded.value);
        if (isUndefined_1.isUndefined(yielded.value)) {
            // What the generator gets when it `const variable = yield;`.
            // we can pass back a callback function if we want.
            setImmediate(function () { return _this.nextResult(yielded.value); });
        }
        else if (isFunction_1.isFunction(yielded.value)) {
            this.thunk$.next(yielded.value);
            setImmediate(function () { return _this.nextResult(yielded.value); });
        }
        else if (isCallback_1.isCallbackToken(yielded.value)) {
            // no need to save the yielded result.
            this.log$.next(isCallback_2.CALLBACK_START);
            this.process.next(function (err, res) {
                // does not support (, ...opts: Array<any>)
                /* synchronous next call */
                if (!!err) {
                    _this.log$.next(isCallback_2.CallbackThrow(err));
                    // need to break the callstack b/c still inside process.next call and this callback is synchronous.
                    setImmediate(function () { return _this.nextThrow(err); });
                }
                else {
                    _this.log$.next(isCallback_2.CallbackReturn(res));
                    // need to break the callstack b/c still inside process.next call and this callback is synchronous.
                    setImmediate(function () { return _this.nextResult(res); });
                }
            });
        }
        else if (isPromise_1.isPromise(yielded.value)) {
            var p = yielded.value;
            p.then(this.nextResult, this.nextThrow);
        }
        else if (isEffect_1.isEffect(yielded.value)) {
            /* Promise.then call is in fact asynchronous. This causes consecutive `take`s to miss store actions fired
            synchronously. */
            this._executeEffect(yielded.value).then(this.nextResult, this.nextThrow);
        }
        else {
            if (isAction_1.isAction(yielded.value))
                this.action$.next(yielded.value);
            /** speed comparison for 1000 yields:
             * no callback: 0.110 s, but stack overflow at 3900 calls on Chrome.
             * setTimeout: 4.88 s.
             * setZeroTimeout: 0.196 s, does not stack overflow.
             * setImmediate cross-platform package: 0.120 s. fantastic.
             */
            setImmediate(function () { return _this.nextResult(yielded.value); });
        }
    };
    Saga.prototype._executeEffect = function (effect) {
        var type = effect.type;
        if (type === effectsHelpers_1.TAKE) {
            var _effect = effect;
            return effectsHelpers_1.takeHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.FORK) {
            var _effect = effect;
            return effectsHelpers_1.forkHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.SPAWN) {
            var _effect = effect;
            return effectsHelpers_1.spawnHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.DISPATCH) {
            var _effect = effect;
            return effectsHelpers_1.dispatchHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.CALL) {
            var _effect = effect;
            return effectsHelpers_1.callHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.SELECT) {
            var _effect = effect;
            return effectsHelpers_1.selectHandler(_effect, this);
        }
        else {
            return Promise.reject("executeEffect Error: effect is not found " + JSON.stringify(effect));
        }
    };
    Saga.prototype.getValue = function () {
        return this.value;
    };
    /** Starts a single child process, stop the current process, and resume afterward. */
    Saga.prototype.forkChildProcess = function (newProcess, onError, onFinally, noBubbling) {
        var _this = this;
        this.childProcesses.push(newProcess);
        newProcess.action$.takeUntil(this.term$).subscribe(this.action$.next);
        newProcess.thunk$.takeUntil(this.term$).subscribe(this.thunk$.next);
        newProcess.log$.takeUntil(this.term$).subscribe(this.log$.next);
        if (!noBubbling)
            newProcess.subscribe({ error: function (err) { return _this.error(new ChildErr(err)); } });
        /* We complete the process when the newProcess.error(e) is called. */
        if (onError)
            newProcess.takeUntil(this.term$).subscribe({ error: onError });
        var fin = function () {
            _this.removeChildProcess(newProcess);
            /* release newProcess from memory here. */
            newProcess = null;
            if (typeof onFinally == 'function')
                onFinally();
        };
        newProcess.subscribe({ error: fin, complete: fin });
        // trigger the first subscription event so that child process has the current state(and action).
        newProcess.run();
        var currentValue = this.getValue();
        newProcess.next({
            state: currentValue ? currentValue.state : undefined,
            action: { type: exports.SAGA_CONNECT_ACTION }
        });
    };
    return Saga;
}(ProcessSubject));
exports.default = Saga;
//# sourceMappingURL=Saga.js.map