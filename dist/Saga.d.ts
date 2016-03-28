import { ReplaySubject } from "rxjs/Rx";
export declare class Saga<TAction> {
    private process;
    private yielded;
    log$: ReplaySubject<any>;
    action$: ReplaySubject<any>;
    thunk$: ReplaySubject<() => any>;
    constructor(proc: () => Iterator<any>);
    setProcess(proc: () => Iterator<any>): this;
    evaluateYield(callback: (res?: any, err?: any) => void): this;
    next(res?: any, err?: any): this;
    run(): this;
    complete(): void;
}
