"use strict";
var Saga_1 = require("./Saga");
function sagaConnect(store$, iterator, immediate) {
    var process = new Saga_1.default(iterator);
    // update$ is a Subject, so no value can be obtained before the first update happens. This
    // is causing problems to the select effect.
    // to the process
    store$.update$.subscribe(process);
    // from the process
    process.thunk$.subscribe(function (_t) { return store$.dispatch(_t); });
    process.action$.subscribe(function (_a) { return store$.dispatch(_a); });
    // process.log$.subscribe()
    if (immediate) {
        process.run();
        // right after run, emit a special connect action, which transmits
        // the state value, to allow `select` and other effects to `take`
        // the state right away.
        var initialUpdate = {
            state: store$.getValue(),
            action: { type: Saga_1.SAGA_CONNECT_ACTION }
        };
        process.next(initialUpdate);
    }
    // if manually run, then the user would need to manually emit the connect action.
    return process;
}
exports.sagaConnect = sagaConnect;
