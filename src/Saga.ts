/** Created by ge on 12/4/15. */
//import {Subject, ReplaySubject, Observable} from 'rxjs/Rx';
import {Action, Thunk, Reducer, Hash} from "luna";
import {TSaga} from "./interfaces";
import {isPromise} from "./util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {isThunk} from "./util/isThunk";
import {ReplaySubject} from "rxjs/Rx";
import {isUndefined} from "./util/isUndefined";

export class Saga<TAction> {
    private process:Iterator<any>;
    private yielded:any;
    public log$:ReplaySubject<any>;
    public action$:ReplaySubject<any>;
    public thunk$:ReplaySubject<()=>any>;

    constructor(proc:()=>Iterator<any>) {
        let replayLength = 1;
        this.log$ = new ReplaySubject<any>(replayLength);
        this.action$ = new ReplaySubject<TAction>(replayLength);
        this.thunk$ = new ReplaySubject<()=>any>(replayLength);
        this.setProcess(proc);
    }

    setProcess(proc:()=>Iterator<any>) {
        if (typeof proc !== "undefined") this.process = proc();
        return this;
    }


    evaluateYield(callback:(res?:any, err?:any)=>void) {
        this.log$.next(this.yielded.value);
        var isSynchronous = true;
        if (isUndefined(this.yielded.value)) {
            // What the generator gets when it `const variable = yield;`.
            // we can pass back a callback function if we want.
        } else if (isThunk(this.yielded.value)) {
            this.thunk$.next(this.yielded.value);
        } else if (isPromise(this.yielded.value)) {
            isSynchronous = false;
            let p = this.yielded.value;
            p.then(
                (res:any):void => {
                    callback(res);
                },
                (err:any):void => {
                    callback(null, err);
                }
            )
        } else if (isEffect(this.yielded.value)) {
        } else if (isAction(this.yielded.value)) {
            this.action$.next(this.yielded.value);
        } else {
        }
        if (isSynchronous) callback(this.yielded.value);
        return this;
    }

    next(res?:any, err?:any) {
        if (typeof err !== "undefined") {
            //console.log('===> THROW', err);
            this.yielded = this.process.throw(err);
        } else {
            console.log('===> YIELD', JSON.stringify(res));
            this.yielded = this.process.next(res);
        }
        if (this.yielded && this.yielded.done) {
            this.evaluateYield(()=> this.complete());
        } else {
            this.evaluateYield((res?:any, err?:any)=>this.next(res, err));
        }
        return this;
    }

    run() {
        if (typeof this.process === "undefined") return this;
        this.next();
        return this;
    }

    complete(){
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    }
}
