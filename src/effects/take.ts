/** Created by ge on 3/27/16. */
import {Sym} from "../util/Sym";

export const TAKE = Sym("TAKE");
export function take(selector:((selector: string)=>boolean | RegExp | string)) {
    return {type: TAKE, selector}
}
