/** Created by ge on 4/1/16. */
import {TSym, Sym} from "./Sym";

const $CALLBACK: TSym = Sym("CALLBACK");
export const $CALLBACK_START: TSym = Sym("$CALLBACK_START");
export const $CALLBACK_RETURN: TSym = Sym("$CALLBACK_RETURN");
export const $CALLBACK_THROW: TSym = Sym("$CALLBACK_THROW");

export interface ICallback {
    type: TSym;
    [key: string]: any | undefined;
}

export const CALLBACK: ICallback = {type: $CALLBACK};
export const CALLBACK_START: ICallback = {type: $CALLBACK_START};

export function isCallback(callbackObject?: ICallback): boolean {
    return (!!callbackObject && callbackObject.type === $CALLBACK);
}

export function CallbackThrow(err: any): ICallback {
    return {
        type: $CALLBACK_THROW,
        error: err
    }
}

export function CallbackReturn(res: any): ICallback {
    return {
        type: $CALLBACK_RETURN,
        result: res
    }
}
