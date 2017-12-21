"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Created by ge on 4/1/16. */
var Sym_1 = require("./Sym");
var $CALLBACK = Sym_1.Sym("CALLBACK");
exports.$CALLBACK_START = Sym_1.Sym("$CALLBACK_START");
exports.$CALLBACK_RETURN = Sym_1.Sym("$CALLBACK_RETURN");
exports.$CALLBACK_THROW = Sym_1.Sym("$CALLBACK_THROW");
exports.CALLBACK = { type: $CALLBACK };
exports.CALLBACK_START = { type: exports.$CALLBACK_START };
function isCallback(callbackObject) {
    return (!!callbackObject && callbackObject.type === $CALLBACK);
}
exports.isCallback = isCallback;
function CallbackThrow(err) {
    return {
        type: exports.$CALLBACK_THROW,
        error: err
    };
}
exports.CallbackThrow = CallbackThrow;
function CallbackReturn(res) {
    return {
        type: exports.$CALLBACK_RETURN,
        result: res
    };
}
exports.CallbackReturn = CallbackReturn;
//# sourceMappingURL=isCallback.js.map