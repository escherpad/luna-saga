/** Created by ge on 12/6/16. */
import {Store, Thunk, Action, StateActionBundle} from "luna";
import Saga, {SAGA_CONNECT_ACTION} from "./Saga";

export function sagaConnect<TState>(store$: Store<TState>,
                                    iterator: Iterator<any>,
                                    immediate?: boolean): Saga<TState> {
    let process = new Saga<TState>(iterator);

    // update$ is a Subject, so no value can be obtained before the first update happens. This
    // is causing problems to the select effect.

    // to the process
    store$.update$.subscribe(process);
    // from the process
    process.thunk$.subscribe((_t: Thunk) => store$.dispatch(_t));
    process.action$.subscribe((_a: Action) => store$.dispatch(_a));
    // process.log$.subscribe()

    if (immediate) {
        process.run();
        // right after run, emit a special connect action, which transmits
        // the state value, to allow `select` and other effects to `take`
        // the state right away.
        let initialUpdate = {
            state: store$.getValue(),
            action: {type: SAGA_CONNECT_ACTION}
        } as StateActionBundle<TState>;

        process.next(initialUpdate);
    }
    // if manually run, then the user would need to manually emit the connect action.
    return process;
}
