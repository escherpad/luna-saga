/** Created by ge on 4/1/16. */
import { TSym } from "./Sym";
export declare const $CALLBACK_START: TSym;
export declare const $CALLBACK_RETURN: TSym;
export declare const $CALLBACK_THROW: TSym;
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
export declare const CALLBACK: ICallback;
export declare const CALLBACK_START: ICallback;
export declare function isCallbackToken(callbackObject?: ICallback): boolean;
export declare function isErrorToken(callbackObject?: IErrorCallback): boolean;
export declare function isThenToken(callbackObject?: IErrorCallback): boolean;
export declare function CallbackThrow(err: any): ICallback;
export declare function CallbackReturn(res?: any): ICallback;
