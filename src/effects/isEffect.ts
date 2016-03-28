/** Created by ge on 3/27/16. */
import {EFFECT} from "./EFFECT";

export function isEffect(obj:any):boolean {
    return (obj.type === EFFECT)
}
