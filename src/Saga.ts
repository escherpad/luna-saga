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
import {TSym, Sym} from "./util/Sym";
import {
    TAKE, DISPATCH, CALL, SELECT,
    take, dispatch, call, apply, select,
    ITakeEffect, IDispatchEffect, ICallEffect, ISelectEffect,
    takeHandler, dispatchHandler, callHandler, selectHandler
} from "./effects/effectsHelpers";
import {CALLBACK_START, CallbackReturn, CallbackThrow} from "./util/isCallback";
import {isNull} from "./util/isNull";
import {ISubscription} from "rxjs/subscription";

export const SAGA_CONNECT_ACTION: TSym = Sym('SAGA_CONNECT_ACTION');

interface IChildProc<T> {
    process: Saga<T>,
    subscriptions: Array<ISubscription>
}

export default class Saga<TState> extends Subject<StateActionBundle<TState>> {
    private value: StateActionBundle<any>;
    private process: Iterator<any>;
    public isHalted: boolean = false;
    private childProcess: IChildProc<TState>;
    private childProcesss: IChildProc<TState>;
    public replay$: ReplaySubject<StateActionBundle<TState>>;
    public log$: Subject<any>;
    public action$: Subject<any>;
    public thunk$: Subject<() => any>;

    // life-cycle methods
    constructor(proc: Iterator<any>) {
        super();// replay just no past event, just broadcast new ones.
        /* this is just the generator */
        this.process = proc;
        this.log$ = new Subject<any>();
        this.action$ = new Subject<Action>();
        this.thunk$ = new Subject<() => any>();
        this.replay$ = new ReplaySubject<StateActionBundle<TState>>(1);
    }

    next(value: StateActionBundle<TState>) {
        // proper behavior: play main thread,
        this.value = value;
        // route the bundles into the child process. (ChildProcess is just a container)
        if (this.isHalted) {
            this.childProcess.process.next(value);
        } else {
            super.next(value); // notifies the super Subject Object.
            this.replay$.next(value);
        }
    }

    run() {
        if (typeof this.process === "undefined") return this;
        this._nextYield();
        return this;
    }

    resume() {
        this.isHalted = false;
        // doesn't look like we need to unsubscribe here.
        this.childProcess.subscriptions.forEach(sub => {
            sub.unsubscribe();
        });
        delete this.childProcess
    }

    complete() {
        // todo: need to unsubscribe self from store. Use takeUntil(SagaUnsubscribe) instead.
        this.replay$.complete();
        this.thunk$.complete();
        this.action$.complete();
        this.log$.complete();
        super.complete();
        delete this.process;
    }

    _nextYield(res?: any, err?: any) {
        let yielded: IteratorResult<any>;
        if (typeof err !== "undefined" && !isNull(err)) {
            /* [DONE] we need to handle the error here in case the generator does not handle it
             correctly.*/
            try {
                yielded = this.process.throw(err);
            } catch (e) {
                /* if an exception is thrown, `yield` would be undefined, and we need to
                 terminate the process. */
                // todo: make the stack trace prettier and more informative.
                console.warn('generator has raised an unhandled exception. This process will be terminated.', this.process);
                console.error(err);
                return this.complete();
            }
        } else {
            yielded = this.process.next(res);
        }
        if (!yielded) {
            /*should never hit here.*/
            console.warn('`yielded` is undefined. This is likely a problem with `luna-saga`.');
            this.complete();
        } else if (yielded.done) {
            this._evaluateYield(yielded, () => this.complete());
        } else {
            this._evaluateYield(yielded, (res?: any, err?: any) => this._nextYield(res, err));
        }
        return this;
    }

    _evaluateYield(yielded: IteratorResult<any>,
                   nextYield: (res?: any, err?: any) => any | void) {
        if (!yielded) throw Error('`yielded` need to exist');
        this.log$.next(yielded.value);
        let isSynchronous = true;
        if (isUndefined(yielded.value)) {
            // What the generator gets when it `const variable = yield;`.
            // we can pass back a callback function if we want.
        } else if (isFunction(yielded.value)) {
            this.thunk$.next(yielded.value);
        } else if (isCallback(yielded.value)) {
            isSynchronous = false;
            // no need to save the yielded result.
            this.log$.next(CALLBACK_START);
            this.process.next((err: any, res: any) => {
                if (err) {
                    this.log$.next(CallbackThrow(err));
                } else {
                    this.log$.next(CallbackReturn(res));
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
            this._executeEffect(yielded.value).then(
                function (res: any): void {
                    nextYield(res);
                },
                function (err: any): void {
                    nextYield(null, err);
                }
            );
        } else if (isAction(yielded.value)) {
            this.action$.next(yielded.value);
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

    _executeEffect(effect: TEffectBase & any): Promise<any> {
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

    getValue() {
        return this.value;
    }


    /** Starts a single child process, stop the current process, and resume afterward. */
    startChildProcess(newProcess: Saga<TState>, onErrorAndCompletion: (err?: any) => void) {
        this.isHalted = true;
        this.childProcess = {
            process: newProcess,
            subscriptions: [
                newProcess.action$.subscribe(this.action$),
                newProcess.thunk$.subscribe(this.thunk$),
                newProcess.log$.subscribe(
                    this.log$.next.bind(this.log$),
                    onErrorAndCompletion,
                    onErrorAndCompletion
                ),
            ]
        };
        // trigger the first subscription event so that child_proc has the current state(and action).
        newProcess.run();
        let currentValue = this.getValue();
        newProcess.next({
            state: currentValue ? currentValue.state : undefined,
            action: {type: SAGA_CONNECT_ACTION}
        } as StateActionBundle<TState>);
    }

    /** Starts a child process and resume current process without waiting for child_proc completion */
    forkChildProcess(newProcess: Saga<TState>, onErrorAndCompletion: (err?: any) => void) {
    }

}
