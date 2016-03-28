/** Created by ge on 3/28/16. */
/* adapted from http://ajaxian.com/archives/settimeout-delay */

var timeouts:Array<any> = [];
var messageName:string = "@@luna-saga/zero-timeout-message";

// Like setTimeout, but only takes a function argument.  There's
// no time argument (always zero) and no arguments (you have to
// use a closure).

interface PostMessageEvent extends Event {
    source: Window;
    data: any;
}
function handleMessage(event:PostMessageEvent):void {
    if (event.source == window && event.data == messageName) {
        event.stopPropagation();
        if (timeouts.length > 0) {
            var fn = timeouts.shift();
            fn();
        }
    }
}

window.addEventListener("message", handleMessage, true);

export function setZeroTimeout(fn:()=>any):void {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
}
