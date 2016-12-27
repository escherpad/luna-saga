/** Created by ge on 3/28/16.
 * These effect handling logic are not intended to be pure functions. They are
 * supposed to be aware of the parent thread via the `_this` parameter that is
 * passed in, and are free to call methods of the parent.
 *
 * Spinning up a new process however, is a bit tricky.
 * */
import {Sym, TSym} from "../util/Sym";
import {TEffectBase} from "./interfaces";
import {Action, StateActionBundle} from "luna";
import {Subject} from "rxjs";
import {TSaga} from "../interfaces";
import {isArray} from "../util/isArray";
import {isIterator} from "../util/isIterator";
import Saga from "../Saga";
import {isPromise} from "../util/isPromise";

export const EFFECT: TSym = Sym("EFFECT");

export interface ITakeEffect extends TEffectBase {
    actionType: any;
}

export const TAKE: TSym = Sym("TAKE");

export function take(actionType: any): ITakeEffect {
    return {type: TAKE, actionType};
}

export function takeHandler<T extends StateActionBundle<any>>(effect: ITakeEffect, _this: Subject<T>): Promise<any> {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        _this
            .first((saga: T): boolean => {
                if (!saga.action.type) {
                    return false;
                } else if (saga.action.type === effect.actionType) {
                    return true;
                } else if (isArray(effect.actionType)) {
                    return effect.actionType.indexOf(saga.action.type) > -1;
                } else return (typeof effect.actionType !== 'string' && !!saga.action.type.match(effect.actionType));
            })
            .subscribe(
                (saga: T) => {
                    isResolved = true;
                    resolve(saga);
                }, (err: any) => {
                    isResolved = true;
                    reject(err);
                }, () => {
                    if (!isResolved) reject("take effect stream ended without finding match");
                })
    })
}

export interface IDispatchEffect extends TEffectBase {
    action: Action;
}
export const DISPATCH: TSym = Sym("DISPATCH");

export function dispatch(action: Action): IDispatchEffect {
    return {type: DISPATCH, action};
}

export function dispatchHandler<T extends StateActionBundle<any>>(effect: IDispatchEffect, _this: TSaga<T>): Promise<any> {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        /* the actions should be synchronous, however race condition need to be tested. */
        _this.take(1)
            .subscribe(
                (saga: T) => {
                    isResolved = true;
                    if (saga.action.type !== effect.action.type) { // + action id to make sure.
                        reject(`dispatch effect race condition error: ${JSON.stringify(saga.action)}, ${JSON.stringify(effect.action)}`);
                    } else {
                        resolve(saga)
                    }
                },
                (err: any) => {
                    isResolved = true;
                    reject(err);
                },
                () => {
                    // can add flag <Effect>.noCompletionWarning
                    if (!isResolved) reject("dispatch effect stream ended without getting updated state");
                }
            );
        _this.action$.next(effect.action);
    })
}

export interface ICallEffect extends TEffectBase {
    context?: any;
    fn: any;
    args?: Array<any>
}
export const CALL: TSym = Sym("CALL");

export function call(fn: any, ...args: any[]): ICallEffect {
    let context: any;
    if (typeof fn === 'function') {
        return {type: CALL, fn, args};
    } else {
        [context, fn] = fn as any[];
        return {type: CALL, fn, args, context};
    }
}
export function callHandler<TState, T extends StateActionBundle<TState>>(effect: ICallEffect,
                                                                         _this: Saga<TState>): Promise<any> {
    let {fn, args, context} = effect;
    try {
        let result: any = fn.apply(context, args);
        // cast iterator `result` to iterable, and use Promise.all to process it.
        if (isIterator(result)) {
            // todo: add generator handling logic
            let newProcess = new Saga(result);
            return new Promise((resolve, reject) => {
                _this.startChildProcess(newProcess, (err) => {
                    if (err) return reject(err);
                    else {
                        _this.resume();
                        return resolve()
                    }
                });
            });
        } else if (isPromise(result)) {
            return result;
        } else {
            return Promise.resolve(result);
        }
    } catch (e) {
        return Promise.reject(e);
    }
}

/* apply is call's alias with context */
export function apply(context: any, fn: any, ...args: any[]): ICallEffect {
    return {type: CALL, fn, args, context};
}

//todo: call => handle generators
//todo: cps(fn, ...args)
//todo: cps([context, fn], ...args)
//todo: fork(fn, ...args)
//todo: fork([context, fn], ...args)
//todo: join(task)
//todo: cancel(task)

export interface ISelectEffect extends TEffectBase {
    selector?: string;
}
export const SELECT: TSym = Sym("SELECT");

export function select(selector?: string): ISelectEffect {
    return {type: SELECT, selector};
}

export function selectHandler<T extends StateActionBundle<any>>(effect: ISelectEffect, _this: TSaga<T>): Promise<any> {
    let selector = effect.selector;
    return new Promise((resolve, reject) => {
        let isResolved = false;
        // [DONE] to populate the replay$ subject, use sagaConnect's SAGA_CONNECT_ACTION update bundle.
        _this.replay$.take(1)
            .map((update: StateActionBundle<any>): any => {
                if (typeof selector === "undefined") {
                    return update.state;
                } else if (typeof selector === "string") {
                    return update.state[selector]
                }
            })
            .subscribe(
                (value: any) => {
                    isResolved = true;
                    resolve(value)
                },
                (err: any) => {
                    isResolved = true;
                    reject(err);
                },
                () => {
                    if (!isResolved) reject("dispatch effect stream ended without getting updated state");
                }
            );
    });
}
