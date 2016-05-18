"use strict";
/** Created by ge on 3/27/16. */
const lodash_1 = require("lodash");
function isAction(obj) {
    return (typeof obj.type !== "undefined" && lodash_1.isPlainObject(obj) && !obj.__isNotAction);
}
exports.isAction = isAction;
