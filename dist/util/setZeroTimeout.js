/** Created by ge on 3/28/16. */
/* adapted from Jeff Walden at http://ajaxian.com/archives/settimeout-delay */
"use strict";
var timeouts = [];
var messageName = "@@luna-saga/zero-timeout-message";
function handleMessage(event) {
    if (event.source == window && event.data == messageName) {
        event.stopPropagation();
        if (timeouts.length > 0) {
            var fn = timeouts.shift();
            fn();
        }
    }
}
window.addEventListener("message", handleMessage, true);
function setZeroTimeout(fn) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
}
exports.setZeroTimeout = setZeroTimeout;
