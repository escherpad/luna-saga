/** Created by ge on 3/28/16.
 * These effect handling logic are not intended to be pure functions. They are
 * supposed to be aware of the parent thread via the `_this` parameter that is
 * passed in, and are free to call methods of the parent.
 *
 * Spinning up a new process however, is a bit tricky.
 *
 * ### Effect API Todo List
 * done: take,
 * todo: takeEvery,
 * todo: takeLatest,
 * done: select,
 * done: call, SYNC: run generators synchronously, continue after complete.
 * done: apply,
 * done: dispatch (same as `put` in redux-saga. We call `put` `dispatch` instead.),
 * todo: fork, ASYNC: fork out a new process without waiting for it's completion.
 * todo: fork(fn, ...args)
 * todo: fork([context, fn], ...args)
 * todo: takem,
 * todo: all, SYNC: `yield all([gen1, gen2, ...])` starts all generators at the same time, then wait for all to finish.
 * todo: race, SYNC: `yield race([gen1, gen2, ...])` starts all, wait for one to finish and cancel the others.
 * todo: cps,
 * todo: spawn,
 * todo: join,
 * todo: cancel,
 * todo: actionChannel,
 * todo: cancelled,
 * todo: flush,
 * todo: getContext,
 * todo: setContext,
 * todo: throttle,
 * todo: cps(fn, ...args)
 * todo: cps([context, fn], ...args)
 * todo: join(task)
 * todo: cancel(task)
 */
import { TSym } from "../util/Sym";
import { TEffectBase } from "./interfaces";
import { Action, StateActionBundle } from "luna";
import { TSaga } from "../interfaces";
import Saga from "../Saga";
export interface ITakeEffect extends TEffectBase {
    actionType: any;
}
export declare const TAKE: TSym;
export declare function take(actionType: any): ITakeEffect;
export declare function takeHandler<T extends StateActionBundle<any>>(effect: ITakeEffect, _this: TSaga<T>): Promise<any>;
export interface IDispatchEffect extends TEffectBase {
    action: Action;
}
export declare const DISPATCH: TSym;
export declare function dispatch(action: Action): IDispatchEffect;
export declare function dispatchHandler<T extends StateActionBundle<any>>(effect: IDispatchEffect, _this: TSaga<T>): Promise<any>;
export interface ICallEffect extends TEffectBase {
    context?: any;
    fn: any;
    args?: Array<any>;
}
export declare const CALL: TSym;
/** `call` starts another child process synchronously. The main process will restart after the new child process
 * or promise has already been resolved. */
export declare function call(fn: any, ...args: any[]): ICallEffect;
export declare function callHandler<TState, T extends StateActionBundle<TState>>(effect: ICallEffect, _this: Saga<TState>): Promise<any>;
export interface IForkEffect extends TEffectBase {
    context?: any;
    fn: any;
    args?: Array<any>;
}
export declare const FORK: TSym;
/** `fork` starts a child process asynchronously. The main process will not block.
 * */
export declare function fork(fn: any, ...args: any[]): IForkEffect;
export declare function forkHandler<TState, T extends StateActionBundle<TState>>(effect: IForkEffect, _this: Saga<TState>): Promise<any>;
export interface ISpawnEffect extends TEffectBase {
    context?: any;
    fn: any;
    args?: Array<any>;
}
export declare const SPAWN: TSym;
/** `spawn` starts a child process asynchronously. without bubbling up the errors. This way the parent won't terminate
 * on child unintercepted errors. */
export declare function spawn(fn: any, ...args: any[]): ISpawnEffect;
export declare function spawnHandler<TState, T extends StateActionBundle<TState>>(effect: ISpawnEffect, _this: Saga<TState>): Promise<any>;
export declare function apply(context: any, fn: any, ...args: any[]): ICallEffect;
export interface ISelectEffect extends TEffectBase {
    selector?: string;
}
export declare const SELECT: TSym;
export declare function select(selector?: string): ISelectEffect;
export declare function selectHandler<T extends StateActionBundle<any>>(effect: ISelectEffect, _this: TSaga<T>): Promise<any>;
