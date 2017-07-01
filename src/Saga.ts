/** Created by ge on 12/4/15. */
import {Action, Thunk, Reducer, Hash, StateActionBundle} from "luna";
import {isCallback} from "./util/isCallback";
import {isPromise} from "./util/isPromise";
import {isAction} from "./util/isAction";
import {isEffect} from "./effects/isEffect";
import {isFunction} from "./util/isFunction";
import {Subject, ReplaySubject, Observable, Observer, Subscription} from "rxjs";
import {ISubscription} from 'rxjs/Subscription';
import {isUndefined} from "./util/isUndefined";
import "setimmediate"; // refer to https://github.com/YuzuJS/setImmediate/issues/48
import {TEffectBase} from "./effects/interfaces";
import {TSym, Sym} from "./util/Sym";
import {
    TAKE, FORK, DISPATCH, CALL, SELECT,
    ITakeEffect, IForkEffect, IDispatchEffect, ICallEffect, ISelectEffect,
    takeHandler, forkHandler, dispatchHandler, callHandler, selectHandler
} from "./effects/effectsHelpers";
import {CALLBACK_START, CallbackReturn, CallbackThrow} from "./util/isCallback";
import {isNull} from "./util/isNull";

export const SAGA_CONNECT_ACTION: TSym = Sym('SAGA_CONNECT_ACTION');

/** ProcessSubject
 * Subject emits a termination signal via `this.term$` when completeded, then completes
 * the stream and then removes all subscribers.
 */
export class ProcessSubject<T> extends Subject<T> {
    constructor() {
        super();
        /* bind next method */
        this.next = super.next.bind(this);
    }

}

export default class Saga<TState> extends ProcessSubject<StateActionBundle<TState>> {
    private value: StateActionBundle<any>;
    private process: Iterator<any>;
    public isHalted: boolean = false;
    private childProcesses: Array<Saga<TState>> = [];
    public replay$: ReplaySubject<StateActionBundle<TState>>;
    public log$: ProcessSubject<any>;
    public action$: ProcessSubject<any>;
    public thunk$: ProcessSubject<() => any>;

    constructor(proc: Iterator<any>) {
        super();// replay just no past event, just broadcast new ones.
        /* this is just the process generator */
        this.process = proc;
        /* Various signal streams */
        this.log$ = new ProcessSubject<any>();
        this.action$ = new ProcessSubject<Action>();
        this.thunk$ = new ProcessSubject<() => any>();
        /* use a replay subject to maintain state for `select` operator.*/
        this.replay$ = new ReplaySubject<StateActionBundle<TState>>(1);
        this.subscribe(this.replay$);
    }

    next(value: StateActionBundle<TState>) {
        // proper behavior: play main thread,
        this.value = value;
        // route the bundles into child processes.
        if (!this.isHalted) super.next(value); // notifies the super Subject Object.
        if (this.childProcesses.length) {
            this.childProcesses.forEach(proc => proc.next(value));
        }
    }

    run() {
        if (typeof this.process === "undefined") return this;
        this._nextYield();
        return this;
    }

    halt() {
        this.isHalted = true;
    }

    resume() {
        this.isHalted = false;
    }

    terminateChildProcess(childProc: Saga<TState>) {
        childProc.complete();
        const ind = this.childProcesses.indexOf(childProc);
        if (ind >= 0) {
            this.childProcesses.splice(ind);
        } else {
            console.warn('child process is already terminated', childProc);
        }
    }

    destroy(): void {
        this.process = null;
        this.replay$ = null;
        this.thunk$ = null;
        this.action$ = null;
        this.log$ = null;
    };

    complete(): void {
        /* completion releases all handles for GC. */
        super.complete();
        this.thunk$.complete();
        this.action$.complete();
        this.log$.complete();

        /* Now release the observables as well. */
        this.destroy();
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
                console.warn('generator has raised an unhandled exception. This process will be' +
                    ' terminated.', this.process);
                console.error(err);
                // call the destroy instead of complete. complete will terminate `luna`'s
                // input stream. Error-trapping.
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
            // call process destroy, which complete various streams.
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
            return takeHandler({effect: _effect, _this: this});
        } else if (type === FORK) {
            let _effect: IForkEffect = effect;
            return forkHandler(_effect, this);
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
    forkChildProcess(newProcess: Saga<TState>,
                     onError?: (err: any) => void,
                     onCompletion?: () => void) {
        this.childProcesses.push(newProcess);
        // Implement error-trapping. Use a stand-alone onError handler
        newProcess.action$.subscribe(this.action$.next, onError);
        newProcess.thunk$.subscribe(this.thunk$.next, onError);
        newProcess.log$.subscribe(this.log$.next, onError, () => {
            this.terminateChildProcess(newProcess);
            // release newProcess from memory here.
            newProcess = null;
            if (typeof onCompletion == 'function') onCompletion()
        });
        // trigger the first subscription event so that child process has the current state(and action).
        newProcess.run();
        let currentValue = this.getValue();
        newProcess.next({
            state: currentValue ? currentValue.state : undefined,
            action: {type: SAGA_CONNECT_ACTION}
        } as StateActionBundle<TState>);
    }
}

