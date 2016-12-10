/**
 * Created by ge on 12/7/16.
 *
 * Usage Example:
 * yield call(delay, 500)
 *
 * */
"use strict";
function delay(ms) {
    return new Promise(resolve => setTimeout(() => resolve(true), ms));
}
exports.delay = delay;
