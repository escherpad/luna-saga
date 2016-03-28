"use strict";
const isPromise_1 = require("./util/isPromise");
const isAction_1 = require("./util/isAction");
const isEffect_1 = require("./effects/isEffect");
const isThunk_1 = require("./util/isThunk");
const Rx_1 = require("rxjs/Rx");
const isUndefined_1 = require("./util/isUndefined");
const setZeroTimeout_1 = require("./util/setZeroTimeout");
class Saga {
    constructor(proc) {
        let replayLength = 1;
        this.log$ = new Rx_1.ReplaySubject(replayLength);
        this.action$ = new Rx_1.ReplaySubject(replayLength);
        this.thunk$ = new Rx_1.ReplaySubject(replayLength);
        this.setProcess(proc);
    }
    setProcess(proc) {
        if (typeof proc !== "undefined")
            this.process = proc();
        return this;
    }
    evaluateYield(callback) {
        this.log$.next(this.yielded.value);
        var isSynchronous = true;
        if (isUndefined_1.isUndefined(this.yielded.value)) {
        }
        else if (isThunk_1.isThunk(this.yielded.value)) {
            this.thunk$.next(this.yielded.value);
        }
        else if (isPromise_1.isPromise(this.yielded.value)) {
            isSynchronous = false;
            let p = this.yielded.value;
            p.then((res) => {
                callback(res);
            }, (err) => {
                callback(null, err);
            });
        }
        else if (isEffect_1.isEffect(this.yielded.value)) {
        }
        else if (isAction_1.isAction(this.yielded.value)) {
            this.action$.next(this.yielded.value);
        }
        else {
        }
        //if (isSynchronous) callback(this.yielded.value);
        /** speed comparison for 1000 yields:
         * no callback: 0.110 s, but stack overflow at 3900 calls on Chrome.
         * setTimeout: 4.88 s.
         * setZeroTimeout: 0.196 s, does not stack overflow.
         */
        if (isSynchronous)
            setZeroTimeout_1.setZeroTimeout(() => {
                callback(this.yielded.value);
            });
        return this;
    }
    next(res, err) {
        if (typeof err !== "undefined") {
            //console.log('===> THROW', err);
            this.yielded = this.process.throw(err);
        }
        else {
            //console.log('===> YIELD', JSON.stringify(res));
            this.yielded = this.process.next(res);
        }
        if (this.yielded && this.yielded.done) {
            this.evaluateYield(() => this.complete());
        }
        else {
            this.evaluateYield((res, err) => this.next(res, err));
        }
        return this;
    }
    run() {
        if (typeof this.process === "undefined")
            return this;
        this.next();
        return this;
    }
    complete() {
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    }
}
exports.Saga = Saga;
