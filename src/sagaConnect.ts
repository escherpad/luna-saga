/** Created by ge on 12/6/16. */
import {Store, Thunk, Action, StateActionBundle} from "luna";
import Saga from "./Saga";
import {Sym, TSym} from "./util/Sym";

export const SAGA_CONNECT_ACTION: TSym = Sym('SAGA_CONNECT_ACTION');

export function sagaConnect<TState>(store$: Store<TState>,
                                    generator: ()=>Iterator<any>,
                                    immediate?: boolean): Saga<TState> {
    let process = new Saga<TState>(generator);
    // update$ is a Subject, so no value can be obtained before the first update happens. This
    // is causing problems to the select effect.
    store$.update$.subscribe(process);
    process.thunk$.subscribe((_t: Thunk) => store$.dispatch(_t));
    process.action$.subscribe((_a: Action) => store$.dispatch(_a));
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
