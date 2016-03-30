/** Created by ge on 12/4/15. */
import { StateActionBundle } from "luna";
import { Subject, ReplaySubject } from "rxjs/Rx";
import { TEffectBase } from "./effects/interfaces";
export declare class Saga<TState> extends Subject<StateActionBundle<TState>> {
    private process;
    replay$: ReplaySubject<StateActionBundle<TState>>;
    log$: Subject<any>;
    action$: Subject<any>;
    thunk$: Subject<() => any>;
    constructor(proc: () => Iterator<any>);
    setProcess(proc: () => Iterator<any>): this;
    executeEffect(effect: TEffectBase & any): Promise<any>;
    evaluateYield(yielded: IteratorResult<any>, callback: (res?: any, err?: any) => void): this;
    next(value: any): void;
    nextYield(res?: any, err?: any): this;
    run(): this;
    complete(): void;
}
