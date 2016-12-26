/** Created by ge on 12/4/15. */
import {Action, Thunk, Reducer, Hash, StateActionBundle} from "luna";
import {isCallback} from "./util/isCallback";
import {isPromise} from "./util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {isFunction} from "./util/isFunction";
import {Subject, ReplaySubject} from "rxjs";
import {isUndefined} from "./util/isUndefined";
import "setimmediate"; // refer to https://github.com/YuzuJS/setImmediate/issues/48
import {TEffectBase} from "./effects/interfaces";
import {TSym} from "./util/Sym";
import {
    TAKE, DISPATCH, CALL, SELECT,
    take, dispatch, call, apply, select,
    ITakeEffect, IDispatchEffect, ICallEffect, ISelectEffect,
    takeHandler, dispatchHandler, callHandler, selectHandler
} from "./effects/effectsHelpers";
import {CALLBACK_START, CallbackReturn, CallbackThrow} from "./util/isCallback";
import {isNull} from "./util/isNull";

export class Saga {
    private process: Iterator<any>;
    private complete: ()=> void;
    private putAction: () => void;
    private putThunk: () => void;
    private log: () => void;

    constructor(proc: () => Iterator<any>, complete: () => void, putAction: () => void, putThunk: () => void, log: () => void) {
        this.setProcess(proc);
        this.complete = complete;
        this.putAction = putAction;
        this.putThunk = putThunk;
        this.log = log;
    }

    setProcess(proc: () => Iterator<any>) {
        if (typeof proc !== "undefined") this.process = proc();
        return this;
    }

    /**
     * @param effect
     * @returns Promise<any>: the promise's resolution or rejection kicks off
     *              the next round of iteration, outside of this function.
     */
    executeEffect(effect: TEffectBase&any): Promise<any> {
        let type: TSym = effect.type;
        if (type === TAKE) {
            let _effect: ITakeEffect = effect;
            return takeHandler(_effect, this);
        } else if (type === DISPATCH) {
            let _effect: IDispatchEffect = effect;
            return dispatchHandler(_effect, this);
        } else if (type === CALL) {
            let _effect: ICallEffect = effect;
            return callHandler(_effect, this);
        } else if (type === SELECT) {
            let _effect: ISelectEffect = effect;
            return selectHandler(_effect, this);
        } else {
            return Promise.reject(`executeEffect Error: effect is not found ${JSON.stringify(effect)}`);
        }
    }

    evaluateYield(yielded: IteratorResult<any>, nextYield: (res?: any, err?: any) => void) {
        this.log(yielded.value);
        let isSynchronous = true;
        //todo: handle array of effects
        if (isUndefined(yielded.value)) {
            // What the generator gets when it `const variable = yield;`.
            // we can pass back a callback function if we want.
        } else if (isFunction(yielded.value)) {
            this.putThunk(yielded.value);
        } else if (isCallback(yielded.value)) {
            isSynchronous = false;
            // no need to save the yielded result.
            this.log(CALLBACK_START);
            //note: pass in the process as an input variable
            this.process.next((err: any, res: any) => {
                if (err) {
                    this.log(CallbackThrow(err));
                } else {
                    this.log(CallbackReturn(res));
                }
                setImmediate((): void => {
                    nextYield(res, err)
                });
            });
        } else if (isPromise(yielded.value)) {
            isSynchronous = false;
            let p = yielded.value;
            p.then(
                (res: any): void => {
                    setImmediate(function (): void {
                        nextYield(res);
                    });
                },
                (err: any): void => {
                    setImmediate(function (): void {
                        nextYield(null, err);
                    });
                }
            )
        } else if (isEffect(yielded.value)) {
            isSynchronous = false;
            // executeEffect always returns a promise.
            let p = this.executeEffect(yielded.value).then(
                function (res: any): void {
                    nextYield(res);
                },
                function (err: any): void {
                    nextYield(null, err);
                }
            );
        } else if (isAction(yielded.value)) {
            this.putAction(yielded.value);
        }
        /** speed comparison for 1000 yields:
         * no callback: 0.110 s, but stack overflow at 3900 calls on Chrome.
         * setTimeout: 4.88 s.
         * setZeroTimeout: 0.196 s, does not stack overflow.
         * setImmediate cross-platform package: 0.120 s. fantastic.
         */
        if (isSynchronous) setImmediate((): void => {
            nextYield(yielded.value)
        });
        return this;
    }


    nextYield(res?: any, err?: any) {
        let yielded: IteratorResult<any>;
        if (typeof err !== "undefined" && !isNull(err)) {
            yielded = this.process.throw(err);
        } else {
            yielded = this.process.next(res);
        }
        //todo: this is where we handle multiple yields.
        if (yielded && yielded.done) {
            this.evaluateYield(yielded, () => this.complete());
        } else {
            this.evaluateYield(yielded, (res?: any, err?: any) => this.nextYield(res, err));
        }
        return this;
    }

    run() {
        if (typeof this.process === "undefined") return this;
        this.nextYield(this.process);
        return this;
    }

}

export default class $Saga<TState> extends Subject<StateActionBundle<TState>> {
    private process: Iterator<any>;
    private saga: Saga;
    public replay$: ReplaySubject<StateActionBundle<TState>>;
    public log$: Subject<any>;
    public action$: Subject<any>;
    public thunk$: Subject<() => any>;

    constructor(proc: () => Iterator<any>) {
        super();// replay just no past event, just broadcase new ones.
        this.log$ = new Subject<any>();
        this.action$ = new Subject<Action>();
        this.thunk$ = new Subject<() => any>();
        this.replay$ = new ReplaySubject<StateActionBundle<TState>>(1);

        this.saga = new Saga(proc,
            this.complete.bind(this),
            this.action$.next.bind(this.action$),
            this.action$.next.bind(this.action$),
            this.log$.next.bind(this.log$)
        );
    }

    next(value: any) {
        super.next(value);
        this.replay$.next(value);
    }

    complete() {
        super.complete();
        this.log$.complete();
        this.action$.complete();
        this.thunk$.complete();
    }
}
