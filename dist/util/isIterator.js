"use strict";
/** Created by ge on 12/25/16. */
function isIterator(obj) {
    return (!!obj && typeof obj.next === 'function');
}
exports.isIterator = isIterator;
