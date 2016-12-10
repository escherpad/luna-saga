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
var effectsHelpers_1 = require("./effects/effectsHelpers");
var isCallback_2 = require("./util/isCallback");
var isNull_1 = require("./util/isNull");
var Saga = (function (_super) {
    __extends(Saga, _super);
    function Saga(proc) {
        _super.call(this); // replay just no past event, just broadcase new ones.
        this.log$ = new rxjs_1.Subject();
        this.action$ = new rxjs_1.Subject();
        this.thunk$ = new rxjs_1.Subject();
        this.replay$ = new rxjs_1.ReplaySubject(1);
        this.setProcess(proc);
    }
    Saga.prototype.setProcess = function (proc) {
        if (typeof proc !== "undefined")
            this.process = proc();
        return this;
    };
    Saga.prototype.executeEffect = function (effect) {
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
    Saga.prototype.evaluateYield = function (yielded, nextYield) {
        var _this = this;
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
            var p = this.executeEffect(yielded.value).then(function (res) {
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
    Saga.prototype.next = function (value) {
        _super.prototype.next.call(this, value);
        this.replay$.next(value);
    };
    Saga.prototype.nextYield = function (res, err) {
        var _this = this;
        var yielded;
        if (typeof err !== "undefined" && !isNull_1.isNull(err)) {
            yielded = this.process.throw(err);
        }
        else {
            yielded = this.process.next(res);
        }
        if (yielded && yielded.done) {
            this.evaluateYield(yielded, function () { return _this.complete(); });
        }
        else {
            this.evaluateYield(yielded, function (res, err) { return _this.nextYield(res, err); });
        }
        return this;
    };
    Saga.prototype.run = function () {
        if (typeof this.process === "undefined")
            return this;
        this.nextYield();
        return this;
    };
    Saga.prototype.complete = function () {
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    };
    return Saga;
}(rxjs_1.Subject));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Saga;
