"use strict";
/**
 * Created by ge on 12/7/16.
 *
 * Usage Example:
 * yield call(delay, 500)
 *
 * */
Object.defineProperty(exports, "__esModule", { value: true });
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(function () { return resolve(true); }, ms); });
}
exports.delay = delay;
//# sourceMappingURL=helpers.js.map