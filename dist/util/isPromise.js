"use strict";
/** Created by ge on 3/27/16. */
function isPromise(obj) {
    return (obj.then);
}
exports.isPromise = isPromise;
