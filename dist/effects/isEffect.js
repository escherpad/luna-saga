"use strict";
/** Created by ge on 3/27/16. */
const effectsHelpers_1 = require("./effectsHelpers");
let effects = [effectsHelpers_1.TAKE, effectsHelpers_1.DISPATCH, effectsHelpers_1.CALL, effectsHelpers_1.SELECT];
function isEffect(obj) {
    return (obj.type && effects.indexOf(obj.type) > -1);
}
exports.isEffect = isEffect;
