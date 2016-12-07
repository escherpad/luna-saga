"use strict";
const Saga_1 = require("./Saga");
function sagaConnect(store$, generator, immediate) {
    let process = new Saga_1.default(generator);
    store$.update$.subscribe(process);
    process.thunk$.subscribe((_t) => store$.dispatch(_t));
    process.action$.subscribe((_a) => store$.dispatch(_a));
    if (immediate)
        process.run();
    return process;
}
exports.sagaConnect = sagaConnect;
