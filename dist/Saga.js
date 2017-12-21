"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var isCallback_1 = require("./util/isCallback");
var isPromise_1 = require("./util/isPromise");
var isAction_1 = require("./util/isAction");
var isEffect_1 = require("./effects/isEffect");
var isFunction_1 = require("./util/isFunction");
var rxjs_1 = require("rxjs");
var isUndefined_1 = require("./util/isUndefined");
require("setimmediate"); // refer to https://github.com/YuzuJS/setImmediate/issues/48
var Sym_1 = require("./util/Sym");
var effectsHelpers_1 = require("./effects/effectsHelpers");
var isCallback_2 = require("./util/isCallback");
var isNull_1 = require("./util/isNull");
exports.SAGA_CONNECT_ACTION = Sym_1.Sym('SAGA_CONNECT_ACTION');
var AutoBindSubject = (function (_super) {
    __extends(AutoBindSubject, _super);
    function AutoBindSubject() {
        var _this = _super.call(this) || this;
        /* bind next method */
        _this.next = _super.prototype.next.bind(_this);
        return _this;
    }
    return AutoBindSubject;
}(rxjs_1.Subject));
exports.AutoBindSubject = AutoBindSubject;
/** ProcessSubject
 * Subject emits a termination signal via `this.term$` when completeded, then completes
 * the stream and then removes all subscribers.
 */
var ProcessSubject = (function (_super) {
    __extends(ProcessSubject, _super);
    function ProcessSubject() {
        var _this = _super.call(this) || this;
        _this._term$ = new rxjs_1.Subject();
        _this.term$ = _this._term$.concat(rxjs_1.Observable.of(true));
        return _this;
    }
    ProcessSubject.prototype.complete = function () {
        this._term$.complete();
        _super.prototype.complete.call(this);
        this._term$ = null;
        this.term$ = null;
    };
    return ProcessSubject;
}(AutoBindSubject));
exports.ProcessSubject = ProcessSubject;
var Saga = (function (_super) {
    __extends(Saga, _super);
    function Saga(proc) {
        var _this = _super.call(this) || this;
        _this.isHalted = false;
        _this.childProcesses = [];
        _this.complete = _this.__complete.bind(_this);
        _this.destroy = _this.__destroy.bind(_this);
        /* this is just the process generator */
        _this.process = proc;
        /* Various signal streams */
        _this.log$ = new AutoBindSubject();
        _this.error$ = new AutoBindSubject();
        _this.action$ = new AutoBindSubject();
        _this.thunk$ = new AutoBindSubject();
        /* use take(1) to postpone the event. */
        _this.error$.delay(0.5).subscribe(_this.complete);
        /* use a replay subject to maintain state for `select` operator.*/
        _this.replay$ = new rxjs_1.ReplaySubject(1);
        _this.subscribe(_this.replay$);
        // clean up after all complete hooks are ran.
        _this.delay(0.5).subscribe(null, null, _this.destroy);
        return _this;
    }
    Saga.prototype.next = function (value) {
        // proper behavior: play main thread,
        this.value = value;
        // route the bundles into child processes.
        if (!this.isHalted)
            _super.prototype.next.call(this, value); // notifies the super Subject Object.
        if (this.childProcesses.length) {
            this.childProcesses.forEach(function (proc) { return proc.next(value); });
        }
    };
    Saga.prototype.run = function () {
        if (typeof this.process === "undefined")
            return this;
        this._nextYield();
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
    Saga.prototype.__destroy = function () {
        this.process = null;
        this.replay$ = null;
        this.log$ = null;
        this.error$ = null;
        this.thunk$ = null;
        this.action$ = null;
        this.childProcesses = null;
    };
    ;
    Saga.prototype.__complete = function () {
        /* Complete the parent first, to make sure that `this.term$` signals termination. */
        _super.prototype.complete.call(this);
        this.log$.complete();
        this.error$.complete();
        this.thunk$.complete();
        this.action$.complete();
    };
    Saga.prototype._nextYield = function (res, err) {
        var _this = this;
        var yielded;
        if (this.isStopped)
            return console.warn('Saga: yield call back occurs after process termination.');
        /* Handle Errors */
        if (typeof err !== "undefined" && !isNull_1.isNull(err)) {
            /* [DONE] we need to handle the error here in case the generator does not handle it
             correctly.*/
            try {
                yielded = this.process.throw(err);
            }
            catch (e) {
                /* print error, which automatically completes the process.*/
                return this.error$.next(e);
            }
        }
        else {
            /* if an error occur not through `yield`, we will need to interceptt
             it here.*/
            try {
                yielded = this.process.next(res);
            }
            catch (e) {
                /* Since this error did not come from `yield` (this.process.next),
                 * we can not throw it back. We will just notify `this.error$`. */
                return this.error$.next(e);
            }
        }
        /* Now evaluate the yielded result... */
        if (!yielded) {
            /* should never hit here. Also <saga> should be completed at this point
             * already, so we can't log to error$ because it is already `null`.
             * We log to console instead.
             */
            console.error('`yielded` is undefined. This is likely a problem with ' +
                '`luna-saga`.');
        }
        else if (yielded.done) {
            // call process destroy, which complete various streams.
            this._evaluateYield(yielded, this.complete);
        }
        else {
            this._evaluateYield(yielded, function (res, err) { return _this._nextYield(res, err); });
        }
        return this;
    };
    Saga.prototype._evaluateYield = function (yielded, nextYield) {
        var _this = this;
        if (!yielded)
            this.error$.next('`yielded` need to exist');
        this.log$.next(yielded.value);
        var isSynchronous = true;
        if (isUndefined_1.isUndefined(yielded.value)) {
        }
        else if (isFunction_1.isFunction(yielded.value)) {
            this.thunk$.next(yielded.value);
        }
        else if (isCallback_1.isCallback(yielded.value)) {
            isSynchronous = false;
            // no need to save the yielded result.
            this.log$.next(isCallback_2.CALLBACK_START);
            this.process.next(function (err, res) {
                if (err) {
                    _this.log$.next(isCallback_2.CallbackThrow(err));
                }
                else {
                    _this.log$.next(isCallback_2.CallbackReturn(res));
                }
                setImmediate(function () {
                    nextYield(res, err);
                });
            });
        }
        else if (isPromise_1.isPromise(yielded.value)) {
            isSynchronous = false;
            var p = yielded.value;
            p.then(function (res) {
                setImmediate(function () {
                    nextYield(res);
                });
            }, function (err) {
                setImmediate(function () {
                    nextYield(null, err);
                });
            });
        }
        else if (isEffect_1.isEffect(yielded.value)) {
            isSynchronous = false;
            this._executeEffect(yielded.value).then(function (res) {
                nextYield(res);
            }, function (err) {
                nextYield(null, err);
            });
        }
        else if (isAction_1.isAction(yielded.value)) {
            this.action$.next(yielded.value);
        }
        /** speed comparison for 1000 yields:
         * no callback: 0.110 s, but stack overflow at 3900 calls on Chrome.
         * setTimeout: 4.88 s.
         * setZeroTimeout: 0.196 s, does not stack overflow.
         * setImmediate cross-platform package: 0.120 s. fantastic.
         */
        if (isSynchronous)
            setImmediate(function () {
                nextYield(yielded.value);
            });
        return this;
    };
    Saga.prototype._executeEffect = function (effect) {
        var type = effect.type;
        if (type === effectsHelpers_1.TAKE) {
            var _effect = effect;
            return effectsHelpers_1.takeHandler({ effect: _effect, _this: this });
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
    Saga.prototype.forkChildProcess = function (newProcess, onError, onCompletion, noBubbling) {
        var _this = this;
        this.childProcesses.push(newProcess);
        newProcess.action$.takeUntil(this.term$).subscribe(this.action$.next);
        newProcess.thunk$.takeUntil(this.term$).subscribe(this.thunk$.next);
        newProcess.log$.takeUntil(this.term$).subscribe(this.log$.next);
        if (!noBubbling)
            newProcess.error$.takeUntil(this.term$).subscribe(this.error$.next);
        /* We complete the process when an error is propagated through the `error$` channel.
         * In the constructor this channel automatically calls `complete`, so we only need
         * to have a onComplete handler that removes child processes subscribe to the saga
         * process.
         * */
        if (onError)
            newProcess.error$.takeUntil(this.term$).subscribe(onError);
        newProcess.subscribe(null, null, function () {
            _this.removeChildProcess(newProcess);
            /* release newProcess from memory here. */
            newProcess = null;
            if (typeof onCompletion == 'function')
                onCompletion();
        });
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Saga;
//# sourceMappingURL=Saga.js.map