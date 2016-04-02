/** Created by ge on 4/1/16. */
import { TSym } from "./Sym";
export declare const $CALLBACK_START: TSym;
export declare const $CALLBACK_RETURN: TSym;
export declare const $CALLBACK_THROW: TSym;
export interface ICallback {
    type: TSym;
    [key: string]: any;
}
export declare const CALLBACK: ICallback;
export declare const CALLBACK_START: ICallback;
export declare function isCallback(callbackObject: ICallback): boolean;
export declare function CallbackThrow(err: any): ICallback;
export declare function CallbackReturn(res: any): ICallback;
