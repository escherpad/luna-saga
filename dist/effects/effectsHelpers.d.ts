/** Created by ge on 3/28/16. */
import { TSym } from "../util/Sym";
import { TEffectBase } from "./interfaces";
import { Action, StateActionBundle } from "luna";
import { Subject } from "rxjs/Rx";
import { TSaga } from "../interfaces";
export declare const EFFECT: TSym;
export interface ITakeEffect extends TEffectBase {
    actionType: any;
}
export declare const TAKE: TSym;
export declare function take(actionType: any): ITakeEffect;
export declare function takeHandler<T extends StateActionBundle<any>>(effect: ITakeEffect, _this: Subject<T>): Promise<any>;
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
export declare function call(fn: any, ...args: any[]): ICallEffect;
export declare function callHandler<T extends StateActionBundle<any>>(effect: ICallEffect, _this: Subject<T>): Promise<any>;
export declare function apply(context: any, fn: any, ...args: any[]): ICallEffect;
export interface ISelectEffect extends TEffectBase {
    selector?: string;
}
export declare const SELECT: TSym;
export declare function select(selector?: string): ISelectEffect;
export declare function selectHandler<T extends StateActionBundle<any>>(effect: ISelectEffect, _this: TSaga<T>): Promise<any>;
