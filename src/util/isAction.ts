/** Created by ge on 3/27/16. */
var isPlainObject = require("lodash.isplainobject");
export function isAction(obj:any):boolean {
    return (typeof obj.type !== "undefined" && isPlainObject(obj) && !obj.__isNotAction)
}
