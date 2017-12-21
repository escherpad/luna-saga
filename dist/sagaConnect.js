"use strict";
var Saga_1 = require("./Saga");
function sagaConnect(store$, iterator, immediate) {
    var process = new Saga_1.default(iterator);
    // update$ is a Subject, so no value can be obtained before the first update happens. This
    // is causing problems to the select effect.
    // connect the process to the update bundle stream of the store.
    // This subscription should be destroyed when process finishes.
    store$.update$.takeUntil(process.term$).subscribe(process);
    // connect the action$ and thunk$ stream to the main store.
    // These streams will complete on process termination
    // since dispatch is just a function, store$ won't be affected (completed).
    // store is usually long-lived, so we don't need to use take until.
    process.thunk$.subscribe(store$.dispatch);
    process.action$.subscribe(store$.dispatch);
    // process.log$.subscribe();
    // process.error$.subscribe();
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
//# sourceMappingURL=sagaConnect.js.map