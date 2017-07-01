/** Created by ge on 3/27/16. */
import {TAKE, FORK, DISPATCH, CALL, SELECT} from "./effectsHelpers";
let effects = [TAKE, FORK, DISPATCH, CALL, SELECT];
export function isEffect(obj?: any): boolean {
    return (!!obj && obj.type && effects.indexOf(obj.type) > -1);
}
