"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Created by ge on 3/27/16. */
/// <reference path="./lodash.isplainobject.d.ts"/>
var isPlainObject = require("lodash.isplainobject");
function isAction(obj) {
    return (!!obj && typeof obj.type !== "undefined" && isPlainObject(obj) && !obj.__isNotAction);
}
exports.isAction = isAction;
//# sourceMappingURL=isAction.js.map