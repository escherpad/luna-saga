/** Created by ge on 4/1/16. */
import {TSym, Sym} from "./Sym";

const $CALLBACK: TSym = Sym("CALLBACK");
const $ERROR_CALLBACK: TSym = Sym("ERROR_CALLBACK");
const $THEN_CALLBACK: TSym = Sym("then_CALLBACK");
export const $CALLBACK_START: TSym = Sym("$CALLBACK_START");
export const $CALLBACK_RETURN: TSym = Sym("$CALLBACK_RETURN");
export const $CALLBACK_THROW: TSym = Sym("$CALLBACK_THROW");

export interface ICallbackFunc {
    (err?: any, res?: any): void;
}

export interface IErrorFunc {
    (err?: any): void;
}

export interface IThenFunc {
    (res?: any): void;
}

export interface ICallback {
    type: TSym;

    [key: string]: any | undefined;
}

export interface IErrorCallback {
    type: TSym;

    [key: string]: any | undefined;
}

export interface IThenCallback {
    type: TSym;

    [key: string]: any | undefined;
}

export const CALLBACK: ICallback = {type: $CALLBACK};
export const CALLBACK_START: ICallback = {type: $CALLBACK_START};

export function isCallbackToken(callbackObject?: ICallback): boolean {
    return (!!callbackObject && callbackObject.type === $CALLBACK);
}

export function isErrorToken(callbackObject?: IErrorCallback): boolean {
    return (!!callbackObject && callbackObject.type === $ERROR_CALLBACK);
}

export function isThenToken(callbackObject?: IErrorCallback): boolean {
    return (!!callbackObject && callbackObject.type === $THEN_CALLBACK);
}

export function CallbackThrow(err: any): ICallback {
    return {
        type: $CALLBACK_THROW,
        error: err
    }
}

export function CallbackReturn(res?: any): ICallback {
    return {
        type: $CALLBACK_RETURN,
        result: res
    }
}
