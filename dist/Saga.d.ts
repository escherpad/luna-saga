/** Created by ge on 12/4/15. */
import { StateActionBundle } from "luna";
import { Subject, ReplaySubject, Observable } from "rxjs";
import "setimmediate";
import { TEffectBase } from "./effects/interfaces";
import { TSym } from "./util/Sym";
export declare const SAGA_CONNECT_ACTION: TSym;
export declare class AutoBindSubject<T> extends Subject<T> {
    constructor();
}
/** ProcessSubject
 * Subject emits a termination signal via `this.term$` when completed, then completes
 * the stream and then removes all subscribers.
 */
export declare class ProcessSubject<T> extends AutoBindSubject<T> {
    term$: Observable<any>;
    private _term$;
    constructor();
    complete(): void;
}
export default class Saga<TState> extends ProcessSubject<StateActionBundle<TState>> {
    private value;
    private process;
    isHalted: boolean;
    private childProcesses;
    replay$: ReplaySubject<StateActionBundle<TState>>;
    log$: Subject<any>;
    error$: Subject<any>;
    action$: Subject<any>;
    thunk$: Subject<() => any>;
    private destroy;
    constructor(proc: Iterator<any>);
    next(value: StateActionBundle<TState>): void;
    run(): this;
    halt(): void;
    resume(): void;
    removeChildProcess(childProc: Saga<TState>): void;
    __destroy(): void;
    __complete(): void;
    _nextYield(res?: any, err?: any): void | this;
    _evaluateYield(yielded: IteratorResult<any>, nextYield: (res?: any, err?: any) => any | void): this;
    _executeEffect(effect: TEffectBase & any): Promise<any>;
    getValue(): StateActionBundle<any>;
    /** Starts a single child process, stop the current process, and resume afterward. */
    forkChildProcess(newProcess: Saga<TState>, onError?: (err: any) => void, onCompletion?: () => void, noBubbling?: Boolean): void;
}
