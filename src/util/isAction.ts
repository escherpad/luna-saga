/** Created by ge on 3/27/16. */
//import isPlainObject from "lodash/isPlainObject";
import * as _ from "lodash";
var isPlainObject = _.isPlainObject;
export function isAction(obj:any):boolean {
    return (typeof obj.type !== "undefined" && _.isPlainObject(obj) && !obj.__isNotAction)
}
