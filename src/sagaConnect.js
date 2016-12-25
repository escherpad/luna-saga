"use strict";
var Saga_1 = require("./Saga");
var Sym_1 = require("./util/Sym");
exports.SAGA_CONNECT_ACTION = Sym_1.Sym('SAGA_CONNECT_ACTION');
function sagaConnect(store$, generator, immediate) {
    var process = new Saga_1["default"](generator);
    // update$ is a Subject, so no value can be obtained before the first update happens. This
    // is causing problems to the select effect.
    store$.update$.subscribe(process);
    process.thunk$.subscribe(function (_t) { return store$.dispatch(_t); });
    process.action$.subscribe(function (_a) { return store$.dispatch(_a); });
    if (immediate) {
        process.run();
        // right after run, emit a special connect action, which transmits
        // the state value, to allow `select` and other effects to `take`
        // the state right away.
        var initialUpdate = {
            state: store$.getValue(),
            action: { type: exports.SAGA_CONNECT_ACTION }
        };
        process.next(initialUpdate);
    }
    // if manually run, then the user would need to manually emit the connect action.
    return process;
}
exports.sagaConnect = sagaConnect;
