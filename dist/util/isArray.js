"use strict";
/** Created by ge on 3/27/16. */
function isArray(obj) {
    return (!!obj && typeof obj === "object" && typeof obj.length !== "undefined");
}
exports.isArray = isArray;
