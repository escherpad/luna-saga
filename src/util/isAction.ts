/** Created by ge on 3/27/16. */
import {isPlainObject} from "lodash";
export function isAction(obj:any):boolean {
    return (typeof obj.type !== "undefined" && isPlainObject(obj) && !obj.__isNotAction)
}
