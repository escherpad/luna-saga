"use strict";
const isPromise_1 = require("./util/isPromise");
const isAction_1 = require("./util/isAction");
const isEffect_1 = require("./effects/isEffect");
const isFunction_1 = require("./util/isFunction");
const rxjs_1 = require("rxjs");
const isUndefined_1 = require("./util/isUndefined");
require("setimmediate"); // refer to https://github.com/YuzuJS/setImmediate/issues/48
const effectsHelpers_1 = require("./effects/effectsHelpers");
class Saga extends rxjs_1.Subject {
    constructor(proc) {
        super(); // replay just no past event, just broadcase new ones.
        this.log$ = new rxjs_1.Subject();
        this.action$ = new rxjs_1.Subject();
        this.thunk$ = new rxjs_1.Subject();
        this.replay$ = new rxjs_1.ReplaySubject(1);
        this.setProcess(proc);
    }
    setProcess(proc) {
        if (typeof proc !== "undefined")
            this.process = proc();
        return this;
    }
    executeEffect(effect) {
        let type = effect.type;
        if (type === effectsHelpers_1.TAKE) {
            let _effect = effect;
            return effectsHelpers_1.takeHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.DISPATCH) {
            let _effect = effect;
            return effectsHelpers_1.dispatchHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.CALL) {
            let _effect = effect;
            return effectsHelpers_1.callHandler(_effect, this);
        }
        else if (type === effectsHelpers_1.SELECT) {
            let _effect = effect;
            return effectsHelpers_1.selectHandler(_effect, this);
        }
        else {
            return Promise.reject(`executeEffect Error: effect is not found ${JSON.stringify(effect)}`);
        }
    }
    evaluateYield(yielded, callback) {
        this.log$.next(yielded.value);
        var isSynchronous = true;
        if (isUndefined_1.isUndefined(yielded.value)) {
        }
        else if (isFunction_1.isFunction(yielded.value)) {
            this.thunk$.next(yielded.value);
        }
        else if (isPromise_1.isPromise(yielded.value)) {
            isSynchronous = false;
            let p = yielded.value;
            p.then((res) => {
                callback(res);
            }, (err) => {
                callback(null, err);
            });
        }
        else if (isEffect_1.isEffect(yielded.value)) {
            isSynchronous = false;
            let p = this.executeEffect(yielded.value).then((res) => {
                callback(res);
            }, (err) => {
                callback(null, err);
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
            setImmediate(() => {
                callback(yielded.value);
            });
        return this;
    }
    next(value) {
        super.next(value);
        this.replay$.next(value);
    }
    nextYield(res, err) {
        let yielded;
        if (typeof err !== "undefined") {
            yielded = this.process.throw(err);
        }
        else {
            yielded = this.process.next(res);
        }
        if (yielded && yielded.done) {
            this.evaluateYield(yielded, () => this.complete());
        }
        else {
            this.evaluateYield(yielded, (res, err) => this.nextYield(res, err));
        }
        return this;
    }
    run() {
        if (typeof this.process === "undefined")
            return this;
        this.nextYield();
        return this;
    }
    complete() {
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    }
}
exports.Saga = Saga;
