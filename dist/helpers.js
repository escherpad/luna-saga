"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by ge on 12/7/16.
 *
 * Usage Example:
 * yield call(delay, 500)
 *
 * */
var effectsHelpers_1 = require("./effects/effectsHelpers");
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(function () { return resolve(true); }, ms); });
}
exports.delay = delay;
/* Helper Processes */
/** throttle process: Takes in a task function, a trigger object <RegExp, string, TSym>, input interval, and flag for triggering on falling edge. */
function throttle(task, trigger, interval, falling) {
    if (interval === void 0) { interval = 300; }
    if (falling === void 0) { falling = true; }
    function takeOne() {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // take only one.
                return [4 /*yield*/, effectsHelpers_1.take(trigger)];
                case 1:
                    // take only one.
                    _a.sent();
                    trail = true;
                    return [2 /*return*/];
            }
        });
    }
    var rising, trail, proc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!true) return [3 /*break*/, 7];
                return [4 /*yield*/, effectsHelpers_1.take(trigger)];
            case 1:
                _a.sent();
                rising = true;
                _a.label = 2;
            case 2:
                if (!(trail && falling || rising)) return [3 /*break*/, 6];
                if (rising)
                    rising = false;
                trail = false;
                return [4 /*yield*/, effectsHelpers_1.spawn(takeOne)];
            case 3:
                // take one from the rest
                proc = _a.sent();
                return [4 /*yield*/, effectsHelpers_1.spawn(task)];
            case 4:
                _a.sent();
                return [4 /*yield*/, effectsHelpers_1.call(delay, interval)];
            case 5:
                _a.sent();
                if (!proc.isStopped)
                    proc.complete(); // make sure we remove the child process from parent.
                return [3 /*break*/, 2];
            case 6: return [3 /*break*/, 0];
            case 7: return [2 /*return*/];
        }
    });
}
exports.throttle = throttle;
//# sourceMappingURL=helpers.js.map