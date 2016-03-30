/** Created by ge on 12/4/15. */
//import {Subject, Subject, Observable} from 'rxjs/Rx';
import {Action, Thunk, Reducer, Hash, StateActionBundle} from "luna";
import {isPromise} from "./util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {isThunk} from "./util/isThunk";
import {Subject, ReplaySubject} from "rxjs/Rx";
import {isUndefined} from "./util/isUndefined";
import {setZeroTimeout} from "./util/setZeroTimeout";
import {TEffectBase} from "./effects/interfaces";
import {TSym} from "./util/Sym";
import {
    TAKE, DISPATCH, CALL, SELECT,
    take, dispatch, call, apply, select,
    ITakeEffect, IDispatchEffect, ICallEffect, ISelectEffect,
    takeHandler, dispatchHandler, callHandler, selectHandler
} from "./effects/effectsHelpers";

export class Saga<TState> extends Subject<StateActionBundle<TState>> {
    private process:Iterator<any>;
    public replay$:ReplaySubject<StateActionBundle<TState>>;
    public log$:Subject<any>;
    public action$:Subject<any>;
    public thunk$:Subject<()=>any>;

    constructor(proc:()=>Iterator<any>) {
        super();// replay just no past event, just broadcase new ones.
        this.log$ = new Subject<any>();
        this.action$ = new Subject<Action>();
        this.thunk$ = new Subject<()=>any>();
        this.replay$ = new ReplaySubject<StateActionBundle<TState>>(1);
        this.setProcess(proc);
    }

    setProcess(proc:()=>Iterator<any>) {
        if (typeof proc !== "undefined") this.process = proc();
        return this;
    }

    executeEffect(effect:TEffectBase&any):Promise<any> {
        let type:TSym = effect.type;
        if (type === TAKE) {
            let _effect:ITakeEffect = effect;
            return takeHandler(_effect, this);
        } else if (type === DISPATCH) {
            let _effect:IDispatchEffect = effect;
            return dispatchHandler(_effect, this);
        } else if (type === CALL) {
            let _effect:ICallEffect = effect;
            return callHandler(_effect, this);
        } else if (type === SELECT) {
            let _effect:ISelectEffect = effect;
            return selectHandler(_effect, this);
        } else {
            return Promise.reject(`executeEffect Error: effect is not found ${JSON.stringify(effect)}`);
        }
    }

    evaluateYield(yielded:IteratorResult<any>, callback:(res?:any, err?:any)=>void) {
        this.log$.next(yielded.value);
        var isSynchronous = true;
        if (isUndefined(yielded.value)) {
            // What the generator gets when it `const variable = yield;`.
            // we can pass back a callback function if we want.
        } else if (isThunk(yielded.value)) {
            this.thunk$.next(yielded.value);
        } else if (isPromise(yielded.value)) {
            isSynchronous = false;
            let p = yielded.value;
            p.then(
                (res:any):void => {
                    callback(res);
                },
                (err:any):void => {
                    callback(null, err);
                }
            )
        } else if (isEffect(yielded.value)) {
            isSynchronous = false;
            let p = this.executeEffect(yielded.value).then(
                (res:any):void => {
                    callback(res);
                },
                (err:any):void => {
                    callback(null, err);
                }
            );
        } else if (isAction(yielded.value)) {
            this.action$.next(yielded.value);
        }
        /** speed comparison for 1000 yields:
         * no callback: 0.110 s, but stack overflow at 3900 calls on Chrome.
         * setTimeout: 4.88 s.
         * setZeroTimeout: 0.196 s, does not stack overflow.
         */
        if (isSynchronous) setZeroTimeout(():void=> {
            callback(yielded.value)
        });
        return this;
    }

    next(value:any) {
        super.next(value);
        this.replay$.next(value);
    }

    nextYield(res?:any, err?:any) {
        let yielded:IteratorResult<any>;
        if (typeof err !== "undefined") {
            yielded = this.process.throw(err);
        } else {
            yielded = this.process.next(res);
        }
        if (yielded && yielded.done) {
            this.evaluateYield(yielded, ()=> this.complete());
        } else {
            this.evaluateYield(yielded, (res?:any, err?:any)=>this.nextYield(res, err));
        }
        return this;
    }

    run() {
        if (typeof this.process === "undefined") return this;
        this.nextYield();
        return this;
    }

    complete() {
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    }
}
