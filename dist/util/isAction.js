"use strict";
/** Created by ge on 3/27/16. */
//import isPlainObject from "lodash/isPlainObject";
const _ = require("lodash");
var isPlainObject = _.isPlainObject;
function isAction(obj) {
    return (typeof obj.type !== "undefined" && _.isPlainObject(obj) && !obj.__isNotAction);
}
exports.isAction = isAction;
