/** Created by ge on 3/27/16. */
/// <reference path="./lodash.isplainobject.d.ts"/>
"use strict";
const isPlainObject = require("lodash.isplainobject");
function isAction(obj) {
    return (typeof obj.type !== "undefined" && isPlainObject(obj) && !obj.__isNotAction);
}
exports.isAction = isAction;
