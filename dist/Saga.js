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
var Saga = (function (_super) {
    __extends(Saga, _super);
    function Saga(proc) {
        var _this = _super.call(this) || this;
        _this.isHalted = false;
        _this.process = proc;
        _this.log$ = new rxjs_1.Subject();
        _this.action$ = new rxjs_1.Subject();
        _this.thunk$ = new rxjs_1.Subject();
        _this.replay$ = new rxjs_1.ReplaySubject(1);
        return _this;
    }
    Saga.prototype.next = function (value) {
        this.value = value;
        if (this.isHalted) {
            this.childProcess.process.next(value);
        }
        else {
            _super.prototype.next.call(this, value);
            this.replay$.next(value);
        }
    };
    Saga.prototype._nextYield = function (res, err) {
        var _this = this;
        var yielded;
        if (typeof err !== "undefined" && !isNull_1.isNull(err)) {
            /* [DONE] we need to handle the error here in case the generator does not handle it
             correctly.*/
            try {
                yielded = this.process.throw(err);
            }
            catch (e) {
                /* if an exception is thrown, `yield` would be undefined, and we need to
                 terminate the process. */
                // todo: make the stack trace prettier and more informative.
                console.warn('generator has raised an unhandled exception. This process will be terminated.', this.process);
                console.error(err);
                return this.complete();
            }
        }
        else {
            yielded = this.process.next(res);
        }
        if (!yielded) {
            /*should never hit here.*/
            console.warn('`yielded` is undefined. This is likely a problem with `luna-saga`.');
            this.complete();
        }
        else if (yielded.done) {
            this._evaluateYield(yielded, function () { return _this.complete(); });
        }
        else {
            this._evaluateYield(yielded, function (res, err) { return _this._nextYield(res, err); });
        }
        return this;
    };
    Saga.prototype._evaluateYield = function (yielded, nextYield) {
        var _this = this;
        if (!yielded)
            throw Error('`yielded` need to exist');
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
            return effectsHelpers_1.takeHandler(_effect, this);
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
    Saga.prototype.run = function () {
        if (typeof this.process === "undefined")
            return this;
        this._nextYield();
        return this;
    };
    Saga.prototype.startChildProcess = function (newProcess, onErrorAndCompletion) {
        this.isHalted = true;
        this.childProcess = {
            process: newProcess,
            subscriptions: [
                newProcess.action$.subscribe(this.action$),
                newProcess.thunk$.subscribe(this.thunk$),
                newProcess.log$.subscribe(this.log$.next.bind(this.log$), onErrorAndCompletion, onErrorAndCompletion),
            ]
        };
        newProcess.run();
        var currentValue = this.getValue();
        newProcess.next({
            state: currentValue ? currentValue.state : undefined,
            action: { type: exports.SAGA_CONNECT_ACTION }
        });
    };
    Saga.prototype.resume = function () {
        this.isHalted = false;
        this.childProcess.subscriptions.forEach(function (sub) {
            sub.unsubscribe();
        });
        delete this.childProcess;
    };
    Saga.prototype.complete = function () {
        this.replay$.complete();
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    };
    return Saga;
}(rxjs_1.Subject));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Saga;
