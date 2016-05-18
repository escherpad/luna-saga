/** Created by ge on 3/27/16. */
/// <reference path="./lodash.isplainobject.d.ts"/>
"use strict";
const lodash_isplainobject_1 = require("lodash.isplainobject");
function isAction(obj) {
    return (typeof obj.type !== "undefined" && lodash_isplainobject_1.default(obj) && !obj.__isNotAction);
}
exports.isAction = isAction;
