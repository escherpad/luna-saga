"use strict";
/** Created by ge on 3/27/16. */
const EFFECT_1 = require("./EFFECT");
function isEffect(obj) {
    return (obj.type === EFFECT_1.EFFECT);
}
exports.isEffect = isEffect;
