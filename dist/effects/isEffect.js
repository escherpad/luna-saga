"use strict";
/** Created by ge on 3/27/16. */
var effectsHelpers_1 = require("./effectsHelpers");
var effects = [effectsHelpers_1.TAKE, effectsHelpers_1.DISPATCH, effectsHelpers_1.CALL, effectsHelpers_1.SELECT];
function isEffect(obj) {
    return (!!obj && obj.type && effects.indexOf(obj.type) > -1);
}
exports.isEffect = isEffect;
