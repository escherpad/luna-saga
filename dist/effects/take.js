"use strict";
/** Created by ge on 3/27/16. */
const Sym_1 = require("../util/Sym");
exports.TAKE = Sym_1.Sym("TAKE");
function take(selector) {
    return { type: exports.TAKE, selector: selector };
}
exports.take = take;
